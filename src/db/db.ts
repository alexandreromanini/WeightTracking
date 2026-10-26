import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, UserExercise, WorkoutEntry } from '../types'

// Nom de base conservé (ancien nom de l'app) : le changer viderait les données des utilisateurs.
export const db = new Dexie('barre') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  userExercises: EntityTable<UserExercise, 'id'>
  workouts: EntityTable<WorkoutEntry, 'id'>
}

db.version(1).stores({
  exercises: 'id',
  userExercises: '++id, &exerciseId',
  workouts: '++id, userExerciseId, [userExerciseId+date]',
})
