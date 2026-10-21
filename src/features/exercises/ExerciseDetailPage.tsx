import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ExerciseImage } from '../../components/ExerciseImage'
import { BackIcon, CheckIcon } from '../../components/icons'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, buttonSecondary, pageTitle } from '../../components/ui'
import { db } from '../../db/db'
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog'
import { equipmentLabel, muscleLabel } from '../../lib/labels'
import type { Exercise } from '../../types'

const POSITIONS = ['position de départ', 'position finale']

export function ExerciseDetailPage() {
  const { id = '' } = useParams()
  const { state, retry } = useExerciseCatalog()
  const navigate = useNavigate()
  const location = useLocation()

  // Retour à la recherche (avec ses filtres) si on vient de l'app, sinon vers la recherche.
  const goBack = () =>
    location.key === 'default' ? navigate('/recherche') : navigate(-1)

  const back = (
    <button
      type="button"
      onClick={() => void goBack()}
      className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 font-semibold text-dust hover:text-chalk"
    >
      <BackIcon className="size-5" /> Retour
    </button>
  )

  if (state.status === 'loading') {
    return (
      <>
        {back}
        <SkeletonList count={3} label="Chargement de l’exercice…" />
      </>
    )
  }
  if (state.status === 'error') {
    return (
      <>
        {back}
        <EmptyState
          alert
          title="Catalogue indisponible"
          action={
            <button type="button" onClick={retry} className={buttonSecondary}>
              Réessayer
            </button>
          }
        />
      </>
    )
  }

  const exercise = state.exercises.find((e) => e.id === id)
  if (!exercise) {
    return (
      <>
        {back}
        <EmptyState title="Exercice introuvable">
          Cet exercice n’existe pas ou plus dans le catalogue.
        </EmptyState>
      </>
    )
  }

  return (
    <article>
      {back}
      <h1 className={`${pageTitle} mt-2`}>{exercise.name}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {(exercise.images.length
          ? exercise.images.slice(0, 2)
          : [undefined]
        ).map((src, i) => (
          <figure
            key={i}
            className={exercise.images.length < 2 ? 'col-span-2' : ''}
          >
            <ExerciseImage
              src={src}
              name={exercise.name}
              alt={`${exercise.name}, ${POSITIONS[i] ?? ''}`}
              className="aspect-4/3 w-full rounded-xl"
            />
            {exercise.images.length > 1 && (
              <figcaption className="mt-1 text-xs tracking-wide text-dust uppercase">
                {i === 0 ? 'Départ' : 'Arrivée'}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-dust uppercase">
            Muscles ciblés
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {exercise.primaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-full bg-plate-red/15 px-3 py-1 text-sm font-semibold ring-1 ring-plate-red/60"
              >
                {muscleLabel(m)}
              </span>
            ))}
            {exercise.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-full bg-steel px-3 py-1 text-sm text-dust"
              >
                {muscleLabel(m)}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-dust uppercase">
            Matériel
          </dt>
          <dd className="mt-1">{equipmentLabel(exercise.equipment)}</dd>
        </div>
      </dl>

      {exercise.instructions.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold uppercase">
            Exécution
          </h2>
          <p className="mt-1 text-sm text-dust" lang="fr">
            Instructions en anglais, issues de la base d’exercices.
          </p>
          <ol className="mt-4 space-y-3" lang="en">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-display text-xl font-bold text-plate-red tabular-nums">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <AddBar exercise={exercise} />
    </article>
  )
}

function AddBar({ exercise }: { exercise: Exercise }) {
  // null = absent de mes exercices, undefined = requête en cours.
  const owned = useLiveQuery(
    () =>
      db.userExercises
        .where('exerciseId')
        .equals(exercise.id)
        .first()
        .then((u) => u ?? null),
    [exercise.id],
  )
  const [adding, setAdding] = useState(false)

  const add = async () => {
    setAdding(true)
    try {
      await db.userExercises.add({
        exerciseId: exercise.id,
        name: exercise.name,
        image: exercise.images[0],
        addedAt: new Date().toISOString(),
      })
    } finally {
      setAdding(false)
    }
  }

  if (owned === undefined) return null

  return (
    <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-8">
      {owned ? (
        <Link to="/" className={`${buttonSecondary} w-full`}>
          <CheckIcon className="size-6 text-plate-green" /> Dans mes exercices
        </Link>
      ) : (
        <button
          type="button"
          disabled={adding}
          onClick={() => void add()}
          className={`${buttonPrimary} w-full shadow-lg shadow-ink`}
        >
          Ajouter à mes exercices
        </button>
      )}
    </div>
  )
}
