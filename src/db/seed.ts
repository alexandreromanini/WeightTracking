import { BASE_URL } from '../features/exercises/provider'
import type { Backup } from '../lib/backup'
import { toISODate } from '../lib/format'
import type { UserExercise, WorkoutEntry } from '../types'

interface DemoLift {
  exerciseId: string
  muscle: string
  name: string
  start: number
  step: number
  reps: number
  everyDays: number
}

const LIFTS: DemoLift[] = [
  {
    exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
    muscle: 'chest',
    name: 'Barbell Bench Press - Medium Grip',
    start: 70,
    step: 2.5,
    reps: 8,
    everyDays: 4,
  },
  {
    exerciseId: 'Barbell_Squat',
    muscle: 'quadriceps',
    name: 'Barbell Squat',
    start: 90,
    step: 5,
    reps: 6,
    everyDays: 7,
  },
  {
    exerciseId: 'Barbell_Deadlift',
    muscle: 'lower back',
    name: 'Barbell Deadlift',
    start: 120,
    step: 5,
    reps: 5,
    everyDays: 7,
  },
  {
    exerciseId: 'Standing_Military_Press',
    muscle: 'shoulders',
    name: 'Standing Military Press',
    start: 40,
    step: 2.5,
    reps: 6,
    everyDays: 7,
  },
  {
    exerciseId: 'Bent_Over_Barbell_Row',
    muscle: 'middle back',
    name: 'Bent Over Barbell Row',
    start: 60,
    step: 2.5,
    reps: 8,
    everyDays: 7,
  },
]

const HISTORY_DAYS = 70

const daysBefore = (today: Date, days: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Historique de démo déterministe (~10 semaines) : progression linéaire,
 * une séance ratée toutes les 5 et une décharge toutes les 7, pour une courbe crédible.
 */
export function buildDemoBackup(today = new Date()): Backup {
  const userExercises: UserExercise[] = []
  const workouts: WorkoutEntry[] = []

  LIFTS.forEach((lift, i) => {
    const userExerciseId = i + 1
    userExercises.push({
      id: userExerciseId,
      exerciseId: lift.exerciseId,
      name: lift.name,
      muscle: lift.muscle,
      image: `${BASE_URL}/exercises/${lift.exerciseId}/0.jpg`,
      addedAt: daysBefore(today, HISTORY_DAYS + 1).toISOString(),
    })

    for (
      let session = 0, daysAgo = HISTORY_DAYS - i;
      daysAgo >= 1;
      session++, daysAgo -= lift.everyDays
    ) {
      const deload = session % 7 === 6 ? 2 : 0
      const weight = lift.start + lift.step * (Math.floor(session / 2) - deload)
      const reps = lift.reps - (session % 5 === 4 ? 2 : 0)
      workouts.push({
        id: workouts.length + 1,
        userExerciseId,
        date: toISODate(daysBefore(today, daysAgo)),
        sets: [
          { weight, reps },
          { weight, reps: reps - 1 },
          { weight: weight - lift.step * 2, reps: reps + 2 },
        ],
      })
    }
  })

  return {
    format: 'barre-backup',
    version: 1,
    exportedAt: today.toISOString(),
    userExercises,
    workouts,
  }
}
