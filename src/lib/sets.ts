import type { WorkoutSet } from '../types'

/** Série en cours de saisie : texte brut des champs, validé à l'enregistrement. */
export interface SetDraft {
  weight: string
  reps: string
}

export const WEIGHT_STEP = 2.5

const toNumber = (text: string) =>
  text.trim() === '' ? NaN : Number(text.replace(',', '.'))

/** 82.5 → « 82,5 » : la virgule, comme sur un clavier français. */
export const formatWeightInput = (weight: number) =>
  String(weight).replace('.', ',')

export const toDraft = ({ weight, reps }: WorkoutSet): SetDraft => ({
  weight: formatWeightInput(weight),
  reps: String(reps),
})

export function stepWeight(text: string, delta: number): string {
  const current = toNumber(text)
  const next = (Number.isFinite(current) ? current : 0) + delta
  // Arrondi au centième pour éviter les 82.49999… des flottants.
  return formatWeightInput(Math.max(0, Math.round(next * 100) / 100))
}

export function stepReps(text: string, delta: number): string {
  const current = Math.round(toNumber(text))
  return String(Math.max(1, (Number.isFinite(current) ? current : 0) + delta))
}

/** Poids entre 0 (poids du corps) et 1000 kg, sinon null. */
export function parseWeight(text: string): number | null {
  const weight = toNumber(text)
  return weight >= 0 && weight <= 1000 ? weight : null
}

/** Nombre entier de répétitions ≥ 1, sinon null. */
export function parseReps(text: string): number | null {
  const reps = toNumber(text)
  return Number.isInteger(reps) && reps >= 1 && reps <= 1000 ? reps : null
}

export function parseSet(draft: SetDraft): WorkoutSet | null {
  const weight = parseWeight(draft.weight)
  const reps = parseReps(draft.reps)
  return weight === null || reps === null ? null : { weight, reps }
}
