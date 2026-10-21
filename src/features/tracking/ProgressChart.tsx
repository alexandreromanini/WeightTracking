import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
  type TooltipContentProps,
} from 'recharts'
import { formatKg, formatLongDate } from '../../lib/format'
import type { ProgressPoint } from '../../lib/performance'

// Recharts écrit les couleurs en attributs SVG : pas de var(--…) possible.
// Paire validée (daltonisme, contraste) sur la surface iron #191b1f.
// L'ocre remplace le jaune des badges, trop clair pour un trait sur fond sombre.
const SERIES = {
  maxWeight: { label: 'Charge max', color: '#2f6fde' },
  oneRM: { label: '1RM estimé', color: '#b8890f' },
} as const
type SeriesKey = keyof typeof SERIES
const SERIES_KEYS = Object.keys(SERIES) as SeriesKey[]

const INK = {
  chalk: '#f2efe8',
  dust: '#a8a49b',
  steel: '#2b2e35',
  iron: '#191b1f',
}
const DAY_MS = 86_400_000

const toTime = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const shortDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const point = payload[0]?.payload as ProgressPoint | undefined
  if (!active || !point) return null
  return (
    <div className="rounded-lg border border-steel bg-ink px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold first-letter:uppercase">
        {formatLongDate(point.date)}
      </p>
      {SERIES_KEYS.map((key) => (
        <p key={key} className="mt-1 flex items-center gap-2 text-dust">
          <span
            aria-hidden
            className="h-0.5 w-3 rounded-full"
            style={{ background: SERIES[key].color }}
          />
          {SERIES[key].label}
          <span className="ml-auto pl-3 font-semibold text-chalk tabular-nums">
            {formatKg(point[key])}
          </span>
        </p>
      ))}
    </div>
  )
}

/** Étiquette directe sur le dernier point seulement, en couleur de texte. */
const endLabel =
  (lastIndex: number) =>
  ({ x, y, index, value }: LabelProps) =>
    index === lastIndex && typeof value === 'number' ? (
      <text
        x={Number(x) + 8}
        y={Number(y)}
        dy={4}
        fill={INK.chalk}
        fontSize={12}
        fontWeight={600}
      >
        {formatKg(value)}
      </text>
    ) : null

/** Graduations régulières sur un pas « rond » (5, 10, 20… kg), ~4 intervalles. */
function niceTicks(min: number, max: number): number[] {
  const step = [5, 10, 20, 25, 50, 100].find((s) => (max - min) / s <= 4) ?? 100
  const start = Math.floor((min - 1) / step) * step
  const end = Math.ceil((max + 1) / step) * step
  return Array.from(
    { length: (end - start) / step + 1 },
    (_, i) => start + i * step,
  )
}

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const data = points.map((p) => ({ ...p, t: toTime(p.date) }))
  const first = points[0]
  const last = points.at(-1)
  const yTicks = niceTicks(
    Math.min(...points.map((p) => p.maxWeight)),
    Math.max(...points.map((p) => p.oneRM)),
  )

  return (
    <figure>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dust">
        <li className="mr-auto text-xs tracking-wide uppercase">En kg</li>
        {SERIES_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ background: SERIES[key].color }}
            />
            {SERIES[key].label}
          </li>
        ))}
      </ul>
      <div
        role="img"
        aria-label={
          first && last
            ? `Charge max de ${formatKg(first.maxWeight)} à ${formatKg(last.maxWeight)} sur ${points.length} jour${points.length > 1 ? 's' : ''} d’entraînement. Détail dans l’historique.`
            : undefined
        }
        className="mt-3 h-60"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 64, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={INK.steel} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              // Échelle temporelle : un mois sans séance se voit comme un trou.
              domain={([min, max]: readonly number[]) => [
                (min ?? 0) - DAY_MS,
                (max ?? 0) + DAY_MS,
              ]}
              tickFormatter={(t: number) => shortDate.format(t)}
              tick={{ fill: INK.dust, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: INK.steel }}
              minTickGap={24}
            />
            <YAxis
              domain={[yTicks[0] ?? 0, yTicks.at(-1) ?? 0]}
              ticks={yTicks}
              tick={{ fill: INK.dust, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: INK.dust, strokeDasharray: '3 3' }}
            />
            {SERIES_KEYS.map((key) => (
              <Line
                key={key}
                dataKey={key}
                name={SERIES[key].label}
                type="linear"
                stroke={SERIES[key].color}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: SERIES[key].color,
                  stroke: INK.iron,
                  strokeWidth: 2,
                }}
                activeDot={{ r: 6, stroke: INK.iron, strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList dataKey={key} content={endLabel(data.length - 1)} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
