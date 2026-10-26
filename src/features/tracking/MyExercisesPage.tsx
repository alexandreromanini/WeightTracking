import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, linkAction } from '../../components/ui'
import { db } from '../../db/db'
import { buildDemoBackup } from '../../db/seed'
import { restoreBackup } from '../../lib/backup'
import { groupByMuscle } from '../../lib/muscleGroups'
import { summarize } from '../../lib/performance'
import type { WorkoutEntry } from '../../types'
import { ExerciseSummaryCard } from './ExerciseSummaryCard'

// Limite : charge tout l'historique, suffisant pour quelques milliers de séances
async function loadSummaries() {
  const [exercises, workouts] = await Promise.all([
    db.userExercises.toArray(),
    db.workouts.toArray(),
  ])
  // Muscle copié à l'ajout ; sinon (exercices plus anciens, imports), le catalogue en cache.
  const catalog = await db.exercises.bulkGet(exercises.map((e) => e.exerciseId))
  const byExercise = new Map<number, WorkoutEntry[]>()
  for (const w of workouts) {
    byExercise.set(w.userExerciseId, [
      ...(byExercise.get(w.userExerciseId) ?? []),
      w,
    ])
  }
  return (
    exercises
      .map((exercise, i) => {
        const summary = summarize(byExercise.get(exercise.id) ?? [])
        return {
          exercise,
          summary,
          muscle: exercise.muscle ?? catalog[i]?.primaryMuscles[0],
          lastActivity: summary.last?.date ?? exercise.addedAt.slice(0, 10),
        }
      })
      // Dans chaque section, les exercices travaillés (ou ajoutés) récemment en premier.
      .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
  )
}

export function MyExercisesPage() {
  const items = useLiveQuery(loadSummaries)
  // Le groupe choisi vit dans l'URL : il survit au retour depuis une séance.
  const [params, setParams] = useSearchParams()
  const sections = items ? groupByMuscle(items, (i) => i.muscle) : []
  const wanted = params.get('groupe') ?? ''
  const active = sections.some((s) => s.group.key === wanted) ? wanted : ''
  const visible = active
    ? sections.filter((s) => s.group.key === active)
    : sections

  const select = (key: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (key) next.set('groupe', key)
        else next.delete('groupe')
        return next
      },
      { replace: true },
    )

  return (
    <>
      <PageHeader
        logo
        title="Mes exercices"
        action={
          items &&
          items.length > 0 && (
            <Link
              to="/recherche"
              className="inline-flex min-h-11 items-center bg-electric px-3 display text-label text-white active:bg-white active:text-night"
            >
              + Ajouter
            </Link>
          )
        }
      />

      {items === undefined && <SkeletonList count={3} label="Chargement…" />}
      {items?.length === 0 && (
        <EmptyState
          title="Rien à soulever."
          action={
            <div className="flex flex-col items-start gap-4">
              <Link to="/recherche" className={buttonPrimary}>
                Trouver un exercice
              </Link>
              <button
                type="button"
                onClick={() => void restoreBackup(buildDemoBackup())}
                className={linkAction}
              >
                Ou essayer avec 10 semaines fictives
              </button>
            </div>
          }
        >
          Ajoute un exercice : à chaque retour à la salle, WeightTracking
          t’affiche ce que tu as soulevé la dernière fois.
        </EmptyState>
      )}

      {sections.length > 1 && (
        // Reste visible en haut pendant le défilement : on change de groupe d'un pouce.
        <nav
          aria-label="Groupes musculaires"
          className="sticky top-0 z-20 -mx-4 -mt-4 [scrollbar-width:none] overflow-x-auto border-b border-rule bg-white px-4 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex gap-5 whitespace-nowrap">
            {[
              { key: '', label: 'Tout', count: items?.length ?? 0 },
              ...sections.map((s) => ({
                key: s.group.key,
                label: s.group.label,
                count: s.items.length,
              })),
            ].map(({ key, label, count }) => (
              <li key={key || 'tout'}>
                <button
                  type="button"
                  aria-pressed={active === key}
                  onClick={() => select(key)}
                  className={`-mb-px inline-flex min-h-12 items-center gap-1.5 border-b-4 display text-label ${
                    active === key
                      ? 'border-electric text-electric'
                      : 'border-transparent text-steel hover:text-night'
                  }`}
                >
                  {label}
                  <span className="font-sans font-normal">{count}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {visible.map(({ group, items: sectionItems }, si) => (
        <section
          key={group.key}
          aria-labelledby={`groupe-${group.key}`}
          className="mt-8"
        >
          <h2
            id={`groupe-${group.key}`}
            className="flex items-baseline gap-2 display text-lead"
          >
            {group.label}
            <span className="font-sans text-label font-normal text-steel">
              {sectionItems.length}
            </span>
          </h2>
          <ul className="mt-1 divide-y divide-rule border-b border-rule">
            {sectionItems.map(({ exercise, summary }, i) => (
              <li key={exercise.id}>
                <ExerciseSummaryCard
                  exercise={exercise}
                  summary={summary}
                  featured={si === 0 && i === 0 && summary.last !== undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
