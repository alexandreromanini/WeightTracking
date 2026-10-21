import { db } from '../db/db'
import type { UserExercise, WorkoutEntry, WorkoutSet } from '../types'

/** Sauvegarde JSON : exercices suivis et séances (le catalogue se re-télécharge). */
export interface Backup {
  format: 'barre-backup'
  version: 1
  exportedAt: string
  userExercises: UserExercise[]
  workouts: WorkoutEntry[]
}

export async function exportBackup(now = new Date()): Promise<Backup> {
  const [userExercises, workouts] = await Promise.all([
    db.userExercises.toArray(),
    db.workouts.toArray(),
  ])
  return {
    format: 'barre-backup',
    version: 1,
    exportedAt: now.toISOString(),
    userExercises,
    workouts,
  }
}

/** Remplace toutes les données suivies. Transaction : tout ou rien. */
export async function restoreBackup({ userExercises, workouts }: Backup) {
  await db.transaction('rw', db.userExercises, db.workouts, async () => {
    await Promise.all([db.userExercises.clear(), db.workouts.clear()])
    await db.userExercises.bulkAdd(userExercises)
    await db.workouts.bulkAdd(workouts)
  })
}

export async function clearAllData() {
  await db.transaction('rw', db.userExercises, db.workouts, async () => {
    await Promise.all([db.userExercises.clear(), db.workouts.clear()])
  })
}

// --- Validation d'un fichier importé (donnée non fiable) ---

export class BackupError extends Error {}

function fail(message: string): never {
  throw new BackupError(message)
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isId = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0
const isOptionalString = (v: unknown): v is string | undefined =>
  v === undefined || typeof v === 'string'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function toUserExercise(v: unknown, n: number): UserExercise {
  if (!isObj(v)) fail(`Exercice n°${n} invalide.`)
  const { id, exerciseId, name, addedAt, image, notes } = v
  if (
    !isId(id) ||
    typeof exerciseId !== 'string' ||
    typeof name !== 'string' ||
    typeof addedAt !== 'string' ||
    !isOptionalString(image) ||
    !isOptionalString(notes)
  ) {
    fail(`Exercice n°${n} invalide.`)
  }
  return { id, exerciseId, name, addedAt, image, notes }
}

function toSet(v: unknown, n: number): WorkoutSet {
  if (!isObj(v)) fail(`Séance n°${n} : série invalide.`)
  const { weight, reps } = v
  if (
    typeof weight !== 'number' ||
    !(weight >= 0 && weight <= 1000) ||
    typeof reps !== 'number' ||
    !Number.isInteger(reps) ||
    reps < 1
  ) {
    fail(`Séance n°${n} : série invalide.`)
  }
  return { weight, reps }
}

function toWorkout(
  v: unknown,
  n: number,
  exerciseIds: Set<number>,
): WorkoutEntry {
  if (!isObj(v)) fail(`Séance n°${n} invalide.`)
  const { id, userExerciseId, date, sets, note } = v
  if (
    !isId(id) ||
    !isId(userExerciseId) ||
    typeof date !== 'string' ||
    !ISO_DATE.test(date) ||
    !Array.isArray(sets) ||
    sets.length === 0 ||
    !isOptionalString(note)
  ) {
    fail(`Séance n°${n} invalide.`)
  }
  if (!exerciseIds.has(userExerciseId)) {
    fail(`Séance n°${n} : exercice inconnu.`)
  }
  return {
    id,
    userExerciseId,
    date,
    sets: sets.map((s) => toSet(s, n)),
    note,
  }
}

const hasDuplicates = (values: readonly unknown[]) =>
  new Set(values).size !== values.length

/** Vérifie un fichier de sauvegarde ; lève une BackupError au message lisible. */
export function parseBackup(raw: unknown): Backup {
  if (!isObj(raw) || raw.format !== 'barre-backup') {
    fail('Ce fichier n’est pas une sauvegarde Barre.')
  }
  if (raw.version !== 1) fail('Version de sauvegarde non prise en charge.')
  if (!Array.isArray(raw.userExercises) || !Array.isArray(raw.workouts)) {
    fail('Sauvegarde incomplète.')
  }

  const userExercises = raw.userExercises.map((v, i) =>
    toUserExercise(v, i + 1),
  )
  if (
    hasDuplicates(userExercises.map((e) => e.id)) ||
    hasDuplicates(userExercises.map((e) => e.exerciseId))
  ) {
    fail('Exercices en double dans la sauvegarde.')
  }

  const exerciseIds = new Set(userExercises.map((e) => e.id))
  const workouts = raw.workouts.map((v, i) => toWorkout(v, i + 1, exerciseIds))
  if (hasDuplicates(workouts.map((w) => w.id))) {
    fail('Séances en double dans la sauvegarde.')
  }

  return {
    format: 'barre-backup',
    version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    userExercises,
    workouts,
  }
}
