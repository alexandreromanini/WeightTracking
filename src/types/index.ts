/** Exercice du catalogue, normalisé quel que soit le provider. */
export interface Exercise {
  id: string
  name: string
  category: string
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  /** URLs absolues. */
  images: string[]
}

/** Exercice suivi par l'utilisateur. Nom et image sont copiés pour ne pas dépendre du catalogue. */
export interface UserExercise {
  id: number
  exerciseId: string
  name: string
  image?: string
  /** Muscle principal (clé du catalogue), pour les sections de l'accueil. */
  muscle?: string
  addedAt: string
  notes?: string
}

export interface WorkoutSet {
  /** Toujours en kg. */
  weight: number
  reps: number
}

export interface WorkoutEntry {
  id: number
  userExerciseId: number
  /** Format YYYY-MM-DD. */
  date: string
  sets: WorkoutSet[]
  note?: string
}
