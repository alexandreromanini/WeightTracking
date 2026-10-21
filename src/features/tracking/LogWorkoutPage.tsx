import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { Stepper } from '../../components/Stepper'
import { Score } from '../../components/Score'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, buttonSecondary, linkAction } from '../../components/ui'
import { db } from '../../db/db'
import {
  formatKg,
  formatLongDate,
  formatRelativeDay,
  formatSet,
  toISODate,
} from '../../lib/format'
import {
  detectNewRecords,
  lastEntry,
  summarize,
  type NewRecords,
  type PerformanceSummary,
} from '../../lib/performance'
import {
  parseReps,
  parseSet,
  parseWeight,
  stepReps,
  stepWeight,
  toDraft,
  WEIGHT_STEP,
  type SetDraft,
} from '../../lib/sets'
import type { UserExercise, WorkoutEntry } from '../../types'

// Point de départ sans historique : une barre olympique à vide.
const DEFAULT_SET = { weight: 20, reps: 8 }

type KeyedDraft = SetDraft & { key: number }
let nextKey = 0
const withKey = (draft: SetDraft): KeyedDraft => ({ ...draft, key: nextKey++ })

/** Nouvelle séance (`/suivi/:id/seance`) ou modification (`/suivi/:id/seance/:entryId`). */
export function LogWorkoutPage() {
  const params = useParams()
  const userExerciseId = Number(params.id)
  const entryId =
    params.entryId === undefined ? undefined : Number(params.entryId)
  const data = useLiveQuery(async () => {
    if (!Number.isInteger(userExerciseId)) return null
    const exercise = await db.userExercises.get(userExerciseId)
    if (!exercise) return null
    const history = await db.workouts
      .where('userExerciseId')
      .equals(userExerciseId)
      .toArray()
    const editing = history.find((e) => e.id === entryId)
    if (entryId !== undefined && !editing) return null
    return { exercise, history, editing }
  }, [userExerciseId, entryId])

  if (data === undefined) return <SkeletonList count={3} label="Chargement…" />
  if (data === null) {
    return (
      <EmptyState
        title={
          entryId === undefined ? 'Exercice introuvable' : 'Séance introuvable'
        }
        action={
          <Link to="/" className={buttonSecondary}>
            Mes exercices
          </Link>
        }
      />
    )
  }
  return (
    <SessionForm
      key={`${data.exercise.id}-${entryId ?? 'new'}`}
      exercise={data.exercise}
      history={data.history}
      editing={data.editing}
    />
  )
}

interface SessionFormProps {
  exercise: UserExercise
  history: WorkoutEntry[]
  editing?: WorkoutEntry
}

function SessionForm({ exercise, history, editing }: SessionFormProps) {
  const navigate = useNavigate()
  const today = toISODate(new Date())
  // Pré-remplissage figé à l'ouverture, même si l'historique change ensuite.
  const [previous] = useState(() => (editing ? undefined : lastEntry(history)))
  const [date, setDate] = useState(editing?.date ?? today)
  const [drafts, setDrafts] = useState(() => {
    const source = editing ?? previous
    return (source?.sets.length ? source.sets : [DEFAULT_SET]).map((s) =>
      withKey(toDraft(s)),
    )
  })
  const [note, setNote] = useState(editing?.note ?? '')
  const progressPath = `/suivi/${exercise.id}`
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [celebration, setCelebration] = useState<{
    records: NewRecords
    summary: PerformanceSummary
  }>()

  const sets = drafts.map(parseSet)
  const valid = date !== '' && sets.every((s) => s !== null)

  const update = (key: number, patch: Partial<SetDraft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  const save = async () => {
    const validSets = sets.filter((s) => s !== null)
    if (!valid) return
    setSaving(true)
    setError(false)
    try {
      if (editing) {
        await db.workouts.put({
          ...editing,
          date,
          sets: validSets,
          note: note.trim() || undefined,
        })
        void navigate(progressPath)
        return
      }
      const records = detectNewRecords(history, validSets)
      const entry = { userExerciseId: exercise.id, date, sets: validSets }
      const id = await db.workouts.add({
        ...entry,
        note: note.trim() || undefined,
      })
      if (records.maxWeight || records.oneRM) {
        setCelebration({ records, summary: summarize([{ ...entry, id }]) })
      } else {
        void navigate('/')
      }
    } catch {
      // La saisie reste à l'écran : rien n'est perdu, on peut réessayer.
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  if (celebration) return <RecordCelebration {...celebration} />

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      noValidate
    >
      <PageHeader
        title={exercise.name}
        back={
          editing
            ? { label: 'Progression', to: progressPath }
            : { label: 'Mes exos', to: '/' }
        }
      >
        {editing && (
          <p className="mt-3">
            Tu corriges la séance du {formatLongDate(editing.date)}.
          </p>
        )}
      </PageHeader>

      {previous && (
        <div>
          <p className="text-label text-steel">
            Dernière fois, {formatRelativeDay(previous.date)}
          </p>
          <p className="mt-0.5 font-bold">
            {previous.sets.map(formatSet).join(' · ')}
          </p>
        </div>
      )}

      <label className="mt-6 flex min-h-14 items-center justify-between gap-3 border-y border-rule">
        <span className="text-steel">Date</span>
        <input
          type="date"
          value={date}
          max={today}
          required
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-right font-bold"
        />
      </label>

      <ol className="divide-y divide-rule border-b border-rule">
        {drafts.map((draft, i) => {
          const n = i + 1
          return (
            <li
              key={draft.key}
              className="grid grid-cols-[2.25rem_1fr] gap-x-2 py-4"
            >
              <span
                aria-hidden
                className="pt-5 display text-title leading-none text-steel italic"
              >
                {n}
              </span>
              <div>
                <h2 className="sr-only">Série {n}</h2>
                <div className="grid grid-cols-[3fr_2fr] gap-3">
                  <Stepper
                    label={`Poids, série ${n}`}
                    unit="kg"
                    stepText="2,5"
                    inputMode="decimal"
                    value={draft.weight}
                    invalid={parseWeight(draft.weight) === null}
                    onChange={(weight) => update(draft.key, { weight })}
                    onStep={(dir) =>
                      update(draft.key, {
                        weight: stepWeight(draft.weight, dir * WEIGHT_STEP),
                      })
                    }
                  />
                  <Stepper
                    label={`Répétitions, série ${n}`}
                    unit="reps"
                    stepText="1"
                    inputMode="numeric"
                    value={draft.reps}
                    invalid={parseReps(draft.reps) === null}
                    onChange={(reps) => update(draft.key, { reps })}
                    onStep={(dir) =>
                      update(draft.key, { reps: stepReps(draft.reps, dir) })
                    }
                  />
                </div>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Supprimer la série ${n}`}
                    onClick={() =>
                      setDrafts((ds) => ds.filter((d) => d.key !== draft.key))
                    }
                    className="mt-1 min-h-11 text-label text-steel underline underline-offset-4 hover:text-signal"
                  >
                    Retirer cette série
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={() =>
          setDrafts((ds) => [...ds, withKey(ds.at(-1) ?? toDraft(DEFAULT_SET))])
        }
        className={`${linkAction} mt-3`}
      >
        + Ajouter une série
      </button>

      <label className="mt-10 block">
        <span className="text-label text-steel">Note, si besoin</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Réglage du siège, sensations, douleur…"
          className="mt-1 w-full border-b-2 border-night bg-chalk p-3 placeholder:text-steel"
        />
      </label>

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] -mx-4 mt-8 bg-white px-4 py-3">
        {error && (
          <p role="alert" className="mb-2 font-bold text-signal">
            L’enregistrement a échoué. Ta saisie est toujours là, réessaie.
          </p>
        )}
        {!valid && (
          <p className="mb-2 text-label text-signal">
            Une valeur soulignée en rouge est à corriger.
          </p>
        )}
        <button
          type="submit"
          disabled={!valid || saving}
          className={`${buttonPrimary} w-full`}
        >
          Enregistrer
        </button>
      </div>
    </form>
  )
}

function RecordCelebration({
  records,
  summary,
}: {
  records: NewRecords
  summary: PerformanceSummary
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])

  return (
    <section className="-mx-4 -mt-6 -mb-[calc(5.5rem+env(safe-area-inset-bottom))] min-h-dvh bg-night px-4 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-16 text-white [&_*:focus-visible]:outline-white">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="display text-display outline-none"
      >
        Nouveau record !
      </h1>
      <dl className="mt-12 space-y-8">
        {records.maxWeight && summary.maxWeight && (
          <div className="motion-safe:animate-slam">
            <dt className="text-label">Charge max</dt>
            <dd>
              <Score set={summary.maxWeight.set} size="giant" />
            </dd>
          </div>
        )}
        {records.oneRM && summary.best1RM && (
          <div>
            <dt className="text-label">1RM estimé</dt>
            <dd className="display text-score italic">
              {formatKg(summary.best1RM.value)}
            </dd>
          </div>
        )}
      </dl>
      <Link to="/" className={`${buttonPrimary} mt-14`}>
        Mes exercices
      </Link>
    </section>
  )
}
