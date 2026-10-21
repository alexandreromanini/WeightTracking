import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BackIcon } from './icons'

type Back =
  { label: string; to: string } | { label: string; onClick: () => void }

interface Props {
  title: string
  back?: Back
  /** Affiche le logotype à gauche (accueil). */
  logo?: boolean
  action?: ReactNode
  children?: ReactNode
}

const backClass =
  '-ml-1 inline-flex min-h-11 items-center gap-1 pr-3 font-bold text-white hover:underline'

/** En-tête bleu nuit coupé en biais : la signature du site (voir DESIGN.md). */
export function PageHeader({ title, back, logo, action, children }: Props) {
  // Les noms d'exercices sont longs : un cran plus petit pour rester sur 2–3 lignes.
  const size = title.length > 18 ? 'text-title' : 'text-display'
  return (
    <header className="-mx-4 -mt-6 mb-8 bg-night px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-14 text-white cut-bottom [&_*:focus-visible]:outline-white">
      {(back ?? logo ?? action) && (
        <div className="flex min-h-11 items-center justify-between gap-4">
          {back &&
            ('to' in back ? (
              <Link to={back.to} className={backClass}>
                <BackIcon className="size-5" /> {back.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={back.onClick}
                className={backClass}
              >
                <BackIcon className="size-5" /> {back.label}
              </button>
            ))}
          {logo && (
            <span className="display text-lead text-white italic">Barre</span>
          )}
          {action}
        </div>
      )}
      <h1 className={`mt-4 max-w-[14ch] display ${size}`}>{title}</h1>
      {children}
    </header>
  )
}
