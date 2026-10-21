import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { Score } from '../../components/Score'
import { EmptyState, SkeletonList } from '../../components/states'
import {
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  linkAction,
  linkDanger,
} from '../../components/ui'
import { db } from '../../db/db'
import {
  formatKg,
  formatLongDate,
  formatRelativeDay,
  formatSet,
  formatShortDate,
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
      <PageHeader title={exercise.name} back={{ label: 'Mes exos', to: '/' }} />

      {/* Asymétrique : le record prend les deux tiers, le reste s'empile à droite. */}
      <dl className="grid grid-cols-[2fr_1fr] border-y border-rule">
        <div className="py-4 pr-3">
          <dt className="text-label text-steel">Record de charge</dt>
          <dd className="mt-1">
            {summary.maxWeight ? (
              <Score set={summary.maxWeight.set} size="title" />
            ) : (
              <span className="text-steel">Pas encore</span>
            )}
          </dd>
        </div>
        <div className="divide-y divide-rule border-l border-rule">
          <div className="py-2 pl-3">
            <dt className="text-label text-steel">1RM est.</dt>
            <dd className="display text-body italic">
              {summary.best1RM ? formatKg(summary.best1RM.value) : 'Pas encore'}
            </dd>
          </div>
          <div className="py-2 pl-3">
            <dt className="text-label text-steel">Séances</dt>
            <dd className="display text-body italic">{history.length}</dd>
          </div>
        </div>
      </dl>

      <Link
        to={`/suivi/${exercise.id}/seance`}
        className={`${buttonPrimary} mt-6`}
      >
        Nouvelle séance
      </Link>

      <section className="mt-14" aria-labelledby="evolution">
        <h2 id="evolution" className="display text-lead">
          Évolution
        </h2>
        <div className="mt-4">
          {points.length > 0 ? (
            <ProgressChart points={points} />
          ) : (
            <p className="text-steel">
              La courbe apparaîtra après ta première séance.
            </p>
          )}
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="mt-14" aria-labelledby="historique">
          <h2 id="historique" className="display text-lead">
            Historique
          </h2>
          <ol className="mt-4 divide-y divide-rule border-y border-rule">
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
  const [dayNumber, month] = formatShortDate(entry.date).split(' ')
  // summarize() renvoie les séries d'origine : l'identité suffit à retrouver la séance du record.
  const holdsMax =
    summary.maxWeight && entry.sets.includes(summary.maxWeight.set)
  const holds1RM = summary.best1RM && entry.sets.includes(summary.best1RM.set)

  return (
    <li className="grid grid-cols-[3.75rem_1fr] gap-x-3 py-4">
      {/* Colonne de date, comme la marge d'un carnet d'entraînement. */}
      <h3>
        <time dateTime={entry.date} className="flex flex-col">
          <span className="sr-only">{day}</span>
          <span aria-hidden className="display text-title leading-none italic">
            {dayNumber}
          </span>
          <span aria-hidden className="text-label text-steel">
            {month}
          </span>
        </time>
      </h3>
      <div>
        {/* Une série ne se coupe jamais en fin de ligne. */}
        <p className="font-bold tabular-nums">
          {entry.sets.map((set, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              <span className="whitespace-nowrap">{formatSet(set)}</span>
            </span>
          ))}
        </p>
        <p className="mt-0.5 text-label text-steel">
          {formatRelativeDay(entry.date)}
          {holdsMax && (
            <>
              {' · '}
              <span className="font-bold text-electric">Record de charge</span>
            </>
          )}
          {holds1RM && (
            <>
              {' · '}
              <span className="font-bold text-night">Meilleur 1RM</span>
            </>
          )}
        </p>
        {entry.note && (
          <p className="mt-1 text-label text-steel italic">{entry.note}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-5">
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
                className={linkAction}
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <Link
                to={`/suivi/${exerciseId}/seance/${entry.id}`}
                aria-label={`Modifier la séance du ${day}`}
                className={`${linkAction} text-label`}
              >
                Modifier
              </Link>
              <button
                type="button"
                aria-label={`Supprimer la séance du ${day}`}
                onClick={() => setConfirming(true)}
                className="inline-flex min-h-11 items-center text-label text-steel underline underline-offset-4 hover:text-signal"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
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
    <section className="mt-16">
      {confirming ? (
        <div className="space-y-3">
          <p>
            Retirer {exercise.name}
            {sessionCount > 0 &&
              ` et supprimer ses ${sessionCount} séance${sessionCount > 1 ? 's' : ''}`}{' '}
            ? Ce n’est pas réversible.
          </p>
          <div className="flex flex-wrap items-center gap-x-5">
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
              className={linkAction}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={linkDanger}
        >
          Retirer cet exercice de ma liste
        </button>
      )}
    </section>
  )
}
