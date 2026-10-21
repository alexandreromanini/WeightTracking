import { describe, expect, it } from 'vitest'
import { parseSet, stepReps, stepWeight, toDraft } from './sets'

describe('stepWeight', () => {
  it('ajoute ou retire 2,5 kg sans dérive flottante', () => {
    expect(stepWeight('80', 2.5)).toBe('82,5')
    expect(stepWeight('82,5', -2.5)).toBe('80')
    expect(stepWeight('0,1', 0.2)).toBe('0,3')
  })

  it('ne descend pas sous 0 et part de 0 si le champ est vide', () => {
    expect(stepWeight('1', -2.5)).toBe('0')
    expect(stepWeight('', 2.5)).toBe('2,5')
  })
})

describe('stepReps', () => {
  it('reste un entier ≥ 1', () => {
    expect(stepReps('8', 1)).toBe('9')
    expect(stepReps('1', -1)).toBe('1')
    expect(stepReps('', 1)).toBe('1')
  })
})

describe('parseSet', () => {
  it('accepte la virgule et le point', () => {
    expect(parseSet({ weight: '82,5', reps: '8' })).toEqual({
      weight: 82.5,
      reps: 8,
    })
    expect(parseSet({ weight: '82.5', reps: '8' })?.weight).toBe(82.5)
    expect(parseSet({ weight: '0', reps: '12' })).toEqual({
      weight: 0,
      reps: 12,
    })
  })

  it('rejette les saisies invalides', () => {
    for (const draft of [
      { weight: '', reps: '8' },
      { weight: '-5', reps: '8' },
      { weight: 'abc', reps: '8' },
      { weight: '80', reps: '0' },
      { weight: '80', reps: '2,5' },
      { weight: '80', reps: '' },
    ]) {
      expect(parseSet(draft)).toBeNull()
    }
  })

  it('fait l’aller-retour avec toDraft', () => {
    const set = { weight: 102.5, reps: 3 }
    expect(parseSet(toDraft(set))).toEqual(set)
  })
})
