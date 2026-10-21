import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { PlusIcon } from '../../components/icons'
import { EmptyState, SkeletonList } from '../../components/states'
import {
  buttonPrimary,
  buttonSecondary,
  buttonDanger,
  buttonSmall,
} from '../../components/ui'
import { db } from '../../db/db'
import {
  formatKg,
  formatLongDate,
  formatRelativeDay,
  formatSet,
} from '../../lib/format'
import {
  progressionSeries,
  summarize,
  type PerformanceSummary,
} from '../../lib/performance'
import type { UserExercise, WorkoutEntry } from '../../types'
import { ProgressChart } from './ProgressChart'

export function ProgressPage() {
  const userExerciseId = Number(useParams().id)
  const data = useLiveQuery(async () => {
    if (!Number.isInteger(userExerciseId)) return null
    const exercise = await db.userExercises.get(userExerciseId)
    if (!exercise) return null
    const history = await db.workouts
      .where('userExerciseId')
      .equals(userExerciseId)
      .toArray()
    return { exercise, history }
  }, [userExerciseId])

  if (data === undefined) return <SkeletonList count={3} label="Chargement…" />
  if (data === null) {
    return (
      <EmptyState
        title="Exercice introuvable"
        action={
          <Link to="/" className={buttonSecondary}>
            Mes exercices
          </Link>
        }
      />
    )
  }

  const { exercise, history } = data
  const summary = summarize(history)
  const points = progressionSeries(history)
  const sessions = history.toSorted(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  )

  return (
    <>
      <PageHeader
        eyebrow="Progression"
        title={exercise.name}
        back={{ label: 'Mes exos', to: '/' }}
      />

      <Link
        to={`/suivi/${exercise.id}/seance`}
        className={`${buttonPrimary} w-full`}
      >
        <PlusIcon className="size-6" /> Nouvelle séance
      </Link>

      <dl className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="Record">
          {summary.maxWeight ? formatSet(summary.maxWeight.set) : '—'}
        </Stat>
        <Stat label="1RM est.">
          {summary.best1RM ? formatKg(summary.best1RM.value) : '—'}
        </Stat>
        <Stat label="Séances">{history.length}</Stat>
      </dl>

      <section className="mt-8" aria-labelledby="evolution">
        <h2 id="evolution" className="text-xl font-bold">
          Évolution
        </h2>
        <div className="mt-3 rounded-xl border border-line bg-card p-4">
          {points.length > 0 ? (
            <ProgressChart points={points} />
          ) : (
            <p className="py-8 text-center text-muted">
              Enregistre une première séance pour voir ta courbe.
            </p>
          )}
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="mt-8" aria-labelledby="historique">
          <h2 id="historique" className="text-xl font-bold">
            Historique
          </h2>
          <ol className="mt-3 space-y-3">
            {sessions.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                exerciseId={exercise.id}
                summary={summary}
              />
            ))}
          </ol>
        </section>
      )}

      <RemoveExercise exercise={exercise} sessionCount={history.length} />
    </>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-base leading-tight font-bold whitespace-nowrap tabular-nums">
        {children}
      </dd>
    </div>
  )
}

/** Bascule « action → confirmer / annuler », avec le focus sur la confirmation. */
function useConfirm() {
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
  }, [confirming])
  return { confirming, setConfirming, confirmRef }
}

interface HistoryItemProps {
  entry: WorkoutEntry
  exerciseId: number
  summary: PerformanceSummary
}

function HistoryItem({ entry, exerciseId, summary }: HistoryItemProps) {
  const { confirming, setConfirming, confirmRef } = useConfirm()
  const day = formatLongDate(entry.date)
  // summarize() renvoie les séries d'origine : l'identité suffit à retrouver la séance du record.
  const holdsMax =
    summary.maxWeight && entry.sets.includes(summary.maxWeight.set)
  const holds1RM = summary.best1RM && entry.sets.includes(summary.best1RM.set)

  return (
    <li className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold first-letter:uppercase">
          <time dateTime={entry.date}>{day}</time>
        </h3>
        <span className="shrink-0 text-sm text-muted">
          {formatRelativeDay(entry.date)}
        </span>
      </div>
      <p className="mt-1 text-lg tabular-nums">
        {entry.sets.map(formatSet).join(' · ')}
      </p>
      {(holdsMax ?? holds1RM) && (
        <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          {holdsMax && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand ring-1 ring-brand/30">
              Record de charge
            </span>
          )}
          {holds1RM && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 ring-1 ring-amber-300">
              Meilleur 1RM
            </span>
          )}
        </p>
      )}
      {entry.note && (
        <p className="mt-2 text-sm text-muted italic">{entry.note}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {confirming ? (
          <>
            <button
              ref={confirmRef}
              type="button"
              onClick={() => void db.workouts.delete(entry.id)}
              className={buttonDanger}
            >
              Confirmer la suppression
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={buttonSmall}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <Link
              to={`/suivi/${exerciseId}/seance/${entry.id}`}
              aria-label={`Modifier la séance du ${day}`}
              className={buttonSmall}
            >
              Modifier
            </Link>
            <button
              type="button"
              aria-label={`Supprimer la séance du ${day}`}
              onClick={() => setConfirming(true)}
              className={buttonSmall}
            >
              Supprimer
            </button>
          </>
        )}
      </div>
    </li>
  )
}

function RemoveExercise({
  exercise,
  sessionCount,
}: {
  exercise: UserExercise
  sessionCount: number
}) {
  const { confirming, setConfirming, confirmRef } = useConfirm()
  const navigate = useNavigate()

  const remove = async () => {
    await db.transaction('rw', db.userExercises, db.workouts, async () => {
      await db.workouts.where('userExerciseId').equals(exercise.id).delete()
      await db.userExercises.delete(exercise.id)
    })
    void navigate('/')
  }

  return (
    <section className="mt-12 border-t border-line pt-6">
      {confirming ? (
        <div className="space-y-3">
          <p>
            Retirer {exercise.name}
            {sessionCount > 0 &&
              ` et supprimer ses ${sessionCount} séance${sessionCount > 1 ? 's' : ''}`}{' '}
            ? Cette action est définitive.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              ref={confirmRef}
              type="button"
              onClick={() => void remove()}
              className={buttonDanger}
            >
              Oui, retirer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={buttonSmall}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${buttonSmall} text-muted`}
        >
          Retirer de mes exercices
        </button>
      )}
    </section>
  )
}
