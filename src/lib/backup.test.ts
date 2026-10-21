import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import {
  BackupError,
  clearAllData,
  exportBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from './backup'

const valid = (): Backup => ({
  format: 'barre-backup',
  version: 1,
  exportedAt: '2026-10-21T10:00:00.000Z',
  userExercises: [
    {
      id: 1,
      exerciseId: 'Barbell_Squat',
      name: 'Barbell Squat',
      addedAt: '2026-09-01T10:00:00.000Z',
    },
  ],
  workouts: [
    {
      id: 1,
      userExerciseId: 1,
      date: '2026-10-01',
      sets: [{ weight: 100, reps: 5 }],
      note: 'RAS',
    },
  ],
})

describe('parseBackup', () => {
  it('accepte une sauvegarde valide passée par JSON', () => {
    const roundTrip: unknown = JSON.parse(JSON.stringify(valid()))
    expect(parseBackup(roundTrip)).toMatchObject(valid())
  })

  it('rejette tout ce qui pourrait corrompre la base', () => {
    const broken: [string, (b: Backup) => unknown][] = [
      ['pas une sauvegarde', () => ({ hello: 'world' })],
      ['version future', (b) => ({ ...b, version: 2 })],
      [
        'séance orpheline',
        (b) => ({ ...b, workouts: [{ ...b.workouts[0], userExerciseId: 9 }] }),
      ],
      [
        'date libre',
        (b) => ({ ...b, workouts: [{ ...b.workouts[0], date: 'hier' }] }),
      ],
      [
        'reps décimales',
        (b) => ({
          ...b,
          workouts: [{ ...b.workouts[0], sets: [{ weight: 100, reps: 2.5 }] }],
        }),
      ],
      [
        'poids négatif',
        (b) => ({
          ...b,
          workouts: [{ ...b.workouts[0], sets: [{ weight: -5, reps: 5 }] }],
        }),
      ],
      [
        'exercice en double',
        (b) => ({
          ...b,
          userExercises: [...b.userExercises, { ...b.userExercises[0], id: 2 }],
        }),
      ],
    ]
    for (const [label, mutate] of broken) {
      expect(() => parseBackup(mutate(valid())), label).toThrow(BackupError)
    }
  })
})

describe('restauration', () => {
  beforeEach(clearAllData)

  it('fait l’aller-retour export → import sans perte', async () => {
    await restoreBackup(valid())
    const exported = await exportBackup(new Date('2026-10-21T10:00:00.000Z'))
    expect(exported).toEqual(valid())
  })

  it('remplace les données existantes au lieu de les fusionner', async () => {
    await db.userExercises.add({
      exerciseId: 'Pullups',
      name: 'Pullups',
      addedAt: '2026-01-01T00:00:00.000Z',
    })
    await restoreBackup(valid())
    expect((await db.userExercises.toArray()).map((e) => e.exerciseId)).toEqual(
      ['Barbell_Squat'],
    )
  })
})
