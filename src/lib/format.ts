import type { WorkoutSet } from '../types'

const kg = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

export const formatKg = (weight: number) => `${kg.format(weight)} kg`

/** « 80 kg × 8 », ou « PDC × 12 » au poids du corps. */
export const formatSet = ({ weight, reps }: WorkoutSet) =>
  `${weight > 0 ? formatKg(weight) : 'PDC'} × ${reps}`

/** Date locale au format YYYY-MM-DD. */
export const toISODate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

const DAY_MS = 86_400_000
const dayNumber = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

const longDay = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** « mardi 21 octobre » */
export const formatLongDate = (iso: string) =>
  longDay.format(dayNumber(iso) * DAY_MS)

/** « aujourd’hui », « hier », « il y a 3 jours », « il y a 2 semaines »… */
export function formatRelativeDay(iso: string, today = new Date()): string {
  const days = dayNumber(toISODate(today)) - dayNumber(iso)
  // En jours jusqu'à 13 : « il y a 10 jours » est plus précis que « la semaine dernière ».
  if (days < 14) return relative.format(-days, 'day')
  if (days < 30) return relative.format(-Math.round(days / 7), 'week')
  if (days < 365) return relative.format(-Math.round(days / 30), 'month')
  return relative.format(-Math.round(days / 365), 'year')
}
