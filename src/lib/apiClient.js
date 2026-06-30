// src/lib/apiClient.js
// طبقة الاتصال بالخادم الخلفي (Google Apps Script Web App)
// ضع رابط الـ Web App الخاص بك هنا بعد نشر Apps Script (راجع دليل النشر)

export const API_BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec'

/**
 * استدعاء عام لكل عمليات الـ Backend
 * كل الطلبات تُرسل كـ POST مع action موحّد، والاستجابة دائمًا بصيغة { success, data, error }
 */
export async function callApi(action, payload = {}, { silent = false } = {}) {
  try {
    const session = getSession()
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      // ملاحظة: Apps Script لا يدعم application/json كـ Content-Type مع preflight بسهولة من بيئات ثابتة،
      // لذلك نستخدم text/plain ونقوم بتفسير JSON يدويًا داخل الـ Apps Script (موضّح في كود الباك إند)
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        token: session?.token || null,
        userEmail: session?.email || null,
        ...payload
      })
    })

    if (!response.ok) {
      throw new Error(`خطأ في الشبكة: ${response.status}`)
    }

    const json = await response.json()
    if (!json.success && !silent) {
      throw new Error(json.error || 'حدث خطأ غير متوقع من الخادم')
    }
    return json
  } catch (err) {
    if (!navigator.onLine) {
      // في حالة عدم الاتصال، يتم تمرير الخطأ للطبقة الأعلى لمعالجته عبر طابور المزامنة (Sync Queue)
      throw new Error('OFFLINE')
    }
    throw err
  }
}

const SESSION_KEY = 'edaraerp_session'

export function saveSession(session) {
  // session: { email, name, token, role, permissions, expiresAt }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
