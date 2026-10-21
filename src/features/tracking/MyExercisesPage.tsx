import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, SkeletonList } from '../../components/states'
import { buttonPrimary, linkAction } from '../../components/ui'
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

      <div>
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
            Ajoute un exercice : à chaque retour à la salle, Barre t’affiche ce
            que tu as soulevé la dernière fois.
          </EmptyState>
        )}
        <ul className="-mt-2 divide-y divide-rule border-rule [&:not(:empty)]:border-b">
          {items?.map(({ exercise, summary }, i) => (
            <li key={exercise.id}>
              <ExerciseSummaryCard
                exercise={exercise}
                summary={summary}
                featured={i === 0 && summary.last !== undefined}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
