/**
 * ====================================================================
 *  Parties.gs - العملاء والموردين (حسابات آجلة + كشف حساب)
 * ====================================================================
 */

function getParties(sheetName) {
  const ledgerSheet = sheetName === 'Customers' ? 'CustomerLedger' : 'SupplierLedger'
  const ledgerIdField = sheetName === 'Customers' ? 'CustomerId' : 'SupplierId'
  const ledgerRows = readSheetAsObjects(ledgerSheet)

  return readSheetAsObjects(sheetName).map((row) => ({
    id: row.Id,
    name: row.Name,
    phone: row.Phone,
    address: row.Address,
    balance: Number(row.Balance || 0),
    creditLimit: Number(row.CreditLimit || 0),
    lastInvoiceDate: row.LastInvoiceDate,
    ledger: ledgerRows
      .filter((l) => l[ledgerIdField] === row.Id)
      .map((l) => ({ date: l.Date, type: l.Type, amount: Number(l.Amount), balanceAfter: Number(l.BalanceAfter) }))
  }))
}

function createParty(sheetName, body, currentUser) {
  const id = generateId()
  appendRowFromObject(sheetName, {
    Id: id,
    Name: body.name,
    Phone: body.phone || '',
    Address: body.address || '',
    Balance: body.balance || 0,
    CreditLimit: body.creditLimit || 0,
    LastInvoiceDate: '',
    CreatedAt: new Date()
  })
  logAudit(currentUser.email, currentUser.name, 'create', sheetName.slice(0, -1), id, 'إنشاء: ' + body.name, 'نجاح')
  return { id: id, ...body }
}

function updateParty(sheetName, body, currentUser) {
  // إذا تغيّر الرصيد، نسجّل حركة في دفتر الأستاذ (Ledger) تلقائيًا
  const parties = readSheetAsObjects(sheetName)
  const existing = parties.find((p) => p.Id === body.id)
  const oldBalance = existing ? Number(existing.Balance || 0) : 0

  const ok = updateRowById(sheetName, 'Id', body.id, {
    Name: body.name,
    Phone: body.phone,
    Address: body.address,
    Balance: body.balance,
    CreditLimit: body.creditLimit
  })
  if (!ok) throw new Error('السجل غير موجود')

  if (body.balance !== undefined && body.balance !== oldBalance) {
    const ledgerSheet = sheetName === 'Customers' ? 'CustomerLedger' : 'SupplierLedger'
    const ledgerIdField = sheetName === 'Customers' ? 'CustomerId' : 'SupplierId'
    const diff = body.balance - oldBalance
    appendRowFromObject(ledgerSheet, {
      Id: generateId(),
      [ledgerIdField]: body.id,
      Date: new Date(),
      Type: diff > 0 ? 'فاتورة/زيادة' : 'دفعة/تخفيض',
      Amount: Math.abs(diff),
      BalanceAfter: body.balance,
      RefInvoiceId: body.refInvoiceId || ''
    })
  }

  logAudit(currentUser.email, currentUser.name, 'update', sheetName.slice(0, -1), body.id, 'تعديل: ' + body.name, 'نجاح')
  return body
}

function deleteParty(sheetName, body, currentUser) {
  const ok = deleteRowById(sheetName, 'Id', body.id)
  if (!ok) throw new Error('السجل غير موجود')
  logAudit(currentUser.email, currentUser.name, 'delete', sheetName.slice(0, -1), body.id, 'حذف', 'نجاح')
  return { id: body.id }
}
