import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, FileText, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { customersRepo, suppliersRepo } from '../lib/entities.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'
import { formatCurrency } from '../lib/invoicePrint.js'

const EMPTY_PARTY = { name: '', phone: '', address: '', balance: 0, creditLimit: 0 }

export default function PartyManager({ type }) {
  const isCustomer = type === 'customer'
  const repo = isCustomer ? customersRepo : suppliersRepo
  const permKey = isCustomer ? 'customers' : 'suppliers'
  const { can } = useAuth()

  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [ledgerParty, setLedgerParty] = useState(null)
  const [paymentParty, setPaymentParty] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_PARTY)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setParties(await repo.list())
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return parties
    return parties.filter((p) => p.name?.toLowerCase().includes(q) || p.phone?.includes(q))
  }, [parties, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_PARTY)
    setModalOpen(true)
  }
  function openEdit(party) {
    setEditing(party)
    setForm({ ...EMPTY_PARTY, ...party })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب')
      return
    }
    const result = editing ? await repo.update(editing.id, form) : await repo.create(form)
    toast.success(editing ? 'تم التحديث' : 'تمت الإضافة', result.offline ? { icon: '📶' } : undefined)
    setModalOpen(false)
    load()
  }

  async function handleDelete(party) {
    if (!confirm(`حذف "${party.name}"؟`)) return
    await repo.remove(party.id)
    toast.success('تم الحذف')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">{isCustomer ? 'العملاء' : 'الموردين'}</h1>
        {can(permKey, 'edit') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> {isCustomer ? 'عميل جديد' : 'مورد جديد'}
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف..." className="input-field pr-9" />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">جارِ التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا توجد بيانات بعد</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.phone}</p>
                </div>
                <div className="flex gap-1">
                  {can(permKey, 'edit') && (
                    <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Pencil size={15} />
                    </button>
                  )}
                  {can(permKey, 'delete') && (
                    <button onClick={() => handleDelete(p)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`text-sm font-bold ${p.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(p.balance || 0)}
                </span>
                {p.creditLimit > 0 && <span className="text-[11px] text-gray-400">حد ائتمان: {formatCurrency(p.creditLimit)}</span>}
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => setLedgerParty(p)} className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1 py-2">
                  <FileText size={13} /> كشف حساب
                </button>
                <button onClick={() => setPaymentParty(p)} className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1 py-2">
                  <Wallet size={13} /> تسجيل دفعة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نموذج إضافة/تعديل */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل البيانات' : isCustomer ? 'عميل جديد' : 'مورد جديد'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button form="party-form" type="submit" className="btn-primary">حفظ</button>
          </>
        }
      >
        <form id="party-form" onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">الاسم</label>
            <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">رقم الهاتف</label>
            <input className="input-field mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">العنوان</label>
            <input className="input-field mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          {isCustomer && (
            <div>
              <label className="text-xs font-semibold text-gray-500">حد الائتمان</label>
              <input type="number" className="input-field mt-1" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
            </div>
          )}
        </form>
      </Modal>

      {ledgerParty && <LedgerModal party={ledgerParty} onClose={() => setLedgerParty(null)} />}
      {paymentParty && (
        <PaymentModal
          party={paymentParty}
          isCustomer={isCustomer}
          onClose={() => setPaymentParty(null)}
          onSaved={() => {
            setPaymentParty(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function LedgerModal({ party, onClose }) {
  // بيانات تجريبية لحركة الحساب - سيتم ربطها بسجل الحركات الفعلي (CustomerLedger/SupplierLedger) من الباك إند
  const movements = party.ledger || []
  return (
    <Modal open onClose={onClose} title={`كشف حساب — ${party.name}`} size="lg">
      {movements.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">لا توجد حركات مسجلة بعد</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-right py-2">التاريخ</th>
              <th className="py-2">نوع الحركة</th>
              <th className="py-2">المبلغ</th>
              <th className="py-2">الرصيد بعدها</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m, idx) => (
              <tr key={idx} className="border-b border-gray-50 dark:border-gray-800">
                <td className="py-2">{m.date}</td>
                <td className="py-2 text-center">{m.type}</td>
                <td className="py-2 text-center">{formatCurrency(m.amount)}</td>
                <td className="py-2 text-center font-bold">{formatCurrency(m.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

function PaymentModal({ party, isCustomer, onClose, onSaved }) {
  const repo = isCustomer ? customersRepo : suppliersRepo
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      toast.error('أدخل مبلغًا صحيحًا')
      return
    }
    setSaving(true)
    const newBalance = (party.balance || 0) - value
    await repo.update(party.id, { balance: newBalance })
    setSaving(false)
    toast.success('تم تسجيل الدفعة وتحديث الرصيد')
    onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`تسجيل دفعة — ${party.name}`}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button form="payment-form" type="submit" disabled={saving} className="btn-primary">{saving ? '...' : 'تأكيد الدفعة'}</button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-gray-500">الرصيد الحالي: <span className="font-bold">{formatCurrency(party.balance || 0)}</span></p>
        <div>
          <label className="text-xs font-semibold text-gray-500">المبلغ المُسدَّد</label>
          <input type="number" autoFocus className="input-field mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </form>
    </Modal>
  )
}
