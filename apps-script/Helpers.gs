/**
 * ====================================================================
 *  Helpers.gs - دوال مساعدة عامة (CRUD على الشيتات + سجل العمليات)
 * ====================================================================
 */

function generateId() {
  return Utilities.getUuid()
}

/** قراءة كل صفوف ورقة معينة كمصفوفة Objects */
function readSheetAsObjects(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName)
  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  const headers = data[0]
  const rows = []
  for (let i = 1; i < data.length; i++) {
    if (data[i].every((c) => c === '')) continue // تجاهل الصفوف الفارغة
    rows.push(rowToObject(headers, data[i]))
  }
  return rows
}

/** إضافة صف جديد لورقة بناءً على Object يطابق أسماء الأعمدة */
function appendRowFromObject(sheetName, obj) {
  const sheet = getSpreadsheet().getSheetByName(sheetName)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const row = headers.map((h) => (obj[h] !== undefined ? obj[h] : ''))
  sheet.appendRow(row)
}

/** تحديث صف موجود بناءً على عمود المعرّف (Id أو Email) */
function updateRowById(sheetName, idColumnName, idValue, updates) {
  const sheet = getSpreadsheet().getSheetByName(sheetName)
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const idCol = headers.indexOf(idColumnName)

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idValue)) {
      headers.forEach((h, colIdx) => {
        if (updates[h] !== undefined) {
          sheet.getRange(i + 1, colIdx + 1).setValue(updates[h])
        }
      })
      return true
    }
  }
  return false
}

/** حذف صف بناءً على عمود المعرّف */
function deleteRowById(sheetName, idColumnName, idValue) {
  const sheet = getSpreadsheet().getSheetByName(sheetName)
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const idCol = headers.indexOf(idColumnName)

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idValue)) {
      sheet.deleteRow(i + 1)
      return true
    }
  }
  return false
}

/**
 * تسجيل عملية في سجل التدقيق (AuditLog)
 * يُستدعى عند كل عملية حساسة: إنشاء/تعديل/حذف فاتورة، منتج، مستخدم، تغيير صلاحيات...إلخ
 */
function logAudit(userEmail, userName, actionType, entityType, entityId, details, status) {
  try {
    appendRowFromObject('AuditLog', {
      Timestamp: new Date(),
      UserEmail: userEmail,
      UserName: userName,
      ActionType: actionType,
      EntityType: entityType,
      EntityId: entityId,
      Details: details,
      Status: status
    })
  } catch (err) {
    // لا نريد أن يتسبب فشل تسجيل اللوج بفشل العملية الأساسية نفسها
    Logger.log('فشل تسجيل Audit Log: ' + err.message)
  }
}

function getSettingValue(key, fallback) {
  const settings = readSheetAsObjects('Settings')
  const found = settings.find((s) => s.Key === key)
  return found ? found.Value : fallback
}
