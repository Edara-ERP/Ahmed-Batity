/**
 * ====================================================================
 *  Triggers.gs - إعداد المشغّلات الزمنية (Time-driven Triggers)
 * ====================================================================
 * شغّل دالة createTriggers() مرة واحدة فقط من محرر Apps Script بعد النشر
 * لتفعيل الفحص اليومي للنسخ الاحتياطي وتنبيهات المخزون تلقائيًا.
 */

function createTriggers() {
  // حذف أي مشغّلات قديمة لتفادي التكرار عند إعادة التشغيل
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t))

  // فحص يومي الساعة 1 صباحًا: النسخ الاحتياطي (يُنفَّذ فقط إن كان آخر يوم بالشهر)
  ScriptApp.newTrigger('dailyBackupCheck')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create()

  // فحص يومي الساعة 8 صباحًا: تنبيهات المخزون وقرب انتهاء الصلاحية
  ScriptApp.newTrigger('dailyStockAlertsCheck')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create()

  SpreadsheetApp.getUi().alert('تم تفعيل المشغّلات الزمنية بنجاح ✅\n- فحص النسخ الاحتياطي: يوميًا 1 صباحًا\n- فحص تنبيهات المخزون: يوميًا 8 صباحًا')
}
