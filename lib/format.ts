export function getCurrentYearMonth() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-12
  }
}

// Retourne les bornes ISO (YYYY-MM-DD) du mois sélectionné
export function getMonthRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // dernier jour du mois

  const start = toISODate(startDate)
  const end = toISODate(endDate)

  return { start, end }
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
