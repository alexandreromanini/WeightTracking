import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ExerciseImage } from './ExerciseImage'

it('affiche les initiales quand l’image ne charge pas', () => {
  render(<ExerciseImage src="/cassee.jpg" name="Barbell Squat" alt="Squat" />)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByRole('img', { name: 'Squat' })).toHaveTextContent('BS')
})
