const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatINR = (n: number) => inr.format(n)

/** "UNDER_REVIEW" -> "Under review", "EV" -> "EV" */
export function label(value: string): string {
  if (value.length <= 3) return value
  const s = value.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Local date as YYYY-MM-DD (what <input type="date"> uses). */
export function isoDate(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

/** Inclusive day count, matching the backend's pricing. */
export function daysInclusive(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000) + 1
}
