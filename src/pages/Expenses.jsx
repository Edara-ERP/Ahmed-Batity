import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { expensesRepo } from '../lib/entities.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import { formatCurrency } from '../lib/invoicePrint.js'

const CATEGORIES = ['إيجار', 'رواتب', 'كهرباء ومياه', 'صيانة', 'نقل وشحن', 'تسويق', 'أخرى']
const EMPTY = { category: CATEGORIES[0], amount: '', date: new Date().toISOString().slice(0, 10), notes: '' }

export default function Expenses() {
  const { can } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setExpenses(await expensesRepo.list())
    setLoading(false)
  }

  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }
  function openEdit(exp) {
    setEditing(exp)
    setForm(exp)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('أدخل مبلغًا صحيحًا')
      return
    }
    const result = editing ? await expensesRepo.update(editing.id, form) : await expensesRepo.create(form)
    toast.success(editing ? 'تم التحديث' : 'تمت الإضافة', result.offline ? { icon: '📶' } : undefined)
    setModalOpen(false)
    load()
  }

  async function handleDelete(exp) {
    if (!confirm('حذف هذا المصروف؟')) return
    await expensesRepo.remove(exp.id)
    toast.success('تم الحذف')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">المصروفات</h1>
        {can('expenses', 'edit') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> مصروف جديد
          </button>
        )}
      </div>

      <div className="card flex items-center justify-between">
        <span className="text-sm text-gray-500">إجمالي المصروفات</span>
        <span className="text-lg font-extrabold text-rose-600">{formatCurrency(total)}</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">جارِ التحميل...</p>
      ) : expenses.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا توجد مصروفات مسجلة</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
              <tr>
                <th className="text-right px-3 py-2.5">التصنيف</th>
                <th className="px-3 py-2.5">التاريخ</th>
                <th className="px-3 py-2.5">المبلغ</th>
                <th className="px-3 py-2.5">ملاحظات</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-t border-gray-50 dark:border-gray-800">
                  <td className="px-3 py-2.5 font-semibold">{exp.category}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{exp.date}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{formatCurrency(exp.amount)}</td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs">{exp.notes}</td>
                  <td className="px-2 flex gap-1 justify-end py-2.5">
                    <button onClick={() => openEdit(exp)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(exp)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل المصروف' : 'مصروف جديد'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button form="expense-form" type="submit" className="btn-primary">حفظ</button>
          </>
        }
      >
        <form id="expense-form" onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">التصنيف</label>
            <select className="input-field mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">المبلغ</label>
            <input type="number" className="input-field mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">التاريخ</label>
            <input type="date" className="input-field mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">ملاحظات</label>
            <textarea className="input-field mt-1" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
