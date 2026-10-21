import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { ExerciseImage } from '../../components/ExerciseImage'
import { CheckIcon } from '../../components/icons'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, buttonSecondary } from '../../components/ui'
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

  const back = { label: 'Retour', onClick: () => void goBack() }

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader title="Exercice" back={back} />
        <SkeletonList count={3} label="Chargement de l’exercice…" />
      </>
    )
  }
  if (state.status === 'error') {
    return (
      <>
        <PageHeader title="Exercice" back={back} />
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
        <PageHeader title="Exercice" back={back} />
        <EmptyState title="Exercice introuvable">
          Cet exercice n’existe pas ou plus dans le catalogue.
        </EmptyState>
      </>
    )
  }

  const images = exercise.images.length
    ? exercise.images.slice(0, 2)
    : [undefined]

  return (
    <article>
      <PageHeader title={exercise.name} back={back} />

      {/* Photos à fond perdu, séparées d'un filet blanc. */}
      <div className="-mx-4 -mt-8 grid grid-cols-2 gap-px">
        {images.map((src, i) => (
          <figure key={i} className={images.length < 2 ? 'col-span-2' : ''}>
            <ExerciseImage
              src={src}
              name={exercise.name}
              alt={`${exercise.name}, ${POSITIONS[i] ?? ''}`}
              className="aspect-4/5 w-full"
            />
            {images.length > 1 && (
              <figcaption className="px-4 pt-1 text-label text-steel">
                {i === 0 ? 'Départ' : 'Arrivée'}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <dl className="mt-10 grid grid-cols-[6.5rem_1fr] border-t border-rule">
        <dt className="border-b border-rule py-3 text-label text-steel">
          Muscles
        </dt>
        <dd className="border-b border-rule py-3">
          <span className="font-bold">
            {exercise.primaryMuscles.map(muscleLabel).join(', ')}
          </span>
          {exercise.secondaryMuscles.length > 0 && (
            <span className="text-steel">
              {', '}
              {exercise.secondaryMuscles.map(muscleLabel).join(', ')}
            </span>
          )}
        </dd>
        <dt className="border-b border-rule py-3 text-label text-steel">
          Matériel
        </dt>
        <dd className="border-b border-rule py-3">
          {equipmentLabel(exercise.equipment)}
        </dd>
      </dl>

      {exercise.instructions.length > 0 && (
        <section className="mt-14">
          <h2 className="display text-lead">Exécution</h2>
          <p className="mt-1 text-label text-steel" lang="fr">
            En anglais, telles que fournies par la base d’exercices.
          </p>
          <ol className="mt-6 space-y-5" lang="en">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_1fr]">
                <span className="display text-title leading-none text-electric italic">
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
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -mx-4 mt-12 bg-white px-4 py-3">
      {owned ? (
        <Link to="/" className={`${buttonSecondary} w-full`}>
          <CheckIcon className="size-6 text-electric" /> Dans mes exercices
        </Link>
      ) : (
        <button
          type="button"
          disabled={adding}
          onClick={() => void add()}
          className={`${buttonPrimary} w-full`}
        >
          Ajouter à mes exercices
        </button>
      )}
    </div>
  )
}
