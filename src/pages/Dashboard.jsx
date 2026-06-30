import { Link } from 'react-router-dom'
import {
  Wallet,
  Package,
  Receipt,
  ShoppingCart,
  Users as UsersIcon,
  Truck,
  UserCog,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const QUICK_LINKS = [
  { to: '/expenses', label: 'المصروفات', icon: Wallet, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300' },
  { to: '/products', label: 'المنتجات', icon: Package, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300' },
  { to: '/sales', label: 'المبيعات', icon: Receipt, color: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300' },
  { to: '/purchases', label: 'المشتريات', icon: ShoppingCart, color: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300' },
  { to: '/customers', label: 'العملاء', icon: UsersIcon, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300' },
  { to: '/suppliers', label: 'الموردين', icon: Truck, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300' },
  { to: '/users', label: 'المستخدمين', icon: UserCog, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300' },
  { to: '/reports', label: 'التقارير', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' }
]

// بيانات تجريبية - سيتم استبدالها بربط حقيقي مع Apps Script API في مرحلة لاحقة
const SUMMARY = {
  todaySales: 4250,
  monthSales: 86430,
  pendingDebts: 12300,
  lowStockCount: 6
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value) + ' ج.م'
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">مرحبًا، {user?.name?.split(' ')[0] || ''} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">إليك ملخص أداء اليوم</p>
      </div>

      {/* بطاقات تلخيصية سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={TrendingUp} label="مبيعات اليوم" value={formatCurrency(SUMMARY.todaySales)} tone="positive" />
        <SummaryCard icon={BarChart3} label="مبيعات الشهر" value={formatCurrency(SUMMARY.monthSales)} tone="neutral" />
        <SummaryCard icon={TrendingDown} label="ديون مستحقة" value={formatCurrency(SUMMARY.pendingDebts)} tone="negative" />
        <SummaryCard icon={AlertTriangle} label="منتجات أوشكت على النفاد" value={SUMMARY.lowStockCount} tone="warning" />
      </div>

      {/* شبكة الوصول السريع 2×4 */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">الوصول السريع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((item, idx) => (
            <Link
              key={item.to}
              to={item.to}
              className="card flex flex-col items-center justify-center gap-2 py-6 hover:-translate-y-0.5 hover:shadow-lg transition-all animate-fade-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon size={22} />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const toneStyles = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    neutral: 'text-primary-600 dark:text-primary-300'
  }
  return (
    <div className="card">
      <div className={`flex items-center gap-2 mb-2 ${toneStyles[tone]}`}>
        <Icon size={16} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-lg font-extrabold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
