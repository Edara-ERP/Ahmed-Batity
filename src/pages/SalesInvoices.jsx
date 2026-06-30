import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Printer, FileDown } from 'lucide-react'
import { salesInvoicesRepo, purchaseInvoicesRepo } from '../lib/entities.js'
import { formatCurrency, printThermalInvoice, exportInvoicePdf } from '../lib/invoicePrint.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function SalesInvoices({ mode = 'sale' }) {
  const isPurchase = mode === 'purchase'
  const { can } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const repo = isPurchase ? purchaseInvoicesRepo : salesInvoicesRepo
    repo.list().then((data) => {
      setInvoices(data)
      setLoading(false)
    })
  }, [isPurchase])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter(
      (inv) => inv.partyName?.toLowerCase().includes(q) || String(inv.invoiceNumber || inv.id).includes(q)
    )
  }, [invoices, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">{isPurchase ? 'فواتير الشراء' : 'فواتير البيع'}</h1>
        {can(isPurchase ? 'purchases' : 'sales', 'edit') && (
          <Link to={isPurchase ? '/purchases/new' : '/sales/new'} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> فاتورة جديدة
          </Link>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم العميل أو رقم الفاتورة..."
          className="input-field pr-9"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">جارِ التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا توجد فواتير بعد</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
              <tr>
                <th className="text-right px-3 py-2.5 font-semibold">{isPurchase ? 'المورد' : 'العميل'}</th>
                <th className="px-3 py-2.5 font-semibold">رقم الفاتورة</th>
                <th className="px-3 py-2.5 font-semibold">التاريخ</th>
                <th className="px-3 py-2.5 font-semibold">الإجمالي</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-50 dark:border-gray-800">
                  <td className="px-3 py-2.5">
                    <Link to={`/invoices/${inv.id}`} className="font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                      {inv.partyName}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{inv.invoiceNumber || inv.id?.slice(0, 6)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{inv.date}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-2 flex items-center gap-1 justify-end py-2.5">
                    <button onClick={() => printThermalInvoice(inv)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Printer size={15} />
                    </button>
                    <button onClick={() => exportInvoicePdf(inv)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <FileDown size={15} />
                    </button>
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
