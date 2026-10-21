import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, UserExercise, WorkoutEntry } from '../types'

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
