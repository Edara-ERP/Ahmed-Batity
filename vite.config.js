import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ⚠️ مهم جدًا: غيّر القيمة أدناه لتطابق اسم الـ Repository على GitHub
// مثال: إذا كان رابط المستودع github.com/username/edaraerp
// فيجب أن تكون القيمة '/edaraerp/'
const REPO_BASE = '/edaraerp/'

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'offline.html', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'EdaraERP - إدارة',
        short_name: 'EdaraERP',
        description: 'نظام إدارة المبيعات والمشتريات والمخزون والعملاء',
        theme_color: '#0d7377',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'ar',
        start_url: REPO_BASE,
        scope: REPO_BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache First للملفات الثابتة، Network First للبيانات (يُضبط داخل service-worker مخصص أيضًا)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/exec') || url.href.includes('script.google.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'image-cache' }
          }
        ],
        navigateFallback: REPO_BASE + 'index.html',
        navigateFallbackDenylist: [/^\/offline\.html$/],
        // عند فشل تحميل الصفحة الأساسية (مثل أول زيارة بدون اتصال)، يتم عرض صفحة Offline المخصصة
        navigationPreload: false
      },
      devOptions: { enabled: false }
    })
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
