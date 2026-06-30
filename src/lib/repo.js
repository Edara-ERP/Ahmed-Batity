// src/lib/repo.js
// مصنع عام (Repository Factory) لعمليات CRUD مع دعم Offline-first لكل كيان (منتجات، عملاء، فواتير...)
import { v4 as uuidv4 } from 'uuid'
import { db, enqueueSync } from './db.js'
import { callApi } from './apiClient.js'
import { runSync } from './syncEngine.js'

/**
 * إنشاء مستودع بيانات لكيان معيّن
 * @param {string} table اسم جدول Dexie المحلي (مثل 'products')
 * @param {object} actions أسماء الإجراءات في Apps Script: { list, create, update, remove }
 */
export function createRepo(table, actions) {
  return {
    /** جلب القائمة - يحاول من الخادم أولًا (Network First)، وإن فشل يرجع للكاش المحلي */
    async list(params = {}) {
      try {
        const res = await callApi(actions.list, params)
        const records = res.data || []
        await db[table].bulkPut(records.map((r) => ({ ...r, localId: r.id, updatedAt: Date.now() })))
        return records
      } catch (err) {
        // وضع عدم الاتصال: إرجاع آخر نسخة مخزّنة محليًا
        return db[table].toArray()
      }
    },

    /** إنشاء سجل جديد - يُحفظ محليًا فورًا، ويُزامن مباشرة أو يُضاف لقائمة الانتظار عند الفشل */
    async create(payload) {
      const uuid = uuidv4()
      const localRecord = { ...payload, localId: uuid, id: uuid, synced: false, createdAt: Date.now() }
      await db[table].put(localRecord)

      try {
        const res = await callApi(actions.create, { ...payload, clientUuid: uuid })
        await db[table].update(uuid, { ...res.data, synced: true })
        return { ok: true, data: res.data, offline: false }
      } catch (err) {
        await enqueueSync(actions.create, { ...payload, clientUuid: uuid }, uuid)
        return { ok: true, data: localRecord, offline: true }
      }
    },

    async update(id, payload) {
      await db[table].update(id, { ...payload, synced: false })
      try {
        const res = await callApi(actions.update, { id, ...payload })
        await db[table].update(id, { ...res.data, synced: true })
        return { ok: true, offline: false }
      } catch (err) {
        await enqueueSync(actions.update, { id, ...payload }, uuidv4())
        return { ok: true, offline: true }
      }
    },

    async remove(id) {
      await db[table].delete(id)
      try {
        await callApi(actions.remove, { id })
        return { ok: true, offline: false }
      } catch (err) {
        await enqueueSync(actions.remove, { id }, uuidv4())
        return { ok: true, offline: true }
      }
    },

    /** محاولة مزامنة فورية (يُستدعى يدويًا أو عند عودة الاتصال) */
    sync: runSync
  }
}
