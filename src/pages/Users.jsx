import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { callApi } from '../lib/apiClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import clsx from 'clsx'

const SECTIONS = [
  { key: 'sales', label: 'المبيعات' },
  { key: 'purchases', label: 'المشتريات' },
  { key: 'products', label: 'المخزون' },
  { key: 'customers', label: 'العملاء' },
  { key: 'suppliers', label: 'الموردين' },
  { key: 'expenses', label: 'المصروفات' },
  { key: 'reports', label: 'التقارير' },
  { key: 'users', label: 'المستخدمين' }
]
const LEVELS = [
  { key: 'view', label: 'عرض فقط' },
  { key: 'edit', label: 'تعديل' },
  { key: 'delete', label: 'حذف' },
  { key: 'full', label: 'إدارة كاملة' }
]

const EMPTY = { name: '', email: '', phone: '', active: true, role: 'staff', permissions: {} }

export default function Users() {
  const { can } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await callApi('getUsers')
      setUsers(res.data || [])
    } catch {
      setUsers([])
    }
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }
  function openEdit(u) {
    setEditing(u)
    setForm({ ...EMPTY, ...u, permissions: u.permissions || {} })
    setModalOpen(true)
  }

  function setPermission(section, level) {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [section]: level } }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('الاسم والبريد الإلكتروني مطلوبان')
      return
    }
    try {
      await callApi(editing ? 'updateUser' : 'createUser', form)
      toast.success(editing ? 'تم التحديث' : 'تمت إضافة المستخدم')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message === 'OFFLINE' ? 'هذه العملية تتطلب اتصالًا بالإنترنت' : 'تعذّر الحفظ')
    }
  }

  async function handleDelete(u) {
    if (!confirm(`حذف المستخدم "${u.name}"؟`)) return
    try {
      await callApi('deleteUser', { email: u.email })
      toast.success('تم الحذف')
      load()
    } catch {
      toast.error('تعذّر الحذف')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">المستخدمين والصلاحيات</h1>
        {can('users', 'full') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> مستخدم جديد
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">جارِ التحميل...</p>
      ) : users.length === 0 ? (
        <div className="card text-center text-sm text-gray-400 py-10">لا يوجد مستخدمون بعد</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
              <tr>
                <th className="text-right px-3 py-2.5">الاسم</th>
                <th className="px-3 py-2.5">الهاتف</th>
                <th className="px-3 py-2.5">الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="border-t border-gray-50 dark:border-gray-800">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{u.phone}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={clsx('text-[11px] font-semibold px-2 py-1 rounded-full',
                      u.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-500')}>
                      {u.active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-2 flex gap-1 justify-end py-2.5">
                    {can('users', 'full') && (
                      <>
                        <button onClick={() => openEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
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
        title={editing ? 'تعديل المستخدم' : 'مستخدم جديد'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button form="user-form" type="submit" className="btn-primary">حفظ</button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">الاسم</label>
              <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">البريد الإلكتروني (حساب Google)</label>
              <input type="email" className="input-field mt-1" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">رقم الهاتف</label>
              <input className="input-field mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                حساب نشط
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={15} className="text-primary-500" />
              <label className="text-xs font-semibold text-gray-500">الصلاحيات لكل قسم</label>
            </div>
            <div className="space-y-2">
              {SECTIONS.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="w-24 shrink-0">{s.label}</span>
                  <div className="flex gap-1 flex-1">
                    {LEVELS.map((l) => (
                      <button
                        type="button"
                        key={l.key}
                        onClick={() => setPermission(s.key, l.key)}
                        className={clsx(
                          'flex-1 text-[11px] py-1.5 rounded-lg font-semibold transition-colors',
                          form.permissions[s.key] === l.key
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
