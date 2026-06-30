/**
 * ====================================================================
 *  Backup.gs - النسخ الاحتياطي التلقائي الشهري إلى Google Drive
 * ====================================================================
 * تعمل عبر Trigger زمني يومي (راجع Triggers.gs) ويتحقق هل اليوم هو آخر
 * يوم في الشهر. عند تحقق الشرط: ينسخ ملف الشيت الرئيسي، يحفظه في مجلد
 * EdaraERP-Backups، يحتفظ بآخر 24 نسخة فقط، ويُرسل بريدًا للمدير بالنتيجة.
 */

const BACKUP_FOLDER_NAME = 'EdaraERP-Backups'
const MAX_BACKUPS = 24

/**
 * الدالة التي يستدعيها الـ Trigger اليومي
 * تتحقق من كون اليوم هو آخر يوم في الشهر قبل تنفيذ النسخ الاحتياطي
 */
function dailyBackupCheck() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const isLastDayOfMonth = tomorrow.getDate() === 1
  if (isLastDayOfMonth) {
    runMonthlyBackup(false)
  }
}

/**
 * تنفيذ النسخ الاحتياطي الفعلي
 * @param {boolean} isManual هل تم التشغيل يدويًا من الواجهة (زر "نسخ احتياطي يدوي الآن")
 */
function runMonthlyBackup(isManual) {
  const adminEmail = getSettingValue('AdminEmail', '')
  let backupFile = null

  try {
    const folder = getOrCreateBackupFolder()
    const originalFile = DriveApp.getFileById(getSpreadsheet().getId())

    const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    const fileName = 'EdaraERP-Backup-' + dateStr

    backupFile = originalFile.makeCopy(fileName, folder)
    const fileSizeMB = (backupFile.getSize() / (1024 * 1024)).toFixed(2)

    enforceBackupRetention(folder)

    appendRowFromObject('Backups', {
      Timestamp: new Date(),
      FileName: fileName,
      FileUrl: backupFile.getUrl(),
      FileSizeMB: fileSizeMB,
      Status: 'نجاح',
      ErrorDetails: ''
    })

    logAudit('system', 'النظام', 'backup', 'Backup', backupFile.getId(),
      (isManual ? 'نسخ احتياطي يدوي' : 'نسخ احتياطي شهري تلقائي') + ' - ' + fileName, 'نجاح')

    if (adminEmail) {
      MailApp.sendEmail({
        to: adminEmail,
        subject: '✅ نجاح النسخ الاحتياطي - EdaraERP',
        body:
          'تم تنفيذ النسخ الاحتياطي بنجاح.\n\n' +
          'التاريخ: ' + dateStr + '\n' +
          'حجم الملف: ' + fileSizeMB + ' MB\n' +
          'رابط الملف: ' + backupFile.getUrl() + '\n\n' +
          '— نظام EdaraERP'
      })
    }

    return { success: true, fileUrl: backupFile.getUrl(), fileSizeMB: fileSizeMB }
  } catch (err) {
    appendRowFromObject('Backups', {
      Timestamp: new Date(),
      FileName: '',
      FileUrl: '',
      FileSizeMB: '',
      Status: 'فشل',
      ErrorDetails: err.message
    })

    logAudit('system', 'النظام', 'backup', 'Backup', '', 'فشل النسخ الاحتياطي: ' + err.message, 'فشل')

    if (adminEmail) {
      MailApp.sendEmail({
        to: adminEmail,
        subject: '❌ فشل النسخ الاحتياطي - EdaraERP',
        body:
          'فشلت عملية النسخ الاحتياطي.\n\n' +
          'تفاصيل الخطأ: ' + err.message + '\n' +
          'وقت المحاولة: ' + new Date() + '\n\n' +
          '— نظام EdaraERP'
      })
    }

    throw err
  }
}

function getOrCreateBackupFolder() {
  const folders = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME)
  if (folders.hasNext()) return folders.next()
  return DriveApp.createFolder(BACKUP_FOLDER_NAME)
}

/** الاحتفاظ بآخر 24 نسخة فقط - حذف الأقدم تلقائيًا عند التجاوز */
function enforceBackupRetention(folder) {
  const files = []
  const iterator = folder.getFiles()
  while (iterator.hasNext()) {
    const f = iterator.next()
    files.push({ file: f, date: f.getDateCreated() })
  }

  if (files.length <= MAX_BACKUPS) return

  files.sort((a, b) => a.date - b.date) // الأقدم أولًا
  const toDelete = files.slice(0, files.length - MAX_BACKUPS)
  toDelete.forEach((item) => item.file.setTrashed(true))
}
