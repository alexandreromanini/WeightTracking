import { expect, it } from 'vitest'
import { parseBackup } from '../lib/backup'
import { summarize } from '../lib/performance'
import { buildDemoBackup } from './seed'

it('produit une sauvegarde valide, passée, et qui progresse', () => {
  const demo = buildDemoBackup(new Date(2026, 9, 21))
  expect(() => parseBackup(demo)).not.toThrow()

  for (const exercise of demo.userExercises) {
    const history = demo.workouts.filter(
      (w) => w.userExerciseId === exercise.id,
    )
    expect(history.length).toBeGreaterThanOrEqual(8)
    expect(history.every((w) => w.date < '2026-10-21')).toBe(true)

    const firstTop = history[0]?.sets[0]?.weight ?? Infinity
    expect(summarize(history).maxWeight?.set.weight).toBeGreaterThan(firstTop)
  }
})
