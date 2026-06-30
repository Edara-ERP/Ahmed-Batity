import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, GOOGLE_CLIENT_ID } from '../context/AuthContext.jsx'

export default function Login() {
  const { user, loginWithGoogleCredential } = useAuth()
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  // تحميل مكتبة Google Identity Services ديناميكيًا
  useEffect(() => {
    if (document.getElementById('google-identity-script')) {
      setScriptReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.id = 'google-identity-script'
    script.async = true
    script.defer = true
    script.onload = () => setScriptReady(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!scriptReady || !window.google || !buttonRef.current) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setAuthenticating(true)
        const ok = await loginWithGoogleCredential(response.credential)
        setAuthenticating(false)
        if (ok) navigate('/', { replace: true })
      }
    })

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'continue_with',
      locale: 'ar'
    })
  }, [scriptReady, loginWithGoogleCredential, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white dark:from-surface-dark dark:to-surface-dark px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center text-white text-2xl font-extrabold mb-4 shadow-card">
            E
          </div>
          <h1 className="text-2xl font-extrabold text-primary-700 dark:text-primary-300">EdaraERP</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة المبيعات والمشتريات والمخزون والعملاء</p>
        </div>

        <div className="card flex flex-col items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            سجّل الدخول باستخدام حساب جوجل المرتبط بصلاحياتك في النظام
          </p>

          <div ref={buttonRef} />

          {authenticating && (
            <div className="flex items-center gap-2 text-sm text-primary-600">
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              جارِ التحقق من الصلاحية...
            </div>
          )}

          {!scriptReady && (
            <p className="text-xs text-gray-400">جارِ تحميل خدمة تسجيل الدخول من جوجل...</p>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          إذا لم يكن بريدك مسجلًا لدى مدير النظام، تواصل معه لإضافتك ضمن المستخدمين
        </p>
      </div>
    </div>
  )
}
