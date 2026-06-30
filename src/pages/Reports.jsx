import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { salesInvoicesRepo, purchaseInvoicesRepo, customersRepo, suppliersRepo } from '../lib/entities.js'
import { formatCurrency } from '../lib/invoicePrint.js'
import clsx from 'clsx'

const TABS = [
  { key: 'sales', label: 'المبيعات' },
  { key: 'profits', label: 'الأرباح' },
  { key: 'sales-summary', label: 'بيانات مجمعة للمبيعات' },
  { key: 'purchases', label: 'بيانات مشتريات' },
  { key: 'aging', label: 'أعمار الديون' }
]

function getRangeFilters(invoices) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const month = now.getMonth(), year = now.getFullYear()
  const lastMonthDate = new Date(year, month - 1, 1)

  const sum = (filterFn) => invoices.filter(filterFn).reduce((s, i) => s + Number(i.totalAmount || 0), 0)

  return {
    today: sum((i) => i.date === todayStr),
    yesterday: sum((i) => i.date === yesterdayStr),
    thisMonth: sum((i) => { const d = new Date(i.date); return d.getMonth() === month && d.getFullYear() === year }),
    lastMonth: sum((i) => { const d = new Date(i.date); return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear() }),
    thisYear: sum((i) => new Date(i.date).getFullYear() === year)
  }
}

export default function Reports() {
  const [tab, setTab] = useState('sales')
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    salesInvoicesRepo.list().then(setSales)
    purchaseInvoicesRepo.list().then(setPurchases)
    customersRepo.list().then(setCustomers)
    suppliersRepo.list().then(setSuppliers)
  }, [])

  const salesSummary = useMemo(() => getRangeFilters(sales), [sales])
  const purchasesSummary = useMemo(() => getRangeFilters(purchases), [purchases])

  const chartData = useMemo(() => {
    // تجميع آخر 7 أيام من فواتير البيع لعرضها كرسم بياني
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })
    return days.map((day) => ({
      day: day.slice(5),
      المبيعات: sales.filter((s) => s.date === day).reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
    }))
  }, [sales])

  const profit = useMemo(() => {
    const totalSales = sales.reduce((s, i) => s + Number(i.totalAmount || 0), 0)
    const totalPurchases = purchases.reduce((s, i) => s + Number(i.totalAmount || 0), 0)
    return totalSales - totalPurchases
  }, [sales, purchases])

  return (
    <div className="space-y-4">
      <h1 className="page-title">التقارير</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
              tab === t.key ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="space-y-4">
          <SummaryGrid data={salesSummary} />
          <div className="card">
            <h3 className="text-sm font-bold mb-3">مبيعات آخر 7 أيام</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="المبيعات" fill="#0d7377" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'profits' && (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-400 mb-2">صافي الربح (مبيعات - مشتريات)</p>
          <p className={clsx('text-3xl font-extrabold', profit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {formatCurrency(profit)}
          </p>
          <p className="text-xs text-gray-400 mt-2">لا يشمل المصروفات التشغيلية — راجع شاشة المصروفات لحساب صافي الربح الكامل</p>
        </div>
      )}

      {tab === 'sales-summary' && <SummaryGrid data={salesSummary} />}
      {tab === 'purchases' && <SummaryGrid data={purchasesSummary} />}

      {tab === 'aging' && <AgingReport customers={customers} suppliers={suppliers} />}
    </div>
  )
}

function SummaryGrid({ data }) {
  const cards = [
    { label: 'اليوم', value: data.today },
    { label: 'أمس', value: data.yesterday },
    { label: 'الشهر الحالي', value: data.thisMonth },
    { label: 'الشهر الماضي', value: data.lastMonth },
    { label: 'العام الحالي', value: data.thisYear }
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card">
          <p className="text-xs text-gray-400 mb-1">{c.label}</p>
          <p className="font-extrabold text-primary-600 dark:text-primary-300">{formatCurrency(c.value)}</p>
        </div>
      ))}
    </div>
  )
}

function AgingReport({ customers, suppliers }) {
  // تقرير أعمار الديون: تصنيف حسب المدة منذ آخر تحديث للرصيد (تقريبي بدون تاريخ حركة فعلي لكل دين)
  const buckets = ['0-30 يوم', '30-60 يوم', 'أكثر من 60 يوم']

  function classify(list) {
    return list
      .filter((p) => (p.balance || 0) > 0)
      .map((p) => {
        const days = p.lastInvoiceDate ? Math.floor((Date.now() - new Date(p.lastInvoiceDate)) / 86400000) : 0
        const bucket = days <= 30 ? buckets[0] : days <= 60 ? buckets[1] : buckets[2]
        return { ...p, bucket }
      })
  }

  const customerAging = classify(customers)
  const supplierAging = classify(suppliers)

  return (
    <div className="space-y-4">
      <AgingTable title="ديون العملاء" rows={customerAging} buckets={buckets} />
      <AgingTable title="ديون الموردين (مستحقة علينا)" rows={supplierAging} buckets={buckets} />
    </div>
  )
}

function AgingTable({ title, rows, buckets }) {
  return (
    <div className="card p-0 overflow-hidden">
      <h3 className="text-sm font-bold px-4 py-3 border-b border-gray-100 dark:border-gray-800">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">لا توجد ديون مستحقة</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
            <tr>
              <th className="text-right px-3 py-2">الاسم</th>
              <th className="px-3 py-2">الرصيد</th>
              <th className="px-3 py-2">الفئة الزمنية</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-50 dark:border-gray-800">
                <td className="px-3 py-2 font-semibold">{r.name}</td>
                <td className="px-3 py-2 text-center">{formatCurrency(r.balance)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={clsx('text-[11px] font-semibold px-2 py-1 rounded-full',
                    r.bucket === buckets[0] && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
                    r.bucket === buckets[1] && 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
                    r.bucket === buckets[2] && 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                  )}>{r.bucket}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
