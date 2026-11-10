import {
  DELIVERY_METHODS,
  PAYMENT_METHODS,
  formatDateTime,
  formatNumber,
} from '@/lib/utils'
import { fetchSettings } from '@/lib/api'

const money = (value) => `Ks ${formatNumber(value)}`
const INK = [29, 29, 31]
const MUTED = [110, 110, 115]
const LINE = [227, 227, 230]
const SOFT = [245, 245, 247]

/**
 * Build and download a clean A4 invoice/receipt for an order.
 * jsPDF is loaded on demand so it never adds weight to the storefront bundle.
 */
export async function downloadInvoice(order) {
  let store = {
    name: 'iPhone Hub',
    tagline: 'Premium iPhones & accessories',
    email: 'hello@iphonehub.com',
    phone: '09459038758',
    address: 'Yangon, Myanmar',
  }
  try {
    const settings = await fetchSettings()
    store = { ...store, ...(settings.store || {}) }
  } catch (error) {
    console.error('Could not load store details for invoice', error)
  }

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const right = pageWidth - margin
  const contentWidth = right - margin
  let y = 48

  const items = order.order_items || []
  const payment = PAYMENT_METHODS[order.payment_method]?.label || order.payment_method
  const delivery = DELIVERY_METHODS[order.delivery_method]?.label || order.delivery_method

  // Brand block
  doc.setFillColor(...INK)
  doc.roundedRect(margin, y, 34, 34, 9, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('iH', margin + 8.5, y + 22)
  doc.setTextColor(...INK)
  doc.setFontSize(18)
  doc.text(store.name, margin + 46, y + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(`${store.tagline} - ${store.address}`, margin + 46, y + 28)
  doc.text(`${store.email}  |  ${store.phone}`, margin + 46, y + 39)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...INK)
  doc.text('INVOICE', right, y + 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(order.order_number, right, y + 28, { align: 'right' })
  doc.text(formatDateTime(order.created_at), right, y + 40, { align: 'right' })

  y += 60
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.7)
  doc.line(margin, y, right, y)
  y += 20

  // Three summary columns
  const columns = [
    {
      title: 'Billed to',
      lines: [
        order.customer_name || 'Customer',
        order.customer_phone || '',
        order.customer_email || '',
      ].filter(Boolean),
    },
    {
      title: 'Deliver to',
      lines: [
        order.address || '',
        [order.township, order.region].filter(Boolean).join(', '),
        order.postal_code || '',
      ].filter(Boolean),
    },
    {
      title: 'Payment',
      lines: [
        payment,
        `Status: ${String(order.payment_status || 'unpaid').toUpperCase()}`,
        delivery,
      ],
    },
  ]

  const columnWidth = contentWidth / 3
  let maxLines = 1
  columns.forEach((column, index) => {
    const x = margin + columnWidth * index
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(column.title.toUpperCase(), x, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    const wrapped = column.lines.flatMap((line) =>
      doc.splitTextToSize(String(line), columnWidth - 18),
    )
    maxLines = Math.max(maxLines, wrapped.length)
    wrapped.forEach((line, lineIndex) => {
      doc.text(line, x, y + 14 + lineIndex * 11.5)
    })
  })
  y += 18 + maxLines * 11.5

  const drawTableHead = () => {
    doc.setFillColor(...SOFT)
    doc.roundedRect(margin, y, contentWidth, 24, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text('ITEM', margin + 10, y + 15.5)
    doc.text('QTY', 350, y + 15.5, { align: 'center' })
    doc.text('UNIT PRICE', 460, y + 15.5, { align: 'right' })
    doc.text('AMOUNT', right - 10, y + 15.5, { align: 'right' })
    doc.setTextColor(...INK)
    y += 26
  }

  const addPage = () => {
    doc.addPage()
    y = 48
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    doc.text(`Invoice ${order.order_number}`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text(store.name, right, y, { align: 'right' })
    y += 18
    drawTableHead()
  }

  const ensureSpace = (height) => {
    if (y + height > pageHeight - 78) addPage()
  }

  drawTableHead()

  items.forEach((item) => {
    const nameLines = doc.splitTextToSize(item.product_name || 'Product', 230)
    const variant = [item.variant_storage, item.variant_color].filter(Boolean).join(' / ')
    const rowHeight = Math.max(30, nameLines.length * 11 + (variant ? 11 : 0) + 14)
    ensureSpace(rowHeight)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    nameLines.forEach((line, index) => {
      doc.text(line, margin + 10, y + 12 + index * 11)
    })
    if (variant) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...MUTED)
      doc.text(variant, margin + 10, y + 12 + nameLines.length * 11)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(String(item.quantity), 350, y + 12, { align: 'center' })
    doc.text(money(item.unit_price), 460, y + 12, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(money(Number(item.unit_price) * Number(item.quantity)), right - 10, y + 12, {
      align: 'right',
    })

    y += rowHeight
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.5)
    doc.line(margin, y - 4, right, y - 4)
  })

  ensureSpace(170)
  y += 12

  const totalLine = (label, value, { bold = false, muted = false, strong = false } = {}) => {
    doc.setFont('helvetica', bold || strong ? 'bold' : 'normal')
    doc.setFontSize(strong ? 11 : 9)
    doc.setTextColor(...(muted ? MUTED : INK))
    doc.text(label, 380, y)
    doc.text(value, right - 10, y, { align: 'right' })
    y += strong ? 20 : 16
  }

  totalLine('Subtotal', money(order.subtotal), { muted: true })
  totalLine('Delivery', Number(order.shipping_fee) > 0 ? money(order.shipping_fee) : 'Free', {
    muted: true,
  })
  if (Number(order.discount) > 0) {
    totalLine(
      `Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`,
      `- ${money(order.discount)}`,
      { muted: true },
    )
  }

  y += 4
  doc.setDrawColor(...LINE)
  doc.line(380, y, right - 10, y)
  y += 16
  totalLine('Total', money(order.total_amount), { strong: true })

  if (order.note) {
    ensureSpace(60)
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('ORDER NOTE', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    const noteLines = doc.splitTextToSize(order.note, contentWidth - 20)
    noteLines.slice(0, 4).forEach((line, index) => {
      doc.text(line, margin, y + 14 + index * 11)
    })
    y += 18 + Math.min(noteLines.length, 4) * 11
  }

  // Footer
  const footerY = pageHeight - 58
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 12, right, footerY - 12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...INK)
  doc.text(`Thank you for shopping with ${store.name}.`, margin, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(
    'Returns accepted within 7 days for unused items in original packaging.',
    margin,
    footerY + 12,
  )
  doc.text('This receipt was generated electronically.', right, footerY + 12, {
    align: 'right',
  })

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`Page ${page} of ${pages}`, right, pageHeight - 22, { align: 'right' })
  }

  doc.save(`invoice-${order.order_number}.pdf`)
}
