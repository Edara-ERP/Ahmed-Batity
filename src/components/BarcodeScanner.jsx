import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import Modal from './Modal.jsx'

const SCANNER_ID = 'edaraerp-barcode-scanner'

export default function BarcodeScanner({ open, onClose, onDetected }) {
  const scannerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 140 } },
        (decodedText) => {
          onDetected(decodedText)
          scanner.stop().catch(() => {})
          onClose()
        },
        () => {} // تجاهل أخطاء الفك المؤقتة أثناء البحث عن باركود
      )
      .catch(() => {
        // فشل الوصول للكاميرا (صلاحيات أو جهاز بدون كاميرا)
      })

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {})
    }
  }, [open, onClose, onDetected])

  return (
    <Modal open={open} onClose={onClose} title="مسح الباركود" size="sm">
      <div id={SCANNER_ID} className="rounded-xl overflow-hidden" />
      <p className="text-xs text-gray-400 mt-3 text-center">وجّه الكاميرا نحو الباركود</p>
    </Modal>
  )
}
