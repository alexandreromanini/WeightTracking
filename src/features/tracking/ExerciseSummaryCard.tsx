import { Link } from 'react-router'
import { Score } from '../../components/Score'
import { formatKg, formatRelativeDay, formatSet } from '../../lib/format'
import type { PerformanceSummary } from '../../lib/performance'
import type { UserExercise } from '../../types'

interface Props {
  exercise: UserExercise
  summary: PerformanceSummary
  /** Le plus récent : chiffre en `giant` au lieu de `score` (voir DESIGN.md). */
  featured?: boolean
}

/** Ligne de l'accueil : un tap n'importe où ouvre la saisie (lien « étiré »). */
export function ExerciseSummaryCard({ exercise, summary, featured }: Props) {
  const { last, maxWeight, best1RM } = summary
  return (
    <article className="relative py-5 has-[.stretched:active]:bg-chalk has-[.stretched:focus-visible]:outline-2 has-[.stretched:focus-visible]:outline-electric">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="leading-snug font-bold">
          <Link
            to={`/suivi/${exercise.id}/seance`}
            aria-label={`Nouvelle séance : ${exercise.name}`}
            className="stretched outline-none after:absolute after:inset-0"
          >
            {exercise.name}
          </Link>
        </h2>
        {last && (
          <time dateTime={last.date} className="shrink-0 text-label text-steel">
            {formatRelativeDay(last.date)}
          </time>
        )}
      </div>

      {last ? (
        <p className="mt-2 leading-none">
          <span className="sr-only">Dernière séance : </span>
          <Score set={last.set} size={featured ? 'giant' : 'score'} />
        </p>
      ) : (
        <p className="mt-2 text-steel">
          Pas encore de séance. Touche pour noter la première.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-4">
        {(maxWeight ?? best1RM) ? (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-label">
            {maxWeight && (
              <div className="flex gap-1.5">
                <dt className="text-steel">Record</dt>
                <dd className="font-bold text-electric">
                  {formatSet(maxWeight.set)}
                </dd>
              </div>
            )}
            {best1RM && (
              <div className="flex gap-1.5">
                <dt className="text-steel">1RM est.</dt>
                <dd className="font-bold">{formatKg(best1RM.value)}</dd>
              </div>
            )}
          </dl>
        ) : (
          <span />
        )}
        {/* Au-dessus du lien étiré (z-10) pour rester cliquable. */}
        <Link
          to={`/suivi/${exercise.id}`}
          aria-label={`Progression : ${exercise.name}`}
          className="relative z-10 -my-3 inline-flex min-h-11 shrink-0 items-center text-label font-bold text-electric underline decoration-2 underline-offset-4"
        >
          Courbe
        </Link>
      </div>
    </article>
  )
}
