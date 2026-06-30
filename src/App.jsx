import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AppLayout from './components/AppLayout.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import Login from './pages/Login.jsx'

// Lazy loading للصفحات لتحسين الأداء (يُحمَّل كل قسم عند الحاجة فقط)
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const SalesInvoiceNew = lazy(() => import('./pages/SalesInvoiceNew.jsx'))
const SalesInvoices = lazy(() => import('./pages/SalesInvoices.jsx'))
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails.jsx'))
const Customers = lazy(() => import('./pages/Customers.jsx'))
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'))
const Expenses = lazy(() => import('./pages/Expenses.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Users = lazy(() => import('./pages/Users.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const StockAlerts = lazy(() => import('./pages/StockAlerts.jsx'))
const AuditLog = lazy(() => import('./pages/AuditLog.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales/new" element={<SalesInvoiceNew />} />
          <Route path="sales" element={<SalesInvoices />} />
          <Route path="purchases/new" element={<SalesInvoiceNew mode="purchase" />} />
          <Route path="purchases" element={<SalesInvoices mode="purchase" />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="stock-alerts" element={<StockAlerts />} />
          <Route path="audit-log" element={<AuditLog />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
