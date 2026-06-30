import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Save, DatabaseBackup, BellRing } from 'lucide-react'
import { callApi } from '../lib/apiClient.js'
import { useAuth } from '../context/AuthContext.jsx'

const STORAGE_KEY = 'edaraerp_company'
const DEFAULT_COMPANY = { name: 'شركتي', phone: '', taxNumber: '', currency: 'ج.م', logoUrl: '', adminEmail: '' }

export default function Settings() {
  const { user, can } = useAuth()
  const [company, setCompany] = useState(DEFAULT_COMPANY)
  const [backupRunning, setBackupRunning] = useState(false)
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setCompany(JSON.parse(saved))
  }, [])

  function handleSave(e) {
    e.preventDefault()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
    toast.success('تم حفظ إعدادات الشركة')
  }

  async function runManualBackup() {
    setBackupRunning(true)
    try {
      await callApi('runManualBackup')
      toast.success('تم تشغيل النسخ الاحتياطي اليدوي بنجاح')
    } catch (err) {
      toast.error(err.message === 'OFFLINE' ? 'هذه العملية تتطلب اتصالًا بالإنترنت' : 'تعذّر تنفيذ النسخ الاحتياطي')
    }
    setBackupRunning(false)
  }

  async function enablePushNotifications() {
    if (!('Notification' in window)) {
      toast.error('متصفحك لا يدعم الإشعارات')
      return
    }
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') {
      toast.success('تم تفعيل الإشعارات بنجاح')
      // TODO: تسجيل الاشتراك الفعلي (Push Subscription) وإرساله إلى شيت PushSubscriptions عبر الباك إند
    } else {
      toast.error('تم رفض إذن الإشعارات')
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="page-title">الإعدادات</h1>

      <form onSubmit={handleSave} className="card space-y-3">
        <h3 className="text-sm font-bold">بيانات الشركة</h3>
        <div>
          <label className="text-xs font-semibold text-gray-500">اسم الشركة</label>
          <input className="input-field mt-1" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">رقم الهاتف</label>
            <input className="input-field mt-1" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">الرقم الضريبي</label>
            <input className="input-field mt-1" value={company.taxNumber} onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">العملة</label>
            <input className="input-field mt-1" value={company.currency} onChange={(e) => setCompany({ ...company, currency: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">بريد المدير (لإشعارات النسخ الاحتياطي)</label>
            <input type="email" className="input-field mt-1" value={company.adminEmail} onChange={(e) => setCompany({ ...company, adminEmail: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2 w-fit">
          <Save size={16} /> حفظ الإعدادات
        </button>
      </form>

      {can('users', 'full') && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2"><DatabaseBackup size={16} /> النسخ الاحتياطي</h3>
          <p className="text-xs text-gray-400">
            يتم تشغيل النسخ الاحتياطي تلقائيًا في نهاية كل شهر إلى Google Drive. يمكنك أيضًا تشغيله يدويًا الآن.
          </p>
          <button onClick={runManualBackup} disabled={backupRunning} className="btn-secondary flex items-center gap-2 w-fit">
            {backupRunning ? 'جارِ التنفيذ...' : 'نسخ احتياطي يدوي الآن'}
          </button>
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><BellRing size={16} /> إشعارات Push</h3>
        <p className="text-xs text-gray-400">
          فعّل الإشعارات الفورية لتنبيهات نقص المخزون، قرب انتهاء الصلاحية، وتجاوز حد الائتمان.
        </p>
        <button onClick={enablePushNotifications} className="btn-secondary w-fit">
          {notifPermission === 'granted' ? 'الإشعارات مفعّلة ✓' : 'تفعيل الإشعارات'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">مسجّل الدخول كـ {user?.email}</p>
    </div>
  )
}
