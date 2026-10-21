import type { WorkoutEntry, WorkoutSet } from '../types'

/** 1RM estimé (Epley) : poids × (1 + reps / 30). Une seule rep = la charge elle-même. */
export function epley1RM({ weight, reps }: WorkoutSet): number {
  if (weight <= 0 || reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

/** Série la plus lourde ; à charge égale, la plus longue. */
export function topSet(sets: readonly WorkoutSet[]): WorkoutSet | undefined {
  return sets.reduce<WorkoutSet | undefined>(
    (best, s) =>
      !best ||
      s.weight > best.weight ||
      (s.weight === best.weight && s.reps > best.reps)
        ? s
        : best,
    undefined,
  )
}

export interface SetOnDate {
  set: WorkoutSet
  date: string
}

export interface PerformanceSummary {
  /** Meilleure série de la séance la plus récente. */
  last?: SetOnDate
  /** Charge la plus lourde jamais soulevée (première fois atteinte). */
  maxWeight?: SetOnDate
  /** Meilleur 1RM estimé, et la série qui l'a produit. */
  best1RM?: SetOnDate & { value: number }
}

const chronological = (a: WorkoutEntry, b: WorkoutEntry) =>
  a.date.localeCompare(b.date) || a.id - b.id

/** Séance la plus récente (à date égale, la dernière saisie). */
export const lastEntry = (entries: readonly WorkoutEntry[]) =>
  entries.toSorted(chronological).at(-1)

// Les séries au poids du corps (0 kg) n'établissent pas de record.
export function summarize(
  entries: readonly WorkoutEntry[],
): PerformanceSummary {
  const summary: PerformanceSummary = {}
  for (const entry of entries.toSorted(chronological)) {
    const top = topSet(entry.sets)
    if (top) summary.last = { set: top, date: entry.date }
    for (const set of entry.sets) {
      if (set.weight > (summary.maxWeight?.set.weight ?? 0)) {
        summary.maxWeight = { set, date: entry.date }
      }
      const value = epley1RM(set)
      if (value > (summary.best1RM?.value ?? 0)) {
        summary.best1RM = { set, date: entry.date, value }
      }
    }
  }
  return summary
}

export interface ProgressPoint {
  date: string
  maxWeight: number
  oneRM: number
}

/** Un point par jour d'entraînement : charge max et meilleur 1RM estimé du jour. */
export function progressionSeries(
  entries: readonly WorkoutEntry[],
): ProgressPoint[] {
  const byDate = new Map<string, ProgressPoint>()
  for (const { date, sets } of entries) {
    if (sets.length === 0) continue
    const point = byDate.get(date) ?? { date, maxWeight: 0, oneRM: 0 }
    for (const set of sets) {
      point.maxWeight = Math.max(point.maxWeight, set.weight)
      point.oneRM = Math.max(point.oneRM, epley1RM(set))
    }
    byDate.set(date, point)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export interface NewRecords {
  maxWeight: boolean
  oneRM: boolean
}

/**
 * Records battus par une nouvelle séance par rapport à l'historique.
 * Sans historique, il n'y a rien à battre : la première séance n'est pas un record.
 */
export function detectNewRecords(
  history: readonly WorkoutEntry[],
  sets: readonly WorkoutSet[],
): NewRecords {
  const { maxWeight, best1RM } = summarize(history)
  const weight = Math.max(0, ...sets.map((s) => s.weight))
  const oneRM = Math.max(0, ...sets.map(epley1RM))
  return {
    maxWeight: maxWeight !== undefined && weight > maxWeight.set.weight,
    oneRM: best1RM !== undefined && oneRM > best1RM.value,
  }
}
