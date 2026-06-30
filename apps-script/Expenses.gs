/**
 * ====================================================================
 *  Expenses.gs - إدارة المصروفات
 * ====================================================================
 */

function getExpenses() {
  return readSheetAsObjects('Expenses').map((row) => ({
    id: row.Id,
    category: row.Category,
    amount: Number(row.Amount || 0),
    date: formatDate(row.Date),
    notes: row.Notes,
    createdBy: row.CreatedBy
  }))
}

function createExpense(body, currentUser) {
  const id = generateId()
  appendRowFromObject('Expenses', {
    Id: id,
    Category: body.category,
    Amount: body.amount,
    Date: body.date || new Date(),
    Notes: body.notes || '',
    CreatedBy: currentUser.email,
    CreatedAt: new Date()
  })
  logAudit(currentUser.email, currentUser.name, 'create', 'Expense', id, 'إضافة مصروف: ' + body.category + ' بقيمة ' + body.amount, 'نجاح')
  return { id: id, ...body }
}

function updateExpense(body, currentUser) {
  const ok = updateRowById('Expenses', 'Id', body.id, {
    Category: body.category,
    Amount: body.amount,
    Date: body.date,
    Notes: body.notes
  })
  if (!ok) throw new Error('المصروف غير موجود')
  logAudit(currentUser.email, currentUser.name, 'update', 'Expense', body.id, 'تعديل مصروف', 'نجاح')
  return body
}

function deleteExpense(body, currentUser) {
  const ok = deleteRowById('Expenses', 'Id', body.id)
  if (!ok) throw new Error('المصروف غير موجود')
  logAudit(currentUser.email, currentUser.name, 'delete', 'Expense', body.id, 'حذف مصروف', 'نجاح')
  return { id: body.id }
}
