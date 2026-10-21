import { formatSet, formatWeight } from '../lib/format'
import type { WorkoutSet } from '../types'

const sizes = {
  giant: 'text-giant',
  score: 'text-score',
  title: 'text-title',
}

/**
 * Une charge façon tableau d'affichage : le nombre énorme, l'unité minuscule.
 * Les lecteurs d'écran entendent la phrase complète (« 92,5 kg × 8 »).
 */
export function Score({
  set,
  size = 'score',
}: {
  set: WorkoutSet
  size?: keyof typeof sizes
}) {
  return (
    <span className="block leading-none">
      <span className="sr-only">{formatSet(set)}</span>
      <span aria-hidden className="inline-flex items-baseline gap-1.5">
        <span className={`display italic tabular-nums ${sizes[size]}`}>
          {formatWeight(set.weight)}
        </span>
        {set.weight > 0 && <span className="display text-label">kg</span>}
        <span className="ml-2 display text-lead italic">×{set.reps}</span>
      </span>
    </span>
  )
}
