import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it } from 'vitest'
import { db } from '../../db/db'
import { toISODate } from '../../lib/format'
import { MyExercisesPage } from './MyExercisesPage'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISODate(d)
}

beforeEach(async () => {
  await Promise.all([db.userExercises.clear(), db.workouts.clear()])
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyExercisesPage />
    </MemoryRouter>,
  )

it('affiche la dernière perf et les deux records de chaque exercice', async () => {
  const id = await db.userExercises.add({
    exerciseId: 'Barbell_Squat',
    name: 'Barbell Squat',
    addedAt: new Date().toISOString(),
  })
  await db.workouts.bulkAdd([
    { userExerciseId: id, date: daysAgo(10), sets: [{ weight: 100, reps: 2 }] },
    { userExerciseId: id, date: daysAgo(3), sets: [{ weight: 80, reps: 8 }] },
  ])

  renderPage()

  const card = await screen.findByRole('article')
  expect(within(card).getByText('80 kg × 8')).toBeInTheDocument()
  expect(within(card).getByText('il y a 3 jours')).toBeInTheDocument()
  expect(within(card).getByText('100 kg × 2')).toBeInTheDocument() // record de charge
  expect(within(card).getByText('106,7 kg')).toBeInTheDocument() // 1RM : 100 × (1 + 2/30)
})

it('invite à ajouter un exercice quand la liste est vide', async () => {
  renderPage()
  expect(
    await screen.findByRole('link', { name: 'Trouver un exercice' }),
  ).toHaveAttribute('href', '/recherche')
})
