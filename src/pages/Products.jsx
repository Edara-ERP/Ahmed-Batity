import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, ScanLine, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsRepo } from '../lib/entities.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import BarcodeScanner from '../components/BarcodeScanner.jsx'

const EMPTY_PRODUCT = {
  name: '',
  barcode: '',
  baseUnit: 'قطعة',
  stockQty: 0,
  reorderLevel: 5,
  expiryDate: '',
  expiryAlertDays: 30,
  units: [{ unitName: 'قطعة', factor: 1, sellPrice: 0 }],
  buyPrice: 0,
  imageUrl: ''
}

export default function Products() {
  const { can } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    const data = await productsRepo.list()
    setProducts(data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q))
  }, [products, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_PRODUCT)
    setModalOpen(true)
  }

  function openEdit(product) {
    setEditing(product)
    setForm({ ...EMPTY_PRODUCT, ...product, units: product.units?.length ? product.units : EMPTY_PRODUCT.units })
    setModalOpen(true)
  }

  function updateUnit(idx, key, value) {
    const units = [...form.units]
    units[idx] = { ...units[idx], [key]: value }
    setForm({ ...form, units })
  }

  function addUnit() {
    setForm({ ...form, units: [...form.units, { unitName: '', factor: 1, sellPrice: 0 }] })
  }

  function removeUnit(idx) {
    if (form.units.length === 1) return
    setForm({ ...form, units: form.units.filter((_, i) => i !== idx) })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('اسم المنتج مطلوب')
      return
    }
    const result = editing
      ? await productsRepo.update(editing.id, form)
      : await productsRepo.create(form)

    if (result.offline) {
      toast('تم الحفظ محليًا، سيُزامن تلقائيًا عند عودة الاتصال', { icon: '📶' })
    } else {
      toast.success(editing ? 'تم تحديث المنتج' : 'تمت إضافة المنتج')
    }
    setModalOpen(false)
    loadProducts()
  }

  async function handleDelete(product) {
    if (!confirm(`هل تريد حذف "${product.name}"؟ لا يمكن التراجع عن هذا الإجراء`)) return
    await productsRepo.remove(product.id)
    toast.success('تم حذف المنتج')
    loadProducts()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">المنتجات</h1>
        {can('products', 'edit') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> منتج جديد
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الباركود..."
          className="input-field pr-9"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">جارِ التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا توجد منتجات بعد</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} canEdit={can('products', 'edit')} canDelete={can('products', 'delete')} />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل المنتج' : 'منتج جديد'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button form="product-form" type="submit" className="btn-primary">حفظ</button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500">اسم المنتج</label>
            <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">الباركود</label>
            <div className="flex gap-2 mt-1">
              <input className="input-field" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              <button type="button" onClick={() => setScannerOpen(true)} className="btn-secondary px-3">
                <ScanLine size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">الكمية بالمخزون (الوحدة الأساسية)</label>
              <input type="number" className="input-field mt-1" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">حد التنبيه عند نقص المخزون</label>
              <input type="number" className="input-field mt-1" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">تاريخ الصلاحية (اختياري)</label>
              <input type="date" className="input-field mt-1" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">تنبيه قبل الانتهاء بعدد أيام</label>
              <input type="number" className="input-field mt-1" value={form.expiryAlertDays} onChange={(e) => setForm({ ...form, expiryAlertDays: Number(e.target.value) })} />
            </div>
          </div>

          {/* وحدات القياس المتعددة */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">وحدات القياس</label>
              <button type="button" onClick={addUnit} className="text-xs text-primary-600 font-semibold">+ إضافة وحدة</button>
            </div>
            <div className="space-y-2">
              {form.units.map((u, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="اسم الوحدة"
                    className="input-field col-span-4"
                    value={u.unitName}
                    onChange={(e) => updateUnit(idx, 'unitName', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="معامل التحويل"
                    className="input-field col-span-3"
                    value={u.factor}
                    onChange={(e) => updateUnit(idx, 'factor', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    placeholder="سعر البيع"
                    className="input-field col-span-4"
                    value={u.sellPrice}
                    onChange={(e) => updateUnit(idx, 'sellPrice', Number(e.target.value))}
                  />
                  <button type="button" onClick={() => removeUnit(idx)} className="col-span-1 text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              مثال: كرتونة = 12 (معامل التحويل يعني أن وحدة واحدة منها = 12 من الوحدة الأساسية)
            </p>
          </div>
        </form>
      </Modal>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={(code) => setForm((f) => ({ ...f, barcode: code }))} />
    </div>
  )
}

function ProductCard({ product, onEdit, onDelete, canEdit, canDelete }) {
  const isLowStock = product.stockQty <= product.reorderLevel
  const expiryStatus = getExpiryStatus(product)

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 dark:text-white truncate">{product.name}</p>
          <p className="text-xs text-gray-400">{product.barcode || 'بدون باركود'}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {canEdit && (
            <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Pencil size={15} />
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {product.stockQty} {product.baseUnit}
          {product.units?.length > 1 && product.units[1]?.factor && (
            <span className="text-gray-400"> (= {(product.stockQty / product.units[1].factor).toFixed(1)} {product.units[1].unitName})</span>
          )}
        </span>
        {isLowStock && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
            <AlertTriangle size={11} /> مخزون منخفض
          </span>
        )}
      </div>

      {expiryStatus && (
        <div className={`mt-2 text-[11px] font-semibold px-2 py-1 rounded-lg w-fit ${expiryStatus.tone}`}>
          {expiryStatus.label}
        </div>
      )}
    </div>
  )
}

function getExpiryStatus(product) {
  if (!product.expiryDate) return null
  const today = new Date()
  const expiry = new Date(product.expiryDate)
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return { label: 'منتهي الصلاحية', tone: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  if (daysLeft <= (product.expiryAlertDays || 30)) return { label: `يقترب من الانتهاء (${daysLeft} يوم)`, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
  return null
}
