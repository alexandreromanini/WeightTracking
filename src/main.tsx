import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Link, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { EmptyState } from './components/states'
import { buttonSecondary } from './components/ui'
import { ExerciseDetailPage } from './features/exercises/ExerciseDetailPage'
import { SearchPage } from './features/exercises/SearchPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { LogWorkoutPage } from './features/tracking/LogWorkoutPage'
import { MyExercisesPage } from './features/tracking/MyExercisesPage'
import './index.css'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <MyExercisesPage /> },
      { path: 'recherche', element: <SearchPage /> },
      { path: 'exercice/:id', element: <ExerciseDetailPage /> },
      {
        path: 'suivi/:id',
        // Chargé à la demande : Recharts pèse plus que tout le reste de l'app.
        lazy: () =>
          import('./features/tracking/ProgressPage').then((m) => ({
            Component: m.ProgressPage,
          })),
      },
      { path: 'suivi/:id/seance', element: <LogWorkoutPage /> },
      { path: 'suivi/:id/seance/:entryId', element: <LogWorkoutPage /> },
      { path: 'reglages', element: <SettingsPage /> },
      {
        path: '*',
        element: (
          <EmptyState
            title="Page introuvable"
            action={
              <Link to="/" className={buttonSecondary}>
                Retour à l’accueil
              </Link>
            }
          />
        ),
      },
    ],
  },
])

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root manquant')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
