import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, it } from 'vitest'
import { db } from '../../db/db'
import { LogWorkoutPage } from './LogWorkoutPage'

let exerciseId: number

beforeEach(async () => {
  await Promise.all([db.userExercises.clear(), db.workouts.clear()])
  exerciseId = await db.userExercises.add({
    exerciseId: 'Barbell_Squat',
    name: 'Barbell Squat',
    addedAt: new Date().toISOString(),
  })
  await db.workouts.add({
    userExerciseId: exerciseId,
    date: '2026-10-01',
    sets: [
      { weight: 100, reps: 5 },
      { weight: 100, reps: 4 },
    ],
  })
})

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/suivi/${exerciseId}/seance`]}>
      <Routes>
        <Route path="/suivi/:id/seance" element={<LogWorkoutPage />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )

it('pré-remplit avec la dernière séance et célèbre un nouveau record', async () => {
  const user = userEvent.setup()
  renderPage()

  const weight1 = await screen.findByLabelText('Poids, série 1')
  expect(weight1).toHaveValue('100')
  expect(screen.getByLabelText('Répétitions, série 2')).toHaveValue('4')

  await user.click(
    screen.getByRole('button', { name: 'Poids, série 1, plus 2,5 kg' }),
  )
  expect(weight1).toHaveValue('102,5')

  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

  expect(
    await screen.findByRole('heading', { name: 'Nouveau record !' }),
  ).toHaveFocus()
  expect(screen.getByText('Charge max · 102,5 kg × 5')).toBeInTheDocument()
  expect(screen.getByText(/1RM estimé/)).toBeInTheDocument()
  expect(await db.workouts.count()).toBe(2)
})

it('revient à l’accueil sans célébration quand aucun record n’est battu', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.clear(await screen.findByLabelText('Poids, série 1'))
  await user.type(screen.getByLabelText('Poids, série 1'), '90')
  await user.click(screen.getByRole('button', { name: 'Supprimer la série 2' }))
  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

  expect(await screen.findByText('Accueil')).toBeInTheDocument()
  const saved = await db.workouts.orderBy('id').last()
  expect(saved?.sets).toEqual([{ weight: 90, reps: 5 }])
})

it('bloque l’enregistrement d’une saisie invalide', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.clear(await screen.findByLabelText('Répétitions, série 1'))
  expect(screen.getByLabelText('Répétitions, série 1')).toBeInvalid()
  expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
})
