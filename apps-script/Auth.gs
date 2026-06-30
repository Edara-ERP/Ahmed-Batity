/**
 * ====================================================================
 *  Auth.gs - تسجيل الدخول عبر Google والتحقق من الصلاحيات
 * ====================================================================
 */

/**
 * التحقق من تسجيل الدخول الأول عبر Google
 * يتحقق هل البريد الإلكتروني موجود في شيت Users، وإن لم يكن موجودًا يرفض الدخول
 */
function verifyGoogleLogin(body) {
  const email = body.email
  if (!email) throw new Error('بيانات الدخول غير صالحة')

  const sheet = getSpreadsheet().getSheetByName('Users')
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const emailCol = headers.indexOf('Email')
  const activeCol = headers.indexOf('Active')

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      if (!data[i][activeCol]) {
        throw new Error('حسابك غير نشط، تواصل مع المدير')
      }
      const user = rowToObject(headers, data[i])
      const token = generateToken(email)
      saveSessionToken(email, token)
      logAudit(email, user.Name, 'login', 'User', email, 'تسجيل دخول ناجح', 'نجاح')

      return {
        token: token,
        role: user.Role || 'staff',
        permissions: JSON.parse(user.Permissions || '{}')
      }
    }
  }

  // البريد غير موجود في شيت Users
  logAudit(email, body.name || email, 'login', 'User', email, 'محاولة دخول مرفوضة - غير مصرّح', 'فشل')
  throw new Error('لا تملك صلاحية الوصول، تواصل مع المدير')
}

/** توليد توكن بسيط (Hash) للجلسة */
function generateToken(email) {
  const raw = email + '|' + new Date().getTime() + '|' + Math.random()
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw))
}

/** حفظ توكن الجلسة في PropertiesService مع صلاحية انتهاء (12 ساعة) */
function saveSessionToken(email, token) {
  const props = PropertiesService.getScriptProperties()
  const expiresAt = new Date().getTime() + 12 * 60 * 60 * 1000
  props.setProperty('session_' + email, JSON.stringify({ token: token, expiresAt: expiresAt }))
}

/**
 * التحقق من صلاحية الطلب (الجلسة) - يُستدعى مع كل طلب باستثناء تسجيل الدخول
 */
function authenticateRequest(body) {
  const email = body.userEmail
  const token = body.token
  if (!email || !token) return null

  const props = PropertiesService.getScriptProperties()
  const sessionRaw = props.getProperty('session_' + email)
  if (!sessionRaw) return null

  const session = JSON.parse(sessionRaw)
  if (session.token !== token) return null
  if (new Date().getTime() > session.expiresAt) return null

  const sheet = getSpreadsheet().getSheetByName('Users')
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const emailCol = headers.indexOf('Email')

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      const user = rowToObject(headers, data[i])
      return {
        email: email,
        name: user.Name,
        role: user.Role || 'staff',
        permissions: JSON.parse(user.Permissions || '{}')
      }
    }
  }
  return null
}

/**
 * التحقق من الصلاحية (Role-based Access Control) من جهة الخادم
 * لا يُعتمد على إخفاء الأزرار بالواجهة فقط - هذا هو خط الدفاع الحقيقي
 */
function checkPermission(user, action) {
  if (user.role === 'admin') return true

  // خريطة الإجراءات إلى الأقسام والمستويات المطلوبة
  const map = {
    createProduct: ['products', 'edit'], updateProduct: ['products', 'edit'], deleteProduct: ['products', 'delete'],
    createCustomer: ['customers', 'edit'], updateCustomer: ['customers', 'edit'], deleteCustomer: ['customers', 'delete'],
    createSupplier: ['suppliers', 'edit'], updateSupplier: ['suppliers', 'edit'], deleteSupplier: ['suppliers', 'delete'],
    createSalesInvoice: ['sales', 'edit'], updateSalesInvoice: ['sales', 'edit'], deleteSalesInvoice: ['sales', 'delete'],
    createPurchaseInvoice: ['purchases', 'edit'], updatePurchaseInvoice: ['purchases', 'edit'], deletePurchaseInvoice: ['purchases', 'delete'],
    createExpense: ['expenses', 'edit'], updateExpense: ['expenses', 'edit'], deleteExpense: ['expenses', 'delete'],
    createUser: ['users', 'full'], updateUser: ['users', 'full'], deleteUser: ['users', 'full']
  }

  const requirement = map[action]
  if (!requirement) return true // إجراءات القراءة (get*) متاحة لأي مستخدم مسجّل دخوله

  const [section, level] = requirement
  const userLevel = user.permissions[section]
  if (!userLevel) return false

  const order = ['view', 'edit', 'delete', 'full']
  return order.indexOf(userLevel) >= order.indexOf(level)
}

/** تحويل صف من الشيت إلى Object باستخدام رؤوس الأعمدة */
function rowToObject(headers, row) {
  const obj = {}
  headers.forEach((h, i) => (obj[h] = row[i]))
  return obj
}
