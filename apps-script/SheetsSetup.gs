/**
 * ====================================================================
 *  SheetsSetup.gs - إنشاء أوراق العمل والأعمدة تلقائيًا
 * ====================================================================
 * شغّل دالة setupSheets() مرة واحدة فقط من محرر Apps Script لإنشاء
 * كل الأوراق المطلوبة في الشيت الحالي بأعمدتها الصحيحة.
 */

const SHEETS_SCHEMA = {
  Products: ['Id', 'Name', 'Barcode', 'BaseUnit', 'StockQty', 'ReorderLevel', 'ExpiryDate', 'ExpiryAlertDays', 'Units', 'BuyPrice', 'ImageUrl', 'CreatedAt', 'UpdatedAt'],
  Customers: ['Id', 'Name', 'Phone', 'Address', 'Balance', 'CreditLimit', 'LastInvoiceDate', 'CreatedAt'],
  Suppliers: ['Id', 'Name', 'Phone', 'Address', 'Balance', 'CreditLimit', 'LastInvoiceDate', 'CreatedAt'],
  SalesInvoices: ['Id', 'InvoiceNumber', 'PartyId', 'PartyName', 'Date', 'TotalAmount', 'PreviousBalance', 'CurrentBalance', 'IsCredit', 'CreatedBy', 'CreatedAt'],
  SalesInvoiceItems: ['Id', 'InvoiceId', 'ProductId', 'ProductName', 'UnitName', 'UnitFactor', 'Qty', 'Price', 'Total'],
  PurchaseInvoices: ['Id', 'InvoiceNumber', 'PartyId', 'PartyName', 'Date', 'TotalAmount', 'PreviousBalance', 'CurrentBalance', 'IsCredit', 'CreatedBy', 'CreatedAt'],
  PurchaseInvoiceItems: ['Id', 'InvoiceId', 'ProductId', 'ProductName', 'UnitName', 'UnitFactor', 'Qty', 'Price', 'Total'],
  Expenses: ['Id', 'Category', 'Amount', 'Date', 'Notes', 'CreatedBy', 'CreatedAt'],
  Users: ['Email', 'Name', 'Phone', 'Active', 'Role', 'Permissions', 'CreatedAt'],
  AuditLog: ['Timestamp', 'UserEmail', 'UserName', 'ActionType', 'EntityType', 'EntityId', 'Details', 'Status'],
  Backups: ['Timestamp', 'FileName', 'FileUrl', 'FileSizeMB', 'Status', 'ErrorDetails'],
  StockAlerts: ['ProductId', 'ProductName', 'AlertType', 'Details', 'CreatedAt', 'Resolved'],
  CustomerLedger: ['Id', 'CustomerId', 'Date', 'Type', 'Amount', 'BalanceAfter', 'RefInvoiceId'],
  SupplierLedger: ['Id', 'SupplierId', 'Date', 'Type', 'Amount', 'BalanceAfter', 'RefInvoiceId'],
  ProductUnits: ['Id', 'ProductId', 'UnitName', 'Factor', 'SellPrice'],
  PushSubscriptions: ['UserEmail', 'Endpoint', 'Keys', 'CreatedAt'],
  Settings: ['Key', 'Value']
}

function setupSheets() {
  const ss = getSpreadsheet()

  Object.keys(SHEETS_SCHEMA).forEach((sheetName) => {
    let sheet = ss.getSheetByName(sheetName)
    if (!sheet) {
      sheet = ss.insertSheet(sheetName)
    }
    const headers = SHEETS_SCHEMA[sheetName]
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0d7377').setFontColor('#ffffff')
  })

  // حذف الورقة الافتراضية "Sheet1" إن وُجدت وكانت فارغة
  const defaultSheet = ss.getSheetByName('Sheet1')
  if (defaultSheet && defaultSheet.getLastRow() <= 1) {
    ss.deleteSheet(defaultSheet)
  }

  // إضافة مستخدم مدير افتراضي (يجب تعديل البريد لاحقًا يدويًا من الشيت)
  const usersSheet = ss.getSheetByName('Users')
  if (usersSheet.getLastRow() === 1) {
    usersSheet.appendRow([
      'admin@example.com', 'المدير العام', '', true, 'admin', '{}', new Date()
    ])
  }

  // إعدادات افتراضية
  const settingsSheet = ss.getSheetByName('Settings')
  if (settingsSheet.getLastRow() === 1) {
    settingsSheet.appendRow(['AdminEmail', 'admin@example.com'])
    settingsSheet.appendRow(['CompanyName', 'شركتي'])
  }

  SpreadsheetApp.getUi().alert('تم إنشاء كل الأوراق المطلوبة بنجاح ✅\nلا تنسَ تعديل بريد المدير الافتراضي في شيت Users.')
}
