import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { Stepper } from '../../components/Stepper'
import { CloseIcon, PlateIcon, PlusIcon } from '../../components/icons'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, buttonSecondary } from '../../components/ui'
import { db } from '../../db/db'
import {
  formatKg,
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
        eyebrow={editing ? 'Modifier la séance' : 'Séance'}
        title={exercise.name}
        back={
          editing
            ? { label: 'Progression', to: progressPath }
            : { label: 'Mes exos', to: '/' }
        }
      />

      {previous && (
        <p className="text-sm text-muted">
          Dernière fois, {formatRelativeDay(previous.date)} :{' '}
          <span className="font-semibold text-ink">
            {previous.sets.map(formatSet).join(' · ')}
          </span>
        </p>
      )}

      <label className="mt-5 flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-card px-4">
        <span className="text-muted">Date</span>
        <input
          type="date"
          value={date}
          max={today}
          required
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-right font-semibold"
        />
      </label>

      <ol className="mt-4 space-y-3">
        {drafts.map((draft, i) => {
          const n = i + 1
          return (
            <li
              key={draft.key}
              className="rounded-xl border border-line bg-card p-3"
            >
              <div className="flex min-h-10 items-center justify-between">
                <h2 className="text-lg font-bold text-muted">Série {n}</h2>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Supprimer la série ${n}`}
                    onClick={() =>
                      setDrafts((ds) => ds.filter((d) => d.key !== draft.key))
                    }
                    className="grid size-10 place-items-center rounded-full text-muted hover:text-ink active:bg-line"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                )}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-3">
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
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={() =>
          setDrafts((ds) => [...ds, withKey(ds.at(-1) ?? toDraft(DEFAULT_SET))])
        }
        className={`${buttonSecondary} mt-3 w-full`}
      >
        <PlusIcon className="size-5" /> Ajouter une série
      </button>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-muted">
          Note (facultatif)
        </span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sensations, réglages machine…"
          className="mt-1 w-full rounded-xl border border-line bg-card p-3 placeholder:text-muted/70"
        />
      </label>

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-6 space-y-2">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200"
          >
            L’enregistrement a échoué. Ta saisie est conservée, réessaie.
          </p>
        )}
        {!valid && (
          <p className="rounded-xl bg-page/90 p-2 text-center text-sm text-muted">
            Corrige les valeurs encadrées en rouge.
          </p>
        )}
        <button
          type="submit"
          disabled={!valid || saving}
          className={`${buttonPrimary} w-full shadow-lg`}
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
    <section className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 text-center">
      <PlateIcon className="size-28 text-brand motion-safe:animate-plate-in" />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-4xl font-extrabold outline-none"
      >
        Nouveau record !
      </h1>
      <ul className="flex flex-col items-center gap-3">
        {records.maxWeight && summary.maxWeight && (
          <li className="rounded-full bg-brand px-5 py-2 text-xl font-bold text-white motion-safe:animate-pop motion-safe:[animation-delay:300ms]">
            Charge max · {formatSet(summary.maxWeight.set)}
          </li>
        )}
        {records.oneRM && summary.best1RM && (
          <li className="rounded-full bg-amber-100 px-5 py-2 text-xl font-bold text-amber-900 motion-safe:animate-pop motion-safe:[animation-delay:500ms]">
            1RM estimé · {formatKg(summary.best1RM.value)}
          </li>
        )}
      </ul>
      <Link to="/" className={`${buttonPrimary} mt-4`}>
        Retour à mes exercices
      </Link>
    </section>
  )
}
