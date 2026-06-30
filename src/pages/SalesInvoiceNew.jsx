import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ScanLine, Plus, Minus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsRepo, customersRepo, suppliersRepo, salesInvoicesRepo, purchaseInvoicesRepo } from '../lib/entities.js'
import { useAuth } from '../context/AuthContext.jsx'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { formatCurrency } from '../lib/invoicePrint.js'

export default function SalesInvoiceNew({ mode = 'sale' }) {
  const isPurchase = mode === 'purchase'
  const { user } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [parties, setParties] = useState([]) // عملاء أو موردين حسب النوع
  const [search, setSearch] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [partyId, setPartyId] = useState('')
  const [cart, setCart] = useState([]) // { productId, name, unit, unitFactor, qty, price, total }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    productsRepo.list().then(setProducts)
    ;(isPurchase ? suppliersRepo : customersRepo).list().then(setParties)
  }, [isPurchase])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products.filter((p) => p.name?.toLowerCase().includes(q) || p.barcode === q).slice(0, 8)
  }, [products, search])

  const selectedParty = parties.find((p) => p.id === partyId)
  const total = cart.reduce((sum, it) => sum + it.total, 0)
  const previousBalance = selectedParty?.balance || 0
  const currentBalance = previousBalance + total

  function addProduct(product, unit) {
    setCart((prev) => {
      const existing = prev.find((it) => it.productId === product.id && it.unitName === unit.unitName)
      if (existing) {
        return prev.map((it) =>
          it === existing ? { ...it, qty: it.qty + 1, total: (it.qty + 1) * it.price } : it
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitName: unit.unitName,
          unitFactor: unit.factor,
          baseUnit: product.baseUnit,
          qty: 1,
          price: isPurchase ? product.buyPrice || 0 : unit.sellPrice,
          total: isPurchase ? product.buyPrice || 0 : unit.sellPrice
        }
      ]
    })
    setSearch('')
  }

  function updateQty(idx, delta) {
    setCart((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const qty = Math.max(1, it.qty + delta)
        return { ...it, qty, total: qty * it.price }
      })
    )
  }

  function updatePrice(idx, price) {
    setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, price, total: it.qty * price } : it)))
  }

  function removeItem(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleBarcodeDetected(code) {
    const product = products.find((p) => p.barcode === code)
    if (product) {
      addProduct(product, product.units?.[0] || { unitName: product.baseUnit, factor: 1, sellPrice: 0 })
      toast.success(`تمت إضافة ${product.name}`)
    } else {
      toast.error('لم يتم العثور على منتج بهذا الباركود')
    }
  }

  async function handleSave() {
    if (cart.length === 0) {
      toast.error('أضف صنفًا واحدًا على الأقل')
      return
    }
    if (!isPurchase && selectedParty?.creditLimit && currentBalance > selectedParty.creditLimit) {
      const proceed = confirm(
        `تنبيه: هذه الفاتورة ستتجاوز حد الائتمان المسموح للعميل (${formatCurrency(selectedParty.creditLimit)}).\nهل تريد المتابعة على مسؤوليتك؟`
      )
      if (!proceed) return
    }

    setSaving(true)
    const invoice = {
      type: mode,
      partyId: partyId || null,
      partyName: selectedParty?.name || (isPurchase ? 'مورد نقدي' : 'عميل نقدي'),
      date: new Date().toISOString().slice(0, 10),
      items: cart,
      totalAmount: total,
      previousBalance,
      currentBalance,
      isCredit: !!partyId,
      createdBy: user?.email
    }

    const repo = isPurchase ? purchaseInvoicesRepo : salesInvoicesRepo
    const result = await repo.create(invoice)

    setSaving(false)
    if (result.offline) {
      toast('تم حفظ الفاتورة محليًا، ستُزامن تلقائيًا عند توفر الاتصال', { icon: '📶' })
    } else {
      toast.success('تم حفظ الفاتورة بنجاح')
    }
    navigate(isPurchase ? '/purchases' : '/sales')
  }

  return (
    <div className="space-y-4 pb-28">
      <h1 className="page-title">{isPurchase ? 'فاتورة شراء جديدة' : 'فاتورة بيع جديدة'}</h1>

      <div className="card space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500">{isPurchase ? 'المورد' : 'العميل'} (اختياري للبيع النقدي)</label>
          <select className="input-field mt-1" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">{isPurchase ? 'مورد نقدي' : 'عميل نقدي'}</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.balance ? `(رصيد: ${formatCurrency(p.balance)})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="text-xs font-semibold text-gray-500">إضافة منتج</label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الباركود..."
                className="input-field pr-9"
              />
            </div>
            <button type="button" onClick={() => setScannerOpen(true)} className="btn-secondary px-3">
              <ScanLine size={18} />
            </button>
          </div>

          {filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {filteredProducts.map((p) => (
                <div key={p.id} className="px-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(p.units?.length ? p.units : [{ unitName: p.baseUnit, factor: 1, sellPrice: 0 }]).map((u) => (
                      <button
                        key={u.unitName}
                        onClick={() => addProduct(p, u)}
                        className="text-xs px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200"
                      >
                        {u.unitName} — {formatCurrency(u.sellPrice)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* جدول الأصناف */}
      <div className="card p-0 overflow-hidden">
        {cart.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">لم تتم إضافة أصناف بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
              <tr>
                <th className="text-right px-3 py-2 font-semibold">المنتج</th>
                <th className="px-3 py-2 font-semibold">الكمية</th>
                <th className="px-3 py-2 font-semibold">السعر</th>
                <th className="px-3 py-2 font-semibold">الإجمالي</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((it, idx) => (
                <tr key={idx} className="border-t border-gray-50 dark:border-gray-800">
                  <td className="px-3 py-2">
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-xs text-gray-400">{it.unitName}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Minus size={12} /></button>
                      <span className="w-6 text-center">{it.qty}</span>
                      <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Plus size={12} /></button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={it.price}
                      onChange={(e) => updatePrice(idx, Number(e.target.value))}
                      className="w-20 text-center input-field py-1"
                    />
                  </td>
                  <td className="px-3 py-2 font-bold text-center">{formatCurrency(it.total)}</td>
                  <td className="px-2">
                    <button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* شريط الإجمالي الثابت */}
      <div className="fixed bottom-0 inset-x-0 md:static bg-white dark:bg-card-dark border-t md:border md:rounded-2xl border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between gap-3 shadow-lg md:shadow-card z-20">
        <div>
          <p className="text-xs text-gray-400">الإجمالي</p>
          <p className="text-xl font-extrabold text-primary-600 dark:text-primary-300">{formatCurrency(total)}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 max-w-[200px]">
          {saving ? 'جارِ الحفظ...' : 'حفظ الفاتورة'}
        </button>
      </div>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleBarcodeDetected} />
    </div>
  )
}
