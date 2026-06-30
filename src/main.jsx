import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'
import './lib/syncEngine.js' // تفعيل مزامنة العمليات المعلّقة تلقائيًا عند توفر الاتصال
import './index.css'

// تسجيل الـ Service Worker (يُولَّد تلقائيًا بواسطة vite-plugin-pwa) مع تحديث تلقائي بصمت
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter إلزامي على GitHub Pages لتفادي مشاكل 404 عند تحديث الصفحة */}
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
                success: { iconTheme: { primary: '#0d7377', secondary: '#fff' } }
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
