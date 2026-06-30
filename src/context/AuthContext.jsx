import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { callApi, saveSession, getSession, clearSession } from '../lib/apiClient'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// ضع هنا الـ Google OAuth Client ID الخاص بمشروعك (من Google Cloud Console)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 12 // 12 ساعة

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session) setUser(session)
    setLoading(false)
  }, [])

  // يُستدعى بعد نجاح Google Identity Services في الواجهة (Login.jsx)
  const loginWithGoogleCredential = useCallback(async (credentialJwt) => {
    try {
      // فك تشفير الـ JWT للحصول على بيانات المستخدم الأساسية (بدون تحقق من التوقيع - التحقق الحقيقي يتم في Apps Script)
      const payloadBase64 = credentialJwt.split('.')[1]
      const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')))

      // إرسال التوكن للباك إند للتحقق من وجود المستخدم في شيت Users وجلب صلاحياته
      const res = await callApi('verifyGoogleLogin', {
        idToken: credentialJwt,
        email: decoded.email,
        name: decoded.name
      })

      if (!res.success) {
        toast.error('لا تملك صلاحية الوصول، تواصل مع المدير')
        return false
      }

      const session = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        token: res.data.token,
        role: res.data.role,
        permissions: res.data.permissions, // { sales: 'full', purchases: 'view', ... }
        expiresAt: Date.now() + SESSION_DURATION_MS
      }
      saveSession(session)
      setUser(session)
      toast.success(`أهلًا بك، ${decoded.name}`)
      return true
    } catch (err) {
      console.error(err)
      toast.error('تعذّر تسجيل الدخول، حاول مرة أخرى')
      return false
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  // التحقق من الصلاحية - يجب ألا يُعتمد عليه وحده، فالباك إند يتحقق أيضًا في كل طلب (Role-based Access Control)
  const can = useCallback(
    (section, level = 'view') => {
      if (!user) return false
      if (user.role === 'admin') return true
      const sectionPerm = user.permissions?.[section]
      if (!sectionPerm) return false
      const order = ['view', 'edit', 'delete', 'full']
      return order.indexOf(sectionPerm) >= order.indexOf(level)
    },
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogleCredential, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}
