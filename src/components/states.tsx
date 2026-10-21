import type { ReactNode } from 'react'
import { PlateIcon } from './icons'

interface EmptyStateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
  /** Annonce le message aux lecteurs d'écran (erreurs). */
  alert?: boolean
}

export function EmptyState({
  title,
  children,
  action,
  alert,
}: EmptyStateProps) {
  return (
    <div
      role={alert ? 'alert' : undefined}
      className="flex flex-col items-center gap-3 px-6 py-16 text-center"
    >
      <PlateIcon
        className={`size-12 ${alert ? 'text-red-600' : 'text-line'}`}
      />
      <h2 className="text-xl font-bold">{title}</h2>
      {children && <p className="max-w-xs text-muted">{children}</p>}
      {action}
    </div>
  )
}

export function SkeletonList({
  count = 6,
  label,
}: {
  count?: number
  label: string
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <ul aria-hidden className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <li
            key={i}
            className="h-26 rounded-xl bg-card motion-safe:animate-pulse"
          />
        ))}
      </ul>
    </>
  )
}
