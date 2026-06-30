/**
 * ====================================================================
 *  Users.gs - إدارة فريق العمل والصلاحيات
 * ====================================================================
 */

function getUsers() {
  return readSheetAsObjects('Users').map((row) => ({
    email: row.Email,
    name: row.Name,
    phone: row.Phone,
    active: row.Active,
    role: row.Role,
    permissions: row.Permissions ? JSON.parse(row.Permissions) : {}
  }))
}

function createUser(body, currentUser) {
  if (currentUser.role !== 'admin') throw new Error('فقط المدير يمكنه إضافة مستخدمين')

  const existing = readSheetAsObjects('Users').find((u) => u.Email === body.email)
  if (existing) throw new Error('هذا البريد الإلكتروني مسجّل بالفعل')

  appendRowFromObject('Users', {
    Email: body.email,
    Name: body.name,
    Phone: body.phone || '',
    Active: body.active !== false,
    Role: body.role || 'staff',
    Permissions: JSON.stringify(body.permissions || {}),
    CreatedAt: new Date()
  })

  logAudit(currentUser.email, currentUser.name, 'create', 'User', body.email, 'إضافة مستخدم جديد: ' + body.name, 'نجاح')
  return body
}

function updateUser(body, currentUser) {
  if (currentUser.role !== 'admin') throw new Error('فقط المدير يمكنه تعديل المستخدمين')

  const ok = updateRowById('Users', 'Email', body.email, {
    Name: body.name,
    Phone: body.phone,
    Active: body.active,
    Role: body.role,
    Permissions: JSON.stringify(body.permissions || {})
  })
  if (!ok) throw new Error('المستخدم غير موجود')

  logAudit(currentUser.email, currentUser.name, 'update', 'User', body.email, 'تعديل صلاحيات/بيانات: ' + body.name, 'نجاح')
  return body
}

function deleteUser(body, currentUser) {
  if (currentUser.role !== 'admin') throw new Error('فقط المدير يمكنه حذف المستخدمين')
  if (body.email === currentUser.email) throw new Error('لا يمكنك حذف حسابك الخاص')

  const ok = deleteRowById('Users', 'Email', body.email)
  if (!ok) throw new Error('المستخدم غير موجود')

  logAudit(currentUser.email, currentUser.name, 'delete', 'User', body.email, 'حذف مستخدم', 'نجاح')
  return { email: body.email }
}
