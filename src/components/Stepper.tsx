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
  'min-h-14 font-bold text-night active:bg-rule disabled:text-steel'

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
  // Les boutons du poids portent « 2,5 » : ils ont besoin de plus de place.
  const cols = shownStep
    ? 'grid-cols-[3rem_1fr_3rem]'
    : 'grid-cols-[2.5rem_1fr_2.5rem]'
  return (
    <div>
      <span aria-hidden className="text-label text-steel">
        {unit}
      </span>
      <div
        className={`mt-1 grid ${cols} border-b-2 bg-chalk ${
          invalid ? 'border-signal' : 'border-night'
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
          className="w-full min-w-0 bg-transparent text-center display text-lead tabular-nums"
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
