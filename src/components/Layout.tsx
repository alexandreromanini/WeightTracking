import { NavLink, Outlet, ScrollRestoration } from 'react-router'
import { useOnline } from '../hooks/useOnline'
import { UpdatePrompt } from './UpdatePrompt'

const tabs = [
  { to: '/', label: 'Mes exos' },
  { to: '/recherche', label: 'Chercher' },
  { to: '/reglages', label: 'Réglages' },
]

export function Layout() {
  const online = useOnline()
  return (
    <>
      {!online && (
        <p
          role="status"
          className="bg-night px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-label text-white"
        >
          Hors ligne. Tes séances s’enregistrent quand même sur ce téléphone.
        </p>
      )}
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-2xl">
          {tabs.map(({ to, label }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-14 items-center justify-center border-t-4 display text-label ${
                    isActive
                      ? 'border-electric text-electric'
                      : 'border-transparent text-steel hover:text-night'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <UpdatePrompt />
      <ScrollRestoration />
    </>
  )
}
