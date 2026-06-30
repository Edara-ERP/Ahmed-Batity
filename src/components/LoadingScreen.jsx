export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">جارِ التحميل...</span>
      </div>
    </div>
  )
}
