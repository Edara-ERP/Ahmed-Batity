/**
 * ====================================================================
 *  EdaraERP - Google Apps Script Backend (نقطة الدخول الرئيسية)
 * ====================================================================
 *
 * هذا الملف هو نقطة الدخول لكل طلبات الواجهة الأمامية.
 * يتعامل مع كل الطلبات عبر POST بحقل "action" موحّد، ويُعيد استجابة
 * بصيغة موحّدة: { success: boolean, data: any, error: string|null }
 *
 * ----------------------------------------------------------------
 * خطوات النشر (Deploy as Web App):
 * ----------------------------------------------------------------
 * 1. افتح Google Sheet جديد، ثم من القائمة: Extensions > Apps Script
 * 2. انسخ كل ملفات .gs الموجودة في مجلد apps-script/ إلى المشروع
 *    (أنشئ ملفًا منفصلًا لكل واحد بنفس الاسم: Code.gs, Auth.gs, ... إلخ)
 * 3. شغّل دالة setupSheets() مرة واحدة يدويًا من المحرر لإنشاء كل الأوراق
 *    والأعمدة المطلوبة تلقائيًا (راجع SheetsSetup.gs)
 * 4. من القائمة: Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me (حسابك)
 *    - Who has access: Anyone (مهم جدًا للسماح للواجهة الأمامية بالاتصال)
 * 5. انسخ رابط الـ Web App الناتج (ينتهي بـ /exec) وضعه في:
 *    src/lib/apiClient.js (متغيّر API_BASE_URL) أو ملف .env كـ VITE_APPS_SCRIPT_URL
 * 6. الصلاحيات المطلوبة عند أول تشغيل: الوصول لـ Google Sheets، Gmail (لإرسال
 *    إشعارات البريد)، وGoogle Drive (للنسخ الاحتياطي). وافق على الكل عند الطلب.
 * 7. لإعداد المزامنة اليومية/الشهرية التلقائية، شغّل دالة createTriggers()
 *    مرة واحدة من المحرر (راجع Triggers.gs)
 * ----------------------------------------------------------------
 */

// مُعرّف ملف Google Sheet الرئيسي (يُملأ تلقائيًا إن تم تشغيل المشروع من داخل الشيت نفسه عبر Container-bound Script)
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet()
}

/**
 * نقطة الدخول لطلبات GET (تُستخدم للتأكد من أن الخدمة تعمل فقط)
 */
/**
 * معالجة طلبات OPTIONS (CORS Preflight) - غير مطلوبة عادة لأننا نستخدم
 * Content-Type: text/plain من الواجهة (Simple Request) لتفادي الـ Preflight أصلًا،
 * لكنها مُضافة هنا كإجراء احترازي إضافي لبعض المتصفحات.
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, data: 'EdaraERP API يعمل بنجاح ✅', error: null })
  ).setMimeType(ContentService.MimeType.JSON)
}

/**
 * نقطة الدخول الرئيسية لكل عمليات النظام (POST)
 */
function doPost(e) {
  let response

  try {
    const body = JSON.parse(e.postData.contents)
    const action = body.action

    if (!action) {
      throw new Error('لم يتم تحديد الإجراء (action) المطلوب')
    }

    // التحقق من الجلسة لكل الإجراءات ما عدا تسجيل الدخول نفسه
    let currentUser = null
    if (action !== 'verifyGoogleLogin') {
      currentUser = authenticateRequest(body)
      if (!currentUser) {
        return jsonResponse({ success: false, data: null, error: 'انتهت الجلسة أو غير مصرّح، يرجى تسجيل الدخول مرة أخرى' })
      }
    }

    // التحقق من الصلاحيات (Role-based Access Control) - لا يُعتمد فقط على إخفاء الأزرار بالواجهة
    if (currentUser && !checkPermission(currentUser, action)) {
      return jsonResponse({ success: false, data: null, error: 'لا تملك صلاحية تنفيذ هذا الإجراء' })
    }

    const result = routeAction(action, body, currentUser)
    response = { success: true, data: result, error: null }
  } catch (err) {
    response = { success: false, data: null, error: err.message || 'حدث خطأ غير متوقع في الخادم' }
  }

  return jsonResponse(response)
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

/**
 * موجّه الإجراءات (Router) - يربط كل action بالدالة المسؤولة عنه
 * استخدام LockService هنا يضمن عدم تعارض الكتابة عند تعدد المستخدمين في نفس اللحظة
 */
function routeAction(action, body, currentUser) {
  const writeActions = [
    'createProduct', 'updateProduct', 'deleteProduct',
    'createCustomer', 'updateCustomer', 'deleteCustomer',
    'createSupplier', 'updateSupplier', 'deleteSupplier',
    'createSalesInvoice', 'updateSalesInvoice', 'deleteSalesInvoice',
    'createPurchaseInvoice', 'updatePurchaseInvoice', 'deletePurchaseInvoice',
    'createExpense', 'updateExpense', 'deleteExpense',
    'createUser', 'updateUser', 'deleteUser'
  ]

  let lock = null
  if (writeActions.indexOf(action) !== -1) {
    lock = LockService.getScriptLock()
    lock.waitLock(15000) // الانتظار حتى 15 ثانية لتفادي تعارض الكتابة المتزامن
  }

  try {
    switch (action) {
      case 'verifyGoogleLogin': return verifyGoogleLogin(body)

      case 'getProducts': return getProducts()
      case 'createProduct': return createProduct(body, currentUser)
      case 'updateProduct': return updateProduct(body, currentUser)
      case 'deleteProduct': return deleteProduct(body, currentUser)

      case 'getCustomers': return getParties('Customers')
      case 'createCustomer': return createParty('Customers', body, currentUser)
      case 'updateCustomer': return updateParty('Customers', body, currentUser)
      case 'deleteCustomer': return deleteParty('Customers', body, currentUser)

      case 'getSuppliers': return getParties('Suppliers')
      case 'createSupplier': return createParty('Suppliers', body, currentUser)
      case 'updateSupplier': return updateParty('Suppliers', body, currentUser)
      case 'deleteSupplier': return deleteParty('Suppliers', body, currentUser)

      case 'getSalesInvoices': return getInvoices('SalesInvoices')
      case 'createSalesInvoice': return createInvoice('sale', body, currentUser)
      case 'updateSalesInvoice': return updateInvoice('SalesInvoices', body, currentUser)
      case 'deleteSalesInvoice': return deleteInvoice('SalesInvoices', body, currentUser)

      case 'getPurchaseInvoices': return getInvoices('PurchaseInvoices')
      case 'createPurchaseInvoice': return createInvoice('purchase', body, currentUser)
      case 'updatePurchaseInvoice': return updateInvoice('PurchaseInvoices', body, currentUser)
      case 'deletePurchaseInvoice': return deleteInvoice('PurchaseInvoices', body, currentUser)

      case 'getExpenses': return getExpenses()
      case 'createExpense': return createExpense(body, currentUser)
      case 'updateExpense': return updateExpense(body, currentUser)
      case 'deleteExpense': return deleteExpense(body, currentUser)

      case 'getUsers': return getUsers()
      case 'createUser': return createUser(body, currentUser)
      case 'updateUser': return updateUser(body, currentUser)
      case 'deleteUser': return deleteUser(body, currentUser)

      case 'getAuditLog': return getAuditLog()
      case 'runManualBackup': return runMonthlyBackup(true)

      default:
        throw new Error('إجراء غير معروف: ' + action)
    }
  } finally {
    if (lock) lock.releaseLock()
  }
}
