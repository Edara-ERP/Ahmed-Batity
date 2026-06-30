import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Calendar, Download } from 'lucide-react'
import { productsRepo } from '../lib/entities.js'
import clsx from 'clsx'

export default function StockAlerts() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all') // all | low-stock | expiry

  useEffect(() => {
    productsRepo.list().then(setProducts)
  }, [])

  const alerts = useMemo(() => {
    return products
      .map((p) => {
        const lowStock = p.stockQty <= p.reorderLevel
        let expiry = null
        if (p.expiryDate) {
          const daysLeft = Math.ceil((new Date(p.expiryDate) - new Date()) / 86400000)
          if (daysLeft < 0) expiry = { label: 'منتهي الصلاحية', tone: 'red', daysLeft }
          else if (daysLeft <= (p.expiryAlertDays || 30)) expiry = { label: `يقترب من الانتهاء (${daysLeft} يوم)`, tone: 'yellow', daysLeft }
        }
        return { ...p, lowStock, expiry }
      })
      .filter((p) => p.lowStock || p.expiry)
      .filter((p) => {
        if (filter === 'low-stock') return p.lowStock
        if (filter === 'expiry') return !!p.expiry
        return true
      })
  }, [products, filter])

  function exportCsv() {
    const rows = [['المنتج', 'الكمية', 'حد التنبيه', 'تاريخ الصلاحية', 'الحالة']]
    alerts.forEach((p) => {
      rows.push([
        p.name,
        p.stockQty,
        p.reorderLevel,
        p.expiryDate || '-',
        [p.lowStock ? 'نقص مخزون' : '', p.expiry ? p.expiry.label : ''].filter(Boolean).join(' / ')
      ])
    })
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stock-alerts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">تنبيهات المخزون</h1>
        <button onClick={exportCsv} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> تصدير CSV
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'low-stock', label: 'نقص كمية' },
          { key: 'expiry', label: 'قرب انتهاء الصلاحية' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-sm font-semibold',
              filter === f.key ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا توجد تنبيهات حاليًا 🎉</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {alerts.map((p) => (
            <div key={p.id} className="card">
              <p className="font-bold mb-2">{p.name}</p>
              <div className="flex flex-col gap-1.5">
                {p.lowStock && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded-full w-fit">
                    <AlertTriangle size={12} /> الكمية المتاحة {p.stockQty} (الحد {p.reorderLevel})
                  </span>
                )}
                {p.expiry && (
                  <span className={clsx(
                    'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit',
                    p.expiry.tone === 'red' ? 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300' : 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300'
                  )}>
                    <Calendar size={12} /> {p.expiry.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
