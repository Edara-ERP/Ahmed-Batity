/**
 * ====================================================================
 *  StockAlerts.gs - فحص دوري لتنبيهات نقص المخزون وقرب انتهاء الصلاحية
 * ====================================================================
 * يعمل عبر Trigger يومي (راجع Triggers.gs)، يفحص كل المنتجات، يحدّث
 * شيت StockAlerts، ويرسل بريدًا للمدير عند ظهور تنبيهات جديدة فقط.
 */

function dailyStockAlertsCheck() {
  const products = getProducts()
  const newAlerts = []

  products.forEach((p) => {
    if (p.stockQty <= p.reorderLevel) {
      newAlerts.push({
        ProductId: p.id,
        ProductName: p.name,
        AlertType: 'نقص مخزون',
        Details: 'الكمية المتاحة ' + p.stockQty + ' (الحد الأدنى ' + p.reorderLevel + ')',
        CreatedAt: new Date(),
        Resolved: false
      })
    }

    if (p.expiryDate) {
      const daysLeft = Math.ceil((new Date(p.expiryDate) - new Date()) / 86400000)
      if (daysLeft <= (p.expiryAlertDays || 30)) {
        newAlerts.push({
          ProductId: p.id,
          ProductName: p.name,
          AlertType: daysLeft < 0 ? 'منتهي الصلاحية' : 'قرب انتهاء الصلاحية',
          Details: daysLeft < 0 ? 'منتهي منذ ' + Math.abs(daysLeft) + ' يوم' : 'متبقي ' + daysLeft + ' يوم',
          CreatedAt: new Date(),
          Resolved: false
        })
      }
    }
  })

  // مقارنة بالتنبيهات الموجودة لتفادي تكرار نفس التنبيه يوميًا
  const existingAlerts = readSheetAsObjects('StockAlerts')
  const existingKeys = new Set(existingAlerts.map((a) => a.ProductId + '|' + a.AlertType))

  const trulyNew = newAlerts.filter((a) => !existingKeys.has(a.ProductId + '|' + a.AlertType))
  trulyNew.forEach((alert) => appendRowFromObject('StockAlerts', alert))

  if (trulyNew.length > 0) {
    notifyAdminOfNewAlerts(trulyNew)
  }

  return { newAlertsCount: trulyNew.length }
}

function notifyAdminOfNewAlerts(alerts) {
  const adminEmail = getSettingValue('AdminEmail', '')
  if (!adminEmail) return

  const lines = alerts.map((a) => '- ' + a.ProductName + ': ' + a.AlertType + ' (' + a.Details + ')').join('\n')

  MailApp.sendEmail({
    to: adminEmail,
    subject: '⚠️ تنبيهات مخزون جديدة - EdaraERP (' + alerts.length + ')',
    body: 'ظهرت التنبيهات التالية في فحص اليوم:\n\n' + lines + '\n\n— نظام EdaraERP'
  })
}
