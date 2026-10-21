import { Link } from 'react-router'
import { ExerciseImage } from '../../components/ExerciseImage'
import { equipmentLabel, muscleLabel } from '../../lib/labels'
import type { Exercise } from '../../types'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const muscle = exercise.primaryMuscles[0]
  return (
    <Link
      to={`/exercice/${encodeURIComponent(exercise.id)}`}
      className="flex items-center gap-4 rounded-xl border border-line bg-card p-3 transition-colors hover:border-muted active:bg-line"
    >
      <ExerciseImage
        src={exercise.images[0]}
        name={exercise.name}
        className="size-20 shrink-0 rounded-lg"
      />
      <div className="min-w-0">
        <h3 className="text-lg leading-snug font-bold">{exercise.name}</h3>
        <p className="mt-1 text-sm text-muted">
          {muscle && (
            <span className="font-semibold text-ink">
              {muscleLabel(muscle)}
            </span>
          )}
          {muscle && ' · '}
          {equipmentLabel(exercise.equipment)}
        </p>
      </div>
    </Link>
  )
}
