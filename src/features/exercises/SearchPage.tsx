import { type SubmitEvent, useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { SearchIcon } from '../../components/icons'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonSecondary } from '../../components/ui'
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../../lib/labels'
import { createSearcher } from '../../lib/search'
import type { Exercise } from '../../types'
import { ExerciseCard } from './ExerciseCard'

const PAGE_SIZE = 30

const byLabel = (labels: Record<string, string>) =>
  Object.entries(labels).sort(([, a], [, b]) => a.localeCompare(b, 'fr'))

const fieldClass =
  'w-full border-b-2 border-night bg-chalk text-night placeholder:text-steel'

export function SearchPage() {
  const { state, retry } = useExerciseCatalog()
  // Les critères vivent dans l'URL : le retour arrière depuis une fiche les conserve.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const muscle = params.get('muscle') ?? ''
  const equipment = params.get('materiel') ?? ''
  const deferredQuery = useDeferredValue(query)

  const search = useMemo(
    () => (state.status === 'ready' ? createSearcher(state.exercises) : null),
    [state],
  )
  const results = useMemo(
    () => search?.(deferredQuery, { muscle, equipment }) ?? [],
    [search, deferredQuery, muscle, equipment],
  )

  const update = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  // Valider ferme le clavier mobile.
  const onSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <>
      <PageHeader title="Chercher un exercice" />

      <form role="search" onSubmit={onSubmit}>
        <label className="relative block">
          <span className="sr-only">Nom de l’exercice</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-6 -translate-y-1/2 text-night" />
          <input
            type="search"
            value={query}
            onChange={(e) => update('q', e.target.value)}
            placeholder="Développé couché, squat…"
            enterKeyHint="search"
            autoComplete="off"
            className={`${fieldClass} min-h-16 pr-4 pl-12 text-lead`}
          />
        </label>
        <div className="mt-5 grid grid-cols-2 gap-x-3">
          <label>
            <span className="text-label text-steel">Muscle</span>
            <select
              value={muscle}
              onChange={(e) => update('muscle', e.target.value)}
              className={`${fieldClass} mt-1 min-h-12 px-2`}
            >
              <option value="">Tous les muscles</option>
              {byLabel(MUSCLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-label text-steel">Matériel</span>
            <select
              value={equipment}
              onChange={(e) => update('materiel', e.target.value)}
              className={`${fieldClass} mt-1 min-h-12 px-2`}
            >
              <option value="">Tout le matériel</option>
              {byLabel(EQUIPMENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <section aria-label="Résultats" className="mt-12">
        {state.status === 'loading' && (
          <SkeletonList label="Chargement du catalogue d’exercices…" />
        )}
        {state.status === 'error' && (
          <EmptyState
            alert
            title="Catalogue indisponible"
            action={
              <button type="button" onClick={retry} className={buttonSecondary}>
                Réessayer
              </button>
            }
          >
            Le téléchargement des exercices a échoué. Vérifie ta connexion.
          </EmptyState>
        )}
        {state.status === 'ready' && (
          <>
            <p aria-live="polite" className="mb-2 flex items-baseline gap-2">
              <span className="display text-title italic">
                {results.length}
              </span>
              <span className="text-steel">
                exercice{results.length > 1 ? 's' : ''}
              </span>
            </p>
            {results.length === 0 ? (
              <EmptyState title="Rien sous ce nom.">
                Essaie le terme anglais (« bench », « row ») ou retire un
                filtre.
              </EmptyState>
            ) : (
              <ResultList
                key={`${deferredQuery}|${muscle}|${equipment}`}
                results={results}
              />
            )}
          </>
        )}
      </section>
    </>
  )
}

function ResultList({ results }: { results: Exercise[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  return (
    <>
      <ul className="divide-y divide-rule border-y border-rule">
        {results.slice(0, limit).map((exercise) => (
          <li key={exercise.id}>
            <ExerciseCard exercise={exercise} />
          </li>
        ))}
      </ul>
      {results.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE_SIZE)}
          className={`${buttonSecondary} mt-6`}
        >
          Voir plus
        </button>
      )}
    </>
  )
}
