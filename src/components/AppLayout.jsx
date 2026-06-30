import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutGrid,
  Receipt,
  ShoppingCart,
  Package,
  Users as UsersIcon,
  Truck,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Search,
  MessageCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { usePendingSyncCount } from '../hooks/usePendingSyncCount.js'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: LayoutGrid, end: true },
  { to: '/sales', label: 'المبيعات', icon: Receipt },
  { to: '/purchases', label: 'المشتريات', icon: ShoppingCart },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/customers', label: 'العملاء', icon: UsersIcon },
  { to: '/suppliers', label: 'الموردين', icon: Truck },
  { to: '/expenses', label: 'المصروفات', icon: Wallet },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/stock-alerts', label: 'تنبيهات المخزون', icon: Bell },
  { to: '/users', label: 'المستخدمين', icon: UsersIcon },
  { to: '/audit-log', label: 'سجل العمليات', icon: BarChart3 },
  { to: '/settings', label: 'الإعدادات', icon: SettingsIcon }
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pendingSync = usePendingSyncCount()

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-surface-dark">
      {/* القائمة الجانبية - تنزلق من اليمين في RTL */}
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-40 w-72 bg-white dark:bg-card-dark border-l border-gray-100 dark:border-gray-800 transform transition-transform duration-200 md:translate-x-0 md:static md:flex md:flex-col',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-extrabold">E</div>
            <span className="font-extrabold text-primary-600 dark:text-primary-300 text-lg">EdaraERP</span>
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold text-sm">
              {user?.name?.charAt(0) || '؟'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-card-dark/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث سريع... (منتج، عميل، فاتورة)"
              className="input-field pr-9"
            />
          </div>

          <div className="flex items-center gap-2 mr-auto">
            {pendingSync > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2.5 py-1.5 rounded-full">
                {pendingSync} بانتظار المزامنة
              </span>
            )}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="تبديل الوضع الداكن"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* زر عائم لواتساب (اختياري) */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 left-5 z-30 w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle size={22} />
      </a>
    </div>
  )
}
