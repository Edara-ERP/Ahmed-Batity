import { useEffect, useMemo, useState } from 'react'
import { callApi } from '../lib/apiClient.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuditLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ date: '', userEmail: '', actionType: '' })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await callApi('getAuditLog')
      setLogs(res.data || [])
    } catch {
      setLogs([])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filters.date && !l.timestamp?.startsWith(filters.date)) return false
      if (filters.userEmail && !l.userEmail?.includes(filters.userEmail)) return false
      if (filters.actionType && l.actionType !== filters.actionType) return false
      return true
    })
  }, [logs, filters])

  if (user?.role !== 'admin') {
    return <div className="card text-center text-sm text-gray-400 py-10">هذه الشاشة متاحة للمدير فقط</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="page-title">سجل العمليات</h1>

      <div className="grid sm:grid-cols-3 gap-3">
        <input type="date" className="input-field" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <input placeholder="بريد المستخدم" className="input-field" value={filters.userEmail} onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })} />
        <select className="input-field" value={filters.actionType} onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}>
          <option value="">كل العمليات</option>
          <option value="create">إنشاء</option>
          <option value="update">تعديل</option>
          <option value="delete">حذف</option>
          <option value="backup">نسخ احتياطي</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">جارِ التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا توجد سجلات مطابقة</div>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
              <tr>
                <th className="text-right px-3 py-2.5">التوقيت</th>
                <th className="px-3 py-2.5">المستخدم</th>
                <th className="px-3 py-2.5">العملية</th>
                <th className="px-3 py-2.5">الكيان</th>
                <th className="px-3 py-2.5">التفاصيل</th>
                <th className="px-3 py-2.5">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => (
                <tr key={idx} className="border-t border-gray-50 dark:border-gray-800">
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{l.timestamp}</td>
                  <td className="px-3 py-2.5">{l.userName || l.userEmail}</td>
                  <td className="px-3 py-2.5 text-center">{l.actionType}</td>
                  <td className="px-3 py-2.5 text-center">{l.entityType}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-400">{l.details}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={l.status === 'نجاح' ? 'text-emerald-600' : 'text-rose-600'}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
