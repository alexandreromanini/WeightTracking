import { Link } from 'react-router'
import { ExerciseImage } from '../../components/ExerciseImage'
import { equipmentLabel, muscleLabel } from '../../lib/labels'
import type { Exercise } from '../../types'

/** Ligne de résultat de recherche (pas de carte : voir DESIGN.md). */
export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const muscle = exercise.primaryMuscles[0]
  return (
    <Link
      to={`/exercice/${encodeURIComponent(exercise.id)}`}
      className="-mx-4 flex items-center gap-4 px-4 py-3 hover:bg-chalk active:bg-rule"
    >
      <ExerciseImage
        src={exercise.images[0]}
        name={exercise.name}
        className="size-16 shrink-0"
      />
      <div className="min-w-0">
        <h3 className="leading-snug font-bold">{exercise.name}</h3>
        <p className="mt-0.5 text-label text-steel">
          {muscle && muscleLabel(muscle)}
          {muscle && ' · '}
          {equipmentLabel(exercise.equipment)}
        </p>
      </div>
    </Link>
  )
}
