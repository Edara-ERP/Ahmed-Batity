/**
 * ====================================================================
 *  AuditLogApi.gs - استرجاع سجل العمليات (للمدير فقط من واجهة المستخدم)
 * ====================================================================
 */

function getAuditLog() {
  // إرجاع آخر 500 سجل فقط لتفادي بطء الاستجابة مع نمو السجل بمرور الوقت
  const rows = readSheetAsObjects('AuditLog')
  return rows
    .slice(Math.max(0, rows.length - 500))
    .reverse()
    .map((row) => ({
      timestamp: formatDate(row.Timestamp) + ' ' + (row.Timestamp instanceof Date ? Utilities.formatDate(row.Timestamp, Session.getScriptTimeZone(), 'HH:mm') : ''),
      userEmail: row.UserEmail,
      userName: row.UserName,
      actionType: row.ActionType,
      entityType: row.EntityType,
      entityId: row.EntityId,
      details: row.Details,
      status: row.Status
    }))
}
