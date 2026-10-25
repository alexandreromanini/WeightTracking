import { describe, expect, it } from 'vitest'
import { groupByMuscle, muscleGroupOf } from './muscleGroups'

describe('muscleGroupOf', () => {
  it('range chaque muscle du catalogue dans un groupe de séance', () => {
    expect(muscleGroupOf('calves').label).toBe('Mollets')
    expect(muscleGroupOf('chest').label).toBe('Pecs')
    expect(muscleGroupOf('traps').label).toBe('Dos')
    expect(muscleGroupOf('lower back').label).toBe('Dos')
  })

  it('met l’inconnu dans « Autres »', () => {
    expect(muscleGroupOf(undefined).label).toBe('Autres')
    expect(muscleGroupOf('cardio').label).toBe('Autres')
  })
})

describe('groupByMuscle', () => {
  it('suit l’ordre du corps, garde l’ordre interne et omet les groupes vides', () => {
    const items = [
      { name: 'Mollets debout', muscle: 'calves' },
      { name: 'Développé couché', muscle: 'chest' },
      { name: 'Mollets assis', muscle: 'calves' },
      { name: 'Exercice importé', muscle: undefined },
    ]
    const sections = groupByMuscle(items, (i) => i.muscle)
    expect(
      sections.map((s) => [s.group.label, s.items.map((i) => i.name)]),
    ).toEqual([
      ['Pecs', ['Développé couché']],
      ['Mollets', ['Mollets debout', 'Mollets assis']],
      ['Autres', ['Exercice importé']],
    ])
  })
})
