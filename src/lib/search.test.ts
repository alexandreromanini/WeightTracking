import { describe, expect, it } from 'vitest'
import type { Exercise } from '../types'
import { createSearcher, translateQuery } from './search'

const ex = (
  name: string,
  muscle = 'chest',
  equipment: string | null = 'barbell',
): Exercise => ({
  id: name,
  name,
  category: 'strength',
  equipment,
  primaryMuscles: [muscle],
  secondaryMuscles: [],
  instructions: [],
  images: [],
})

const catalog = [
  ex('Barbell Bench Press - Medium Grip'),
  ex('Dumbbell Bench Press', 'chest', 'dumbbell'),
  ex('Barbell Deadlift', 'lower back'),
  ex('Pullups', 'lats', 'body only'),
  ex('Pushups', 'chest', 'body only'),
  ex('Bent Over Barbell Row', 'middle back'),
  ex('Barbell Squat', 'quadriceps'),
  ex('Leg Press', 'quadriceps', 'machine'),
]
const search = createSearcher(catalog)
const names = (q: string, filters = {}) => search(q, filters).map((e) => e.name)

describe('translateQuery', () => {
  it('traduit les expressions avant les mots seuls', () => {
    expect(translateQuery('Rowing barre')).toBe('barbell row')
    expect(translateQuery('développé couché haltères')).toBe(
      'bench press dumbbell',
    )
  })

  it('ignore accents et ponctuation', () => {
    expect(translateQuery('Souleve-de-terre')).toBe('deadlift')
  })
})

describe('createSearcher', () => {
  it('trouve les exercices en français', () => {
    expect(names('développé couché').sort()).toEqual([
      'Barbell Bench Press - Medium Grip',
      'Dumbbell Bench Press',
    ])
    expect(names('soulevé de terre')).toEqual(['Barbell Deadlift'])
    expect(names('tractions')).toEqual(['Pullups'])
    expect(names('rowing barre')[0]).toBe('Bent Over Barbell Row')
  })

  it('remonte les mouvements classiques', () => {
    const classics = createSearcher([
      ex('Barbell Guillotine Bench Press'),
      {
        ...ex('Barbell Bench Press - Medium Grip'),
        id: 'Barbell_Bench_Press_-_Medium_Grip',
      },
    ])
    expect(classics('bench')[0]?.name).toBe('Barbell Bench Press - Medium Grip')
  })

  it('tolère les fautes de frappe', () => {
    expect(names('bench pres')).toContain('Barbell Bench Press - Medium Grip')
    expect(names('squatt')).toEqual(['Barbell Squat'])
  })

  it('filtre par muscle et équipement', () => {
    expect(names('', { muscle: 'quadriceps' })).toEqual([
      'Barbell Squat',
      'Leg Press',
    ])
    expect(names('bench', { equipment: 'dumbbell' })).toEqual([
      'Dumbbell Bench Press',
    ])
  })
})
