import { describe, expect, it } from 'vitest'
import type { WorkoutEntry, WorkoutSet } from '../types'
import {
  detectNewRecords,
  epley1RM,
  lastEntry,
  progressionSeries,
  summarize,
  topSet,
} from './performance'

const set = (weight: number, reps: number): WorkoutSet => ({ weight, reps })
let nextId = 1
const entry = (date: string, ...sets: WorkoutSet[]): WorkoutEntry => ({
  id: nextId++,
  userExerciseId: 1,
  date,
  sets,
})

describe('epley1RM', () => {
  it('applique la formule d’Epley', () => {
    expect(epley1RM(set(100, 10))).toBeCloseTo(133.33, 2)
    expect(epley1RM(set(80, 8))).toBeCloseTo(101.33, 2)
  })

  it('renvoie la charge pour une seule rep, 0 si rien n’est soulevé', () => {
    expect(epley1RM(set(140, 1))).toBe(140)
    expect(epley1RM(set(100, 0))).toBe(0)
    expect(epley1RM(set(0, 12))).toBe(0)
  })
})

describe('topSet', () => {
  it('prend la plus lourde, puis la plus longue', () => {
    expect(topSet([set(80, 8), set(85, 5), set(85, 6), set(70, 12)])).toEqual(
      set(85, 6),
    )
    expect(topSet([])).toBeUndefined()
  })
})

describe('lastEntry', () => {
  it('prend la date la plus récente, puis la dernière saisie du jour', () => {
    const a = entry('2026-10-18', set(80, 8))
    const b = entry('2026-10-18', set(60, 12))
    expect(lastEntry([b, entry('2026-10-01', set(75, 8)), a])).toBe(b)
    expect(lastEntry([])).toBeUndefined()
  })
})

describe('summarize', () => {
  it('trouve la dernière séance quel que soit l’ordre de saisie', () => {
    const summary = summarize([
      entry('2026-10-18', set(80, 8)),
      entry('2026-10-01', set(75, 8)),
    ])
    expect(summary.last).toEqual({ set: set(80, 8), date: '2026-10-18' })
  })

  it('distingue record de charge et record de 1RM estimé', () => {
    const summary = summarize([
      entry('2026-10-01', set(100, 1)),
      entry('2026-10-08', set(90, 8)),
      entry('2026-10-15', set(85, 5)),
    ])
    expect(summary.maxWeight).toEqual({ set: set(100, 1), date: '2026-10-01' })
    expect(summary.best1RM?.set).toEqual(set(90, 8))
    expect(summary.best1RM?.value).toBeCloseTo(114)
    expect(summary.last?.set).toEqual(set(85, 5))
  })

  it('n’établit pas de record au poids du corps', () => {
    const summary = summarize([entry('2026-10-01', set(0, 12))])
    expect(summary.last?.set).toEqual(set(0, 12))
    expect(summary.maxWeight).toBeUndefined()
    expect(summary.best1RM).toBeUndefined()
  })

  it('gère un historique vide', () => {
    expect(summarize([])).toEqual({})
  })
})

describe('progressionSeries', () => {
  it('fusionne les séances d’un même jour et trie par date', () => {
    const series = progressionSeries([
      entry('2026-10-08', set(90, 8)),
      entry('2026-10-01', set(100, 1), set(80, 10)),
      entry('2026-10-08', set(95, 2)),
      entry('2026-10-09'),
    ])
    expect(series.map((p) => [p.date, p.maxWeight])).toEqual([
      ['2026-10-01', 100],
      ['2026-10-08', 95],
    ])
    expect(series[0]?.oneRM).toBeCloseTo(106.67, 2) // 80 × 10 bat 100 × 1
    expect(series[1]?.oneRM).toBeCloseTo(114) // 90 × 8
  })
})

describe('detectNewRecords', () => {
  const history = [entry('2026-10-01', set(100, 3), set(90, 6))] // 1RM max = 110

  it('détecte chaque record indépendamment', () => {
    expect(detectNewRecords(history, [set(102.5, 1)])).toEqual({
      maxWeight: true,
      oneRM: false,
    })
    expect(detectNewRecords(history, [set(95, 6)])).toEqual({
      maxWeight: false,
      oneRM: true,
    })
    expect(detectNewRecords(history, [set(105, 3)])).toEqual({
      maxWeight: true,
      oneRM: true,
    })
  })

  it('ne compte pas une égalité comme un record', () => {
    expect(detectNewRecords(history, [set(100, 3)])).toEqual({
      maxWeight: false,
      oneRM: false,
    })
  })

  it('ne célèbre pas la toute première séance', () => {
    expect(detectNewRecords([], [set(60, 10)])).toEqual({
      maxWeight: false,
      oneRM: false,
    })
  })
})
