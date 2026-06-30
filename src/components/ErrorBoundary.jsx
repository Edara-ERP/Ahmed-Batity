import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // يظهر في Console حتى لو الشاشة بيضاء عادةً - يساعد على تشخيص المشكلة بسرعة
    console.error('EdaraERP crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          dir="rtl"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'Cairo, sans-serif',
            textAlign: 'center',
            background: '#fff',
            color: '#1f2937'
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#0d7377',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 16
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>حدث خطأ غير متوقع أثناء تشغيل التطبيق</h1>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 420, marginBottom: 16 }}>
            هذا التفصيل يساعد في تحديد سبب المشكلة بدقة:
          </p>
          <pre
            style={{
              fontSize: 11,
              background: '#f3f4f6',
              padding: 12,
              borderRadius: 10,
              maxWidth: '90%',
              overflow: 'auto',
              textAlign: 'left',
              direction: 'ltr',
              color: '#b91c1c'
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              background: '#0d7377',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
