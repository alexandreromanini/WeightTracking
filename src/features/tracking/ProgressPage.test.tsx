import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, it } from 'vitest'
import { db } from '../../db/db'
import { LogWorkoutPage } from './LogWorkoutPage'
import { ProgressPage } from './ProgressPage'

let exerciseId: number

beforeEach(async () => {
  await Promise.all([db.userExercises.clear(), db.workouts.clear()])
  exerciseId = await db.userExercises.add({
    exerciseId: 'Barbell_Squat',
    name: 'Barbell Squat',
    addedAt: new Date().toISOString(),
  })
  await db.workouts.bulkAdd([
    {
      userExerciseId: exerciseId,
      date: '2026-10-01',
      sets: [{ weight: 100, reps: 5 }],
    },
    {
      userExerciseId: exerciseId,
      date: '2026-10-08',
      sets: [{ weight: 90, reps: 8 }],
      note: 'Genou OK',
    },
  ])
})

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/suivi/${exerciseId}`]}>
      <Routes>
        <Route path="/suivi/:id" element={<ProgressPage />} />
        <Route path="/suivi/:id/seance/:entryId" element={<LogWorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )

it('résume les records et liste l’historique du plus récent au plus ancien', async () => {
  renderPage()

  const history = within(
    await screen.findByRole('region', { name: 'Historique' }),
  )
  expect(screen.getAllByText('100 kg × 5')).toHaveLength(2) // stat + historique
  expect(screen.getByText('116,7 kg')).toBeInTheDocument() // 100 × (1 + 5/30)

  const days = history.getAllByRole('heading', { level: 3 })
  expect(days.map((h) => h.textContent)).toEqual([
    expect.stringContaining('8 octobre'),
    expect.stringContaining('1 octobre'),
  ])
  expect(history.getByText('Genou OK')).toBeInTheDocument()
  expect(history.getByText('Record de charge')).toBeInTheDocument()
})

it('supprime une séance après confirmation', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(
    await screen.findByRole('button', {
      name: /Supprimer la séance du .*8 octobre/,
    }),
  )
  const confirm = screen.getByRole('button', {
    name: 'Confirmer la suppression',
  })
  expect(confirm).toHaveFocus()
  await user.click(confirm)

  // useLiveQuery re-rend après l'écriture : on attend la disparition.
  await waitFor(() => {
    expect(screen.queryByText('Genou OK')).not.toBeInTheDocument()
  })
  expect(await db.workouts.count()).toBe(1)
})

it('modifie une séance existante sans en créer une nouvelle', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(
    await screen.findByRole('link', {
      name: /Modifier la séance du .*1 octobre/,
    }),
  )
  expect(await screen.findByText('Modifier la séance')).toBeInTheDocument()
  expect(screen.getByLabelText('Poids, série 1')).toHaveValue('100')

  await user.click(
    screen.getByRole('button', { name: 'Répétitions, série 1, plus 1 reps' }),
  )
  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

  const history = within(
    await screen.findByRole('region', { name: 'Historique' }),
  )
  expect(history.getByText('100 kg × 6')).toBeInTheDocument()
  expect(await db.workouts.count()).toBe(2)
})
