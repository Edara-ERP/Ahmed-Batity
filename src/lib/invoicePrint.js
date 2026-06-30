// src/lib/invoicePrint.js
// أدوات الطباعة الحرارية (80mm/58mm) وتصدير PDF بنفس تنسيق الفاتورة
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function formatCurrency(value, currency = 'ج.م') {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(value || 0)} ${currency}`
}

/** طباعة حرارية عبر نافذة طباعة المتصفح بتنسيق مخصص لعرض 80mm أو 58mm */
export function printThermalInvoice(invoice, company, width = '80mm') {
  const win = window.open('', '_blank', 'width=400,height=600')
  const itemsRows = invoice.items
    .map(
      (it) => `
      <tr>
        <td>${it.name}</td>
        <td style="text-align:center">${it.qty} ${it.unit || ''}</td>
        <td style="text-align:left">${formatCurrency(it.total)}</td>
      </tr>`
    )
    .join('')

  win.document.write(`
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8" />
      <title>فاتورة ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Cairo', sans-serif; width: ${width}; margin: 0 auto; padding: 8px; font-size: 12px; }
        h2 { text-align: center; margin: 4px 0; font-size: 14px; }
        .center { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td, th { padding: 3px 2px; border-bottom: 1px dashed #ccc; font-size: 11px; }
        .total-row { font-weight: bold; font-size: 13px; border-top: 1px solid #000; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <h2>${company?.name || 'EdaraERP'}</h2>
      <p class="center">${company?.phone || ''} ${company?.taxNumber ? '— ر.ض: ' + company.taxNumber : ''}</p>
      <div class="divider"></div>
      <p>رقم الفاتورة: ${invoice.invoiceNumber}<br/>التاريخ: ${invoice.date}<br/>العميل: ${invoice.partyName || '-'}</p>
      <div class="divider"></div>
      <table>
        <thead><tr><th>الصنف</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>الحساب السابق</td><td style="text-align:left">${formatCurrency(invoice.previousBalance)}</td></tr>
        <tr class="total-row"><td>الإجمالي</td><td style="text-align:left">${formatCurrency(invoice.totalAmount)}</td></tr>
        <tr class="total-row"><td>الحساب الحالي</td><td style="text-align:left">${formatCurrency(invoice.currentBalance)}</td></tr>
      </table>
      <p class="center" style="margin-top:10px">شكرًا لتعاملكم معنا</p>
    </body>
    </html>
  `)
  win.document.close()
}

/** تصدير الفاتورة كملف PDF بنفس التنسيق */
export function exportInvoicePdf(invoice, company) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(company?.name || 'EdaraERP', 105, 15, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice: ${invoice.invoiceNumber}   Date: ${invoice.date}`, 105, 22, { align: 'center' })
  doc.text(`Customer: ${invoice.partyName || '-'}`, 105, 27, { align: 'center' })

  autoTable(doc, {
    startY: 32,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: invoice.items.map((it) => [it.name, `${it.qty} ${it.unit || ''}`, it.price, it.total]),
    theme: 'grid',
    styles: { fontSize: 8 }
  })

  const finalY = doc.lastAutoTable.finalY + 6
  doc.text(`Previous balance: ${invoice.previousBalance || 0}`, 140, finalY)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: ${invoice.totalAmount}`, 140, finalY + 6)
  doc.text(`Current balance: ${invoice.currentBalance || 0}`, 140, finalY + 12)

  doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
}
