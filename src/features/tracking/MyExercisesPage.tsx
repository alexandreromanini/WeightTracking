import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { PlusIcon } from '../../components/icons'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, buttonSmall } from '../../components/ui'
import { db } from '../../db/db'
import { buildDemoBackup } from '../../db/seed'
import { restoreBackup } from '../../lib/backup'
import { summarize } from '../../lib/performance'
import type { WorkoutEntry } from '../../types'
import { ExerciseSummaryCard } from './ExerciseSummaryCard'

// Limite : charge tout l'historique, suffisant pour quelques milliers de séances
async function loadSummaries() {
  const [exercises, workouts] = await Promise.all([
    db.userExercises.toArray(),
    db.workouts.toArray(),
  ])
  const byExercise = new Map<number, WorkoutEntry[]>()
  for (const w of workouts) {
    byExercise.set(w.userExerciseId, [
      ...(byExercise.get(w.userExerciseId) ?? []),
      w,
    ])
  }
  return (
    exercises
      .map((exercise) => {
        const summary = summarize(byExercise.get(exercise.id) ?? [])
        return {
          exercise,
          summary,
          lastActivity: summary.last?.date ?? exercise.addedAt.slice(0, 10),
        }
      })
      // Les exercices travaillés (ou ajoutés) récemment en premier.
      .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
  )
}

export function MyExercisesPage() {
  const items = useLiveQuery(loadSummaries)

  return (
    <>
      <PageHeader
        eyebrow="Barre"
        title="Mes exercices"
        action={
          items &&
          items.length > 0 && (
            <Link
              to="/recherche"
              aria-label="Ajouter un exercice"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-brand shadow-sm active:scale-95"
            >
              <PlusIcon className="size-6" />
            </Link>
          )
        }
      />

      <div>
        {items === undefined && <SkeletonList count={3} label="Chargement…" />}
        {items?.length === 0 && (
          <EmptyState
            title="Rien à soulever"
            action={
              <div className="flex flex-col items-center gap-3">
                <Link to="/recherche" className={buttonPrimary}>
                  Trouver un exercice
                </Link>
                <button
                  type="button"
                  onClick={() => void restoreBackup(buildDemoBackup())}
                  className={buttonSmall}
                >
                  Essayer avec des données de démo
                </button>
              </div>
            }
          >
            Ajoute tes exercices pour retrouver ta dernière charge en un coup
            d’œil.
          </EmptyState>
        )}
        <ul className="space-y-3">
          {items?.map(({ exercise, summary }) => (
            <li key={exercise.id}>
              <ExerciseSummaryCard exercise={exercise} summary={summary} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
