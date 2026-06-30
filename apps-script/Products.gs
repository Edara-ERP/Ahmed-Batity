/**
 * ====================================================================
 *  Products.gs - إدارة المنتجات (وحدات قياس متعددة + تنبيهات المخزون)
 * ====================================================================
 */

function getProducts() {
  return readSheetAsObjects('Products').map(parseProductRow)
}

function parseProductRow(row) {
  return {
    id: row.Id,
    name: row.Name,
    barcode: row.Barcode,
    baseUnit: row.BaseUnit,
    stockQty: Number(row.StockQty || 0),
    reorderLevel: Number(row.ReorderLevel || 0),
    expiryDate: row.ExpiryDate,
    expiryAlertDays: Number(row.ExpiryAlertDays || 30),
    units: row.Units ? JSON.parse(row.Units) : [],
    buyPrice: Number(row.BuyPrice || 0),
    imageUrl: row.ImageUrl
  }
}

function createProduct(body, currentUser) {
  const id = generateId()
  const now = new Date()

  appendRowFromObject('Products', {
    Id: id,
    Name: body.name,
    Barcode: body.barcode || '',
    BaseUnit: body.baseUnit || 'قطعة',
    StockQty: body.stockQty || 0,
    ReorderLevel: body.reorderLevel || 0,
    ExpiryDate: body.expiryDate || '',
    ExpiryAlertDays: body.expiryAlertDays || 30,
    Units: JSON.stringify(body.units || []),
    BuyPrice: body.buyPrice || 0,
    ImageUrl: body.imageUrl || '',
    CreatedAt: now,
    UpdatedAt: now
  })

  logAudit(currentUser.email, currentUser.name, 'create', 'Product', id, 'إنشاء منتج: ' + body.name, 'نجاح')
  return { id: id, ...body }
}

function updateProduct(body, currentUser) {
  const ok = updateRowById('Products', 'Id', body.id, {
    Name: body.name,
    Barcode: body.barcode,
    BaseUnit: body.baseUnit,
    StockQty: body.stockQty,
    ReorderLevel: body.reorderLevel,
    ExpiryDate: body.expiryDate,
    ExpiryAlertDays: body.expiryAlertDays,
    Units: JSON.stringify(body.units || []),
    BuyPrice: body.buyPrice,
    ImageUrl: body.imageUrl,
    UpdatedAt: new Date()
  })
  if (!ok) throw new Error('المنتج غير موجود')

  logAudit(currentUser.email, currentUser.name, 'update', 'Product', body.id, 'تعديل منتج: ' + body.name, 'نجاح')
  return body
}

function deleteProduct(body, currentUser) {
  const ok = deleteRowById('Products', 'Id', body.id)
  if (!ok) throw new Error('المنتج غير موجود')
  logAudit(currentUser.email, currentUser.name, 'delete', 'Product', body.id, 'حذف منتج', 'نجاح')
  return { id: body.id }
}

/**
 * تحديث كمية المخزون لمنتج معيّن (يُستخدم عند تأكيد فاتورة بيع/شراء)
 * delta: قيمة موجبة للإضافة (شراء/مرتجع بيع)، وسالبة للخصم (بيع/مرتجع شراء)
 * deltaBaseUnits يجب أن يكون محسوبًا بالفعل بالوحدة الأساسية للمنتج (بعد ضرب معامل التحويل)
 */
function adjustProductStock(productId, deltaBaseUnits) {
  const sheet = getSpreadsheet().getSheetByName('Products')
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const idCol = headers.indexOf('Id')
  const qtyCol = headers.indexOf('StockQty')

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === productId) {
      const newQty = Number(data[i][qtyCol] || 0) + deltaBaseUnits
      sheet.getRange(i + 1, qtyCol + 1).setValue(newQty)
      return newQty
    }
  }
  return null
}
