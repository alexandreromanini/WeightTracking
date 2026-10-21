interface Props {
  /** Nom accessible du champ, ex. « Poids, série 1 ». */
  label: string
  unit: string
  /** Pas affiché sur les boutons, ex. « 2,5 ». */
  stepText: string
  value: string
  invalid: boolean
  inputMode: 'decimal' | 'numeric'
  onChange: (value: string) => void
  onStep: (direction: 1 | -1) => void
}

const stepButton =
  'min-h-14 text-lg font-bold text-muted transition-colors active:bg-line active:text-ink'

/** Champ numérique encadré de gros boutons −/+, utilisable au pouce. */
export function Stepper({
  label,
  unit,
  stepText,
  value,
  invalid,
  inputMode,
  onChange,
  onStep,
}: Props) {
  const shownStep = stepText === '1' ? '' : stepText
  return (
    <div>
      <span aria-hidden className="text-xs font-semibold text-muted">
        {unit}
      </span>
      <div
        className={`mt-1 grid grid-cols-[3rem_1fr_3rem] overflow-hidden rounded-xl border bg-page ${
          invalid ? 'border-red-600' : 'border-line'
        }`}
      >
        <button
          type="button"
          aria-label={`${label}, moins ${stepText} ${unit}`}
          onClick={() => onStep(-1)}
          className={stepButton}
        >
          −{shownStep}
        </button>
        <input
          aria-label={label}
          aria-invalid={invalid}
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-full min-w-0 bg-transparent text-center text-2xl font-bold tabular-nums"
        />
        <button
          type="button"
          aria-label={`${label}, plus ${stepText} ${unit}`}
          onClick={() => onStep(1)}
          className={stepButton}
        >
          +{shownStep}
        </button>
      </div>
    </div>
  )
}
