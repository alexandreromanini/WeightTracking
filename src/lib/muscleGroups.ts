/** Sections de l'accueil : muscles du catalogue regroupés comme on pense une séance. */
export interface MuscleGroup {
  key: string
  label: string
  muscles: readonly string[]
}

// Ordre du corps, de haut en bas : on sait où chercher sans lire.
export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  { key: 'pecs', label: 'Pecs', muscles: ['chest'] },
  {
    key: 'dos',
    label: 'Dos',
    muscles: ['lats', 'middle back', 'lower back', 'traps'],
  },
  { key: 'epaules', label: 'Épaules', muscles: ['shoulders', 'neck'] },
  { key: 'biceps', label: 'Biceps', muscles: ['biceps'] },
  { key: 'triceps', label: 'Triceps', muscles: ['triceps'] },
  { key: 'avant-bras', label: 'Avant-bras', muscles: ['forearms'] },
  { key: 'abdos', label: 'Abdos', muscles: ['abdominals'] },
  { key: 'quadriceps', label: 'Quadriceps', muscles: ['quadriceps'] },
  { key: 'ischios', label: 'Ischios', muscles: ['hamstrings'] },
  { key: 'fessiers', label: 'Fessiers', muscles: ['glutes', 'abductors'] },
  { key: 'adducteurs', label: 'Adducteurs', muscles: ['adductors'] },
  { key: 'mollets', label: 'Mollets', muscles: ['calves'] },
]

export const OTHER_GROUP: MuscleGroup = {
  key: 'autres',
  label: 'Autres',
  muscles: [],
}

export function muscleGroupOf(muscle: string | undefined): MuscleGroup {
  return (
    MUSCLE_GROUPS.find(
      (g) => muscle !== undefined && g.muscles.includes(muscle),
    ) ?? OTHER_GROUP
  )
}

/** Sections non vides, dans l'ordre du corps ; l'ordre des éléments est conservé. */
export function groupByMuscle<T>(
  items: readonly T[],
  muscleOf: (item: T) => string | undefined,
): { group: MuscleGroup; items: T[] }[] {
  const sections = new Map<string, T[]>()
  for (const item of items) {
    const { key } = muscleGroupOf(muscleOf(item))
    sections.set(key, [...(sections.get(key) ?? []), item])
  }
  return [...MUSCLE_GROUPS, OTHER_GROUP].flatMap((group) => {
    const groupItems = sections.get(group.key)
    return groupItems ? [{ group, items: groupItems }] : []
  })
}
