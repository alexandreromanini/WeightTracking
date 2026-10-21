import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BackIcon } from './icons'

type Back =
  { label: string; to: string } | { label: string; onClick: () => void }

interface Props {
  title: string
  eyebrow?: string
  back?: Back
  action?: ReactNode
  children?: ReactNode
}

const backClass =
  '-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 pr-3 text-sm font-semibold text-white/85 hover:text-white'

/** Bandeau bleu en tête de page, commun à tous les écrans. */
export function PageHeader({ title, eyebrow, back, action, children }: Props) {
  return (
    <header className="-mx-4 -mt-6 mb-6 bg-brand px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-6 text-white sm:rounded-b-2xl [&_*:focus-visible]:outline-white">
      {back &&
        ('to' in back ? (
          <Link to={back.to} className={backClass}>
            <BackIcon className="size-5" /> {back.label}
          </Link>
        ) : (
          <button type="button" onClick={back.onClick} className={backClass}>
            <BackIcon className="size-5" /> {back.label}
          </button>
        ))}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-sm font-semibold text-white/85">{eyebrow}</p>
          )}
          <h1 className="text-3xl leading-tight font-extrabold">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </header>
  )
}
