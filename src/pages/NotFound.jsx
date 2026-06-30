import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-surface dark:bg-surface-dark">
      <p className="text-5xl font-extrabold text-primary-500">٤٠٤</p>
      <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">الصفحة غير موجودة</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">الرابط الذي حاولت الوصول إليه غير متاح</p>
      <Link to="/" className="btn-primary mt-2">
        العودة للرئيسية
      </Link>
    </div>
  )
}
