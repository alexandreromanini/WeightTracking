/** Libellés français des valeurs (anglaises) du catalogue. */
export const MUSCLE_LABELS: Record<string, string> = {
  abdominals: 'Abdominaux',
  abductors: 'Abducteurs',
  adductors: 'Adducteurs',
  biceps: 'Biceps',
  calves: 'Mollets',
  chest: 'Pectoraux',
  forearms: 'Avant-bras',
  glutes: 'Fessiers',
  hamstrings: 'Ischio-jambiers',
  lats: 'Grand dorsal',
  'lower back': 'Lombaires',
  'middle back': 'Milieu du dos',
  neck: 'Cou',
  quadriceps: 'Quadriceps',
  shoulders: 'Épaules',
  traps: 'Trapèzes',
  triceps: 'Triceps',
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  'e-z curl bar': 'Barre EZ',
  cable: 'Poulie',
  machine: 'Machine',
  'body only': 'Poids du corps',
  kettlebells: 'Kettlebell',
  bands: 'Élastiques',
  'medicine ball': 'Médecine-ball',
  'exercise ball': 'Swiss ball',
  'foam roll': 'Rouleau',
  other: 'Autre',
}

export const muscleLabel = (key: string) => MUSCLE_LABELS[key] ?? key
export const equipmentLabel = (key: string | null) =>
  key ? (EQUIPMENT_LABELS[key] ?? key) : 'Sans matériel'
