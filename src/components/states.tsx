import type { ReactNode } from 'react'

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
    <div role={alert ? 'alert' : undefined} className="py-10">
      <h2 className={`display text-title ${alert ? 'text-signal' : ''}`}>
        {title}
      </h2>
      {children && <p className="mt-3 max-w-sm text-steel">{children}</p>}
      {action && <div className="mt-8">{action}</div>}
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
      <ul aria-hidden className="divide-y divide-rule">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="py-4">
            <div className="h-4 w-1/2 bg-chalk motion-safe:animate-pulse" />
            <div className="mt-3 h-12 w-2/3 bg-chalk motion-safe:animate-pulse" />
          </li>
        ))}
      </ul>
    </>
  )
}
