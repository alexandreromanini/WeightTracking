import { useEffect, useState } from 'react'
import { db } from '../db/db'
import {
  freeExerciseDb,
  type ExerciseProvider,
} from '../features/exercises/provider'
import type { Exercise } from '../types'

let pending: Promise<Exercise[]> | null = null

/** Charge le catalogue une seule fois : IndexedDB d'abord, sinon le provider. */
// Limite : cache jamais rafraîchi, ajouter une version de catalogue si la source évolue
export function loadCatalog(
  provider: ExerciseProvider = freeExerciseDb,
): Promise<Exercise[]> {
  pending ??= (async () => {
    const cached = await db.exercises.toArray()
    if (cached.length > 0) return cached
    const fresh = await provider.getAll()
    await db.exercises.bulkPut(fresh)
    return fresh
  })().catch((err: unknown) => {
    pending = null
    throw err
  })
  return pending
}

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; exercises: Exercise[] }

export function useExerciseCatalog() {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    loadCatalog().then(
      (exercises) => active && setState({ status: 'ready', exercises }),
      () => active && setState({ status: 'error' }),
    )
    return () => {
      active = false
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  return { state, retry }
}
