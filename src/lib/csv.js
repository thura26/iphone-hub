function escapeCell(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * Download tabular data as a CSV file.
 * Columns look like: { label: 'Order number', value: (row) => row.order_number }
 */
export function downloadCsv(filename, columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = typeof column.value === 'function' ? column.value(row) : row[column.key]
        return escapeCell(value)
      })
      .join(','),
  )
  const csv = `\uFEFF${[header, ...body].join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function dateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10)
}
