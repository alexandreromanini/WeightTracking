import { describe, expect, it } from 'vitest'
import { formatRelativeDay, formatSet, toISODate } from './format'

describe('formatSet', () => {
  it('formate charge et répétitions à la française', () => {
    expect(formatSet({ weight: 82.5, reps: 8 })).toBe('82,5 kg × 8')
    expect(formatSet({ weight: 0, reps: 12 })).toBe('PDC × 12')
  })
})

describe('formatRelativeDay', () => {
  const today = new Date(2026, 9, 21) // 21 octobre 2026, heure locale

  it('reste lisible quelle que soit l’ancienneté', () => {
    expect(formatRelativeDay('2026-10-21', today)).toBe('aujourd’hui')
    expect(formatRelativeDay('2026-10-20', today)).toBe('hier')
    expect(formatRelativeDay('2026-10-18', today)).toBe('il y a 3 jours')
    expect(formatRelativeDay('2026-10-07', today)).toBe('il y a 2 semaines')
    expect(formatRelativeDay('2026-07-21', today)).toBe('il y a 3 mois')
  })

  it('ne dépend pas du fuseau horaire', () => {
    expect(toISODate(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01')
  })
})
