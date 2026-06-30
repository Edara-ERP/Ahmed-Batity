// src/lib/db.js
// قاعدة بيانات محلية (IndexedDB عبر Dexie.js) لدعم العمل دون اتصال (Offline-first)
import Dexie from 'dexie'

export const db = new Dexie('EdaraERP_DB')

db.version(1).stores({
  // تخزين مؤقت (Cache) لنتائج القوائم المتكررة لتقليل الطلبات لـ Google Sheets
  products: 'localId, id, name, barcode, updatedAt',
  customers: 'localId, id, name, phone, updatedAt',
  suppliers: 'localId, id, name, phone, updatedAt',
  salesInvoices: 'localId, id, customerId, date, synced',
  purchaseInvoices: 'localId, id, supplierId, date, synced',
  expenses: 'localId, id, date, synced',

  // قائمة انتظار المزامنة: كل عملية تُنشأ أثناء انقطاع الاتصال تُخزَّن هنا بمعرّف فريد (UUID)
  syncQueue: '++queueId, uuid, action, status, createdAt, retries'
})

/**
 * إضافة عملية لقائمة انتظار المزامنة (تُستخدم عند فشل الاتصال أو وضع Offline)
 */
export async function enqueueSync(action, payload, uuid) {
  return db.syncQueue.add({
    uuid,
    action,
    payload: JSON.stringify(payload),
    status: 'pending', // pending | syncing | failed | done
    createdAt: Date.now(),
    retries: 0
  })
}

export async function getPendingSyncItems() {
  return db.syncQueue.where('status').anyOf('pending', 'failed').sortBy('createdAt')
}

export async function getPendingSyncCount() {
  return db.syncQueue.where('status').anyOf('pending', 'failed').count()
}

export async function markSyncItem(queueId, status, extra = {}) {
  return db.syncQueue.update(queueId, { status, ...extra })
}

export async function removeSyncItem(queueId) {
  return db.syncQueue.delete(queueId)
}
