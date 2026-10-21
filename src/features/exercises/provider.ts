import type { Exercise } from '../../types'

/** Source du catalogue, interchangeable (free-exercise-db aujourd'hui, wger demain). */
export interface ExerciseProvider {
  getAll(): Promise<Exercise[]>
}

export const BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main'

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : []

// Donnée externe : on ne garde que ce qui a la forme attendue.
function toExercise(raw: unknown): Exercise | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.name !== 'string') return null
  return {
    id: r.id,
    name: r.name,
    category: typeof r.category === 'string' ? r.category : 'strength',
    equipment: typeof r.equipment === 'string' ? r.equipment : null,
    primaryMuscles: strings(r.primaryMuscles),
    secondaryMuscles: strings(r.secondaryMuscles),
    instructions: strings(r.instructions),
    images: strings(r.images).map((path) => `${BASE_URL}/exercises/${path}`),
  }
}

export const freeExerciseDb: ExerciseProvider = {
  async getAll() {
    const res = await fetch(`${BASE_URL}/dist/exercises.json`)
    if (!res.ok) throw new Error(`Catalogue indisponible (HTTP ${res.status})`)
    const data: unknown = await res.json()
    if (!Array.isArray(data)) throw new Error('Format de catalogue inattendu')
    return data.map(toExercise).filter((e) => e !== null)
  },
}
