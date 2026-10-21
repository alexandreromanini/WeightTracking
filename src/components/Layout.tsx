import { NavLink, Outlet, ScrollRestoration } from 'react-router'
import { PlateIcon, SearchIcon, SlidersIcon } from './icons'

const tabs = [
  { to: '/', label: 'Mes exos', Icon: PlateIcon },
  { to: '/recherche', label: 'Rechercher', Icon: SearchIcon },
  { to: '/reglages', label: 'Réglages', Icon: SlidersIcon },
]

export function Layout() {
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 border-t border-steel bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-2xl">
          {tabs.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold tracking-wide uppercase ${
                    isActive ? 'text-plate-red' : 'text-dust hover:text-chalk'
                  }`
                }
              >
                <Icon className="size-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <ScrollRestoration />
    </>
  )
}
