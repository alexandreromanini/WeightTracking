/** Classes partagées par les boutons et les liens-boutons. */
export const buttonPrimary =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[.98] disabled:opacity-50'

export const buttonSecondary =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-line bg-page px-6 text-lg font-bold text-ink transition hover:border-brand hover:text-brand active:scale-[.98]'

export const buttonSmall =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-page px-4 text-sm font-semibold text-ink transition hover:border-brand active:bg-card'

/** Variante destructive de buttonSmall (suppression, effacement). */
export const buttonDanger =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700'
