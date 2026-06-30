/**
 * ====================================================================
 *  Invoices.gs - فواتير البيع والشراء (مع تحديث المخزون والأرصدة تلقائيًا)
 * ====================================================================
 */

function getInvoices(sheetName) {
  const itemsSheetName = sheetName + 'Items'
  const items = readSheetAsObjects(itemsSheetName)

  return readSheetAsObjects(sheetName).map((row) => ({
    id: row.Id,
    invoiceNumber: row.InvoiceNumber,
    partyId: row.PartyId,
    partyName: row.PartyName,
    date: formatDate(row.Date),
    totalAmount: Number(row.TotalAmount || 0),
    previousBalance: Number(row.PreviousBalance || 0),
    currentBalance: Number(row.CurrentBalance || 0),
    isCredit: row.IsCredit,
    createdBy: row.CreatedBy,
    items: items
      .filter((it) => it.InvoiceId === row.Id)
      .map((it) => ({
        productId: it.ProductId,
        name: it.ProductName,
        unitName: it.UnitName,
        unitFactor: Number(it.UnitFactor || 1),
        qty: Number(it.Qty),
        price: Number(it.Price),
        total: Number(it.Total)
      }))
  }))
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

/**
 * إنشاء فاتورة بيع أو شراء كاملة:
 * 1. حفظ رأس الفاتورة وبنودها
 * 2. تحديث المخزون لكل منتج (خصم عند البيع، إضافة عند الشراء) بالوحدة الأساسية
 * 3. تحديث رصيد العميل/المورد إذا كانت آجلة
 */
function createInvoice(type, body, currentUser) {
  const isPurchase = type === 'purchase'
  const sheetName = isPurchase ? 'PurchaseInvoices' : 'SalesInvoices'
  const itemsSheetName = sheetName + 'Items'
  const partySheet = isPurchase ? 'Suppliers' : 'Customers'

  const id = generateId()
  const invoiceNumber = generateInvoiceNumber(sheetName)

  // حفظ رأس الفاتورة
  appendRowFromObject(sheetName, {
    Id: id,
    InvoiceNumber: invoiceNumber,
    PartyId: body.partyId || '',
    PartyName: body.partyName,
    Date: body.date || new Date(),
    TotalAmount: body.totalAmount,
    PreviousBalance: body.previousBalance || 0,
    CurrentBalance: body.currentBalance || 0,
    IsCredit: !!body.isCredit,
    CreatedBy: currentUser.email,
    CreatedAt: new Date()
  })

  // حفظ بنود الفاتورة + تحديث المخزون
  ;(body.items || []).forEach((item) => {
    appendRowFromObject(itemsSheetName, {
      Id: generateId(),
      InvoiceId: id,
      ProductId: item.productId,
      ProductName: item.name,
      UnitName: item.unitName,
      UnitFactor: item.unitFactor || 1,
      Qty: item.qty,
      Price: item.price,
      Total: item.total
    })

    const deltaBaseUnits = (item.qty || 0) * (item.unitFactor || 1) * (isPurchase ? 1 : -1)
    if (item.productId) adjustProductStock(item.productId, deltaBaseUnits)
  })

  // تحديث رصيد العميل/المورد إذا كانت الفاتورة آجلة
  if (body.partyId && body.isCredit) {
    updateRowById(partySheet, 'Id', body.partyId, {
      Balance: body.currentBalance,
      LastInvoiceDate: body.date || new Date()
    })
    const ledgerSheet = isPurchase ? 'SupplierLedger' : 'CustomerLedger'
    const ledgerIdField = isPurchase ? 'SupplierId' : 'CustomerId'
    appendRowFromObject(ledgerSheet, {
      Id: generateId(),
      [ledgerIdField]: body.partyId,
      Date: body.date || new Date(),
      Type: 'فاتورة',
      Amount: body.totalAmount,
      BalanceAfter: body.currentBalance,
      RefInvoiceId: id
    })
  }

  logAudit(currentUser.email, currentUser.name, 'create', isPurchase ? 'PurchaseInvoice' : 'SalesInvoice', id,
    'إنشاء فاتورة رقم ' + invoiceNumber + ' بإجمالي ' + body.totalAmount, 'نجاح')

  return { id: id, invoiceNumber: invoiceNumber, ...body }
}

function generateInvoiceNumber(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName)
  const lastRow = sheet.getLastRow()
  const prefix = sheetName === 'SalesInvoices' ? 'S' : 'P'
  return prefix + '-' + String(lastRow).padStart(6, '0')
}

function updateInvoice(sheetName, body, currentUser) {
  const ok = updateRowById(sheetName, 'Id', body.id, {
    PartyName: body.partyName,
    TotalAmount: body.totalAmount,
    CurrentBalance: body.currentBalance
  })
  if (!ok) throw new Error('الفاتورة غير موجودة')
  logAudit(currentUser.email, currentUser.name, 'update', sheetName, body.id, 'تعديل فاتورة', 'نجاح')
  return body
}

function deleteInvoice(sheetName, body, currentUser) {
  const ok = deleteRowById(sheetName, 'Id', body.id)
  if (!ok) throw new Error('الفاتورة غير موجودة')
  logAudit(currentUser.email, currentUser.name, 'delete', sheetName, body.id, 'حذف فاتورة', 'نجاح')
  return { id: body.id }
}
