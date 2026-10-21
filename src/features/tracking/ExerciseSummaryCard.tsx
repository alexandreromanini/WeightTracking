import { Link } from 'react-router'
import { ExerciseImage } from '../../components/ExerciseImage'
import { ChartIcon } from '../../components/icons'
import { formatKg, formatRelativeDay, formatSet } from '../../lib/format'
import type { PerformanceSummary } from '../../lib/performance'
import type { UserExercise } from '../../types'

interface Props {
  exercise: UserExercise
  summary: PerformanceSummary
}

// Rouge = record de charge, jaune = 1RM estimé (code couleur « Disques »).
const badgeTones = {
  red: 'bg-plate-red/15 ring-plate-red/60',
  yellow: 'bg-plate-yellow/10 ring-plate-yellow/50',
}

function Badge({
  tone,
  label,
  value,
}: {
  tone: keyof typeof badgeTones
  label: string
  value: string
}) {
  return (
    <div
      className={`flex items-baseline gap-2 rounded-full px-3 py-1 ring-1 ${badgeTones[tone]}`}
    >
      <dt className="text-xs font-semibold tracking-wide text-dust uppercase">
        {label}
      </dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function ExerciseSummaryCard({ exercise, summary }: Props) {
  const { last, maxWeight, best1RM } = summary
  return (
    // Lien « étiré » sur toute la carte : un tap n'importe où ouvre la saisie.
    <article className="relative rounded-xl border border-steel bg-iron p-4 transition-colors hover:border-dust has-[.stretched:active]:bg-steel has-[.stretched:focus-visible]:outline-2 has-[.stretched:focus-visible]:outline-offset-2 has-[.stretched:focus-visible]:outline-plate-yellow">
      <div className="flex items-center gap-3">
        <ExerciseImage
          src={exercise.image}
          name={exercise.name}
          className="size-12 shrink-0 rounded-lg"
        />
        <h2 className="flex-1 font-display text-xl leading-tight font-bold">
          <Link
            to={`/suivi/${exercise.id}/seance`}
            aria-label={`Nouvelle séance : ${exercise.name}`}
            className="stretched outline-none after:absolute after:inset-0"
          >
            {exercise.name}
          </Link>
        </h2>
        {/* Au-dessus du lien étiré (z-10) pour rester cliquable. */}
        <Link
          to={`/suivi/${exercise.id}`}
          aria-label={`Progression : ${exercise.name}`}
          className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border border-steel bg-ink text-plate-blue hover:border-dust"
        >
          <ChartIcon className="size-6" />
        </Link>
      </div>

      {last ? (
        <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="sr-only">Dernière séance :</span>
          <span className="font-display text-4xl font-extrabold tabular-nums">
            {formatSet(last.set)}
          </span>
          <time dateTime={last.date} className="text-sm text-dust">
            {formatRelativeDay(last.date)}
          </time>
        </p>
      ) : (
        <p className="mt-3 text-dust">Pas encore de séance.</p>
      )}

      {(maxWeight ?? best1RM) && (
        <dl className="mt-3 flex flex-wrap gap-2 text-sm">
          {maxWeight && (
            <Badge tone="red" label="Record" value={formatSet(maxWeight.set)} />
          )}
          {best1RM && (
            <Badge
              tone="yellow"
              label="1RM est."
              value={formatKg(best1RM.value)}
            />
          )}
        </dl>
      )}
    </article>
  )
}
