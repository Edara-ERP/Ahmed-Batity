import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Printer, FileDown, ArrowRight } from 'lucide-react'
import { db } from '../lib/db.js'
import { formatCurrency, printThermalInvoice, exportInvoicePdf } from '../lib/invoicePrint.js'

export default function InvoiceDetails() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [company, setCompany] = useState(null)

  useEffect(() => {
    async function load() {
      const sale = await db.salesInvoices.get(id)
      const purchase = sale ? null : await db.purchaseInvoices.get(id)
      setInvoice(sale || purchase)
      const settings = localStorage.getItem('edaraerp_company')
      if (settings) setCompany(JSON.parse(settings))
    }
    load()
  }, [id])

  if (!invoice) {
    return <p className="text-sm text-gray-400">جارِ تحميل الفاتورة...</p>
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link to="/sales" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowRight size={16} /> رجوع
        </Link>
        <div className="flex gap-2">
          <button onClick={() => printThermalInvoice(invoice, company)} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> طباعة حرارية
          </button>
          <button onClick={() => exportInvoicePdf(invoice, company)} className="btn-secondary flex items-center gap-2">
            <FileDown size={16} /> تصدير PDF
          </button>
        </div>
      </div>

      <div className="card">
        {/* رأس الفاتورة */}
        <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <h2 className="text-lg font-extrabold text-primary-700 dark:text-primary-300">{company?.name || 'EdaraERP'}</h2>
          <p className="text-xs text-gray-400 mt-1">{company?.phone} {company?.taxNumber && `— ر.ض: ${company.taxNumber}`}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-xs text-gray-400">رقم الفاتورة</p>
            <p className="font-semibold">{invoice.invoiceNumber || invoice.id?.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">التاريخ</p>
            <p className="font-semibold">{invoice.date}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">{invoice.type === 'purchase' ? 'المورد' : 'العميل'}</p>
            <p className="font-semibold">{invoice.partyName}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead className="text-gray-400 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-right py-2 font-semibold">الصنف</th>
              <th className="py-2 font-semibold">الكمية</th>
              <th className="py-2 font-semibold">السعر</th>
              <th className="py-2 font-semibold">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((it, idx) => (
              <tr key={idx} className="border-b border-gray-50 dark:border-gray-800">
                <td className="py-2">{it.name}</td>
                <td className="py-2 text-center">{it.qty} {it.unitName}</td>
                <td className="py-2 text-center">{formatCurrency(it.price)}</td>
                <td className="py-2 text-center font-bold">{formatCurrency(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between text-gray-500">
            <span>الحساب السابق</span>
            <span>{formatCurrency(invoice.previousBalance)}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>إجمالي الفاتورة</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-primary-600 dark:text-primary-300">
            <span>الحساب الحالي</span>
            <span>{formatCurrency(invoice.currentBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
