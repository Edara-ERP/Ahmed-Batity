// src/lib/syncEngine.js
// محرك المزامنة: يرسل العمليات المعلّقة بالترتيب عند عودة الاتصال، مع إعادة المحاولة (Retry with backoff)
import { db, getPendingSyncItems, markSyncItem, removeSyncItem } from './db.js'
import { callApi } from './apiClient.js'

let isSyncing = false
const listeners = new Set()

export function onSyncEvent(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit(event) {
  listeners.forEach((fn) => fn(event))
}

export async function runSync() {
  if (isSyncing || !navigator.onLine) return
  isSyncing = true
  emit({ type: 'start' })

  try {
    const items = await getPendingSyncItems()
    for (const item of items) {
      try {
        await markSyncItem(item.queueId, 'syncing')
        const payload = JSON.parse(item.payload)
        // uuid يُمرَّر ضمن البيانات لمنع التكرار عند المزامنة (Conflict Resolution)
        await callApi(item.action, { ...payload, clientUuid: item.uuid })
        await removeSyncItem(item.queueId)
        emit({ type: 'item-synced', uuid: item.uuid })
      } catch (err) {
        const retries = (item.retries || 0) + 1
        const backoffMs = Math.min(60000, 1000 * 2 ** retries) // Exponential backoff حتى دقيقة واحدة
        await markSyncItem(item.queueId, 'failed', { retries })
        emit({ type: 'item-failed', uuid: item.uuid, retries })
        setTimeout(() => runSync(), backoffMs)
        break // التزام بترتيب الإنشاء: نتوقف عند أول فشل ونعيد المحاولة لاحقًا
      }
    }
  } finally {
    isSyncing = false
    emit({ type: 'end' })
  }
}

// مزامنة تلقائية عند عودة الاتصال
window.addEventListener('online', () => {
  runSync()
  // محاولة استخدام Background Sync API إن كانت مدعومة (Fallback أعلاه يغطي باقي المتصفحات)
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.sync?.register('edaraerp-sync').catch(() => {})
    })
  }
})

// تشغيل أولي عند تحميل التطبيق في حال وجود عمليات معلّقة من جلسة سابقة
if (navigator.onLine) {
  setTimeout(() => runSync(), 1500)
}
