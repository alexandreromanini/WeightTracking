import { useLiveQuery } from 'dexie-react-hooks'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { PageHeader } from '../../components/PageHeader'
import { buttonDanger, buttonSecondary, buttonSmall } from '../../components/ui'
import { db } from '../../db/db'
import { buildDemoBackup } from '../../db/seed'
import {
  BackupError,
  clearAllData,
  exportBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from '../../lib/backup'
import { toISODate } from '../../lib/format'

type Pending =
  | { kind: 'import'; backup: Backup }
  | { kind: 'demo'; backup: Backup }
  | { kind: 'clear' }

interface Message {
  tone: 'ok' | 'error'
  text: string
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
const describe = (exercises: number, workouts: number) =>
  `${plural(exercises, 'exercice')} et ${plural(workouts, 'séance')}`

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Laisse le temps au navigateur de lancer le téléchargement (Safari).
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function SettingsPage() {
  const counts = useLiveQuery(async () => ({
    exercises: await db.userExercises.count(),
    workouts: await db.workouts.count(),
  }))
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  // La confirmation s'affiche en haut : on y amène le focus (et le défilement).
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (pending) confirmRef.current?.focus()
  }, [pending])

  const hasData = (counts?.exercises ?? 0) > 0
  const current = counts ? describe(counts.exercises, counts.workouts) : ''

  const run = async (action: () => Promise<void>, success: string) => {
    setPending(null)
    try {
      await action()
      setMessage({ tone: 'ok', text: success })
    } catch {
      // Les écritures sont transactionnelles : en cas d'échec, rien n'a changé.
      setMessage({
        tone: 'error',
        text: 'L’opération a échoué, tes données sont intactes.',
      })
    }
  }

  const exportData = () =>
    run(async () => {
      downloadJson(
        `barre-sauvegarde-${toISODate(new Date())}.json`,
        await exportBackup(),
      )
    }, 'Sauvegarde téléchargée.')

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-choisir le même fichier
    if (!file) return
    setMessage(null)
    try {
      const backup = parseBackup(JSON.parse(await file.text()))
      setPending({ kind: 'import', backup })
    } catch (err) {
      setMessage({
        tone: 'error',
        text:
          err instanceof BackupError
            ? err.message
            : 'Ce fichier n’est pas un JSON valide.',
      })
    }
  }

  const loadDemo = () => {
    const backup = buildDemoBackup()
    if (hasData) setPending({ kind: 'demo', backup })
    else void run(() => restoreBackup(backup), 'Données de démo chargées.')
  }

  const confirm = () => {
    if (!pending) return
    if (pending.kind === 'clear') {
      void run(clearAllData, 'Toutes tes données ont été effacées.')
    } else {
      void run(
        () => restoreBackup(pending.backup),
        pending.kind === 'demo'
          ? 'Données de démo chargées.'
          : 'Sauvegarde importée.',
      )
    }
  }

  return (
    <>
      <PageHeader title="Réglages">
        {counts && (
          <p className="mt-1 text-white/85">Tu suis actuellement {current}.</p>
        )}
      </PageHeader>

      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`mt-5 rounded-xl p-3 text-sm ${
            message.tone === 'error'
              ? 'bg-red-50 text-red-800 ring-1 ring-red-200'
              : 'bg-green-50 text-green-800 ring-1 ring-green-200'
          }`}
        >
          {message.text}
        </p>
      )}

      {pending && (
        <div
          role="alertdialog"
          aria-labelledby="confirm-title"
          className="mt-5 space-y-3 rounded-xl border border-red-200 bg-card p-4"
        >
          <p id="confirm-title" className="font-semibold">
            {pending.kind === 'clear'
              ? `Effacer définitivement ${current} ?`
              : `Remplacer tes données (${current}) par ${describe(
                  pending.backup.userExercises.length,
                  pending.backup.workouts.length,
                )} ?`}
          </p>
          {hasData && (
            <p className="text-sm text-muted">
              Pense à exporter une sauvegarde avant, l’opération est définitive.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              ref={confirmRef}
              type="button"
              onClick={confirm}
              className={buttonDanger}
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className={buttonSmall}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <Section
        title="Sauvegarde"
        text="Tes données restent sur cet appareil. Exporte-les en JSON pour les conserver ou les transférer."
      >
        <button
          type="button"
          onClick={() => void exportData()}
          disabled={!hasData}
          className={`${buttonSecondary} w-full disabled:opacity-50`}
        >
          Exporter mes données
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className={`${buttonSecondary} w-full`}
        >
          Importer une sauvegarde
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={(e) => void onFile(e)}
          className="hidden"
          tabIndex={-1}
          aria-hidden
        />
      </Section>

      <Section
        title="Démo"
        text="Charge 10 semaines d’entraînement fictif sur 5 exercices pour explorer l’app."
      >
        <button
          type="button"
          onClick={loadDemo}
          className={`${buttonSecondary} w-full`}
        >
          Charger les données de démo
        </button>
      </Section>

      {hasData && (
        <Section title="Zone sensible">
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              setPending({ kind: 'clear' })
            }}
            className={`${buttonSmall} text-muted`}
          >
            Effacer toutes mes données
          </button>
        </Section>
      )}

      <Section title="À propos">
        <p className="text-sm text-muted">
          Exercices et photos :{' '}
          <a
            href="https://github.com/yuhonas/free-exercise-db"
            className="font-semibold text-ink underline underline-offset-2"
          >
            free-exercise-db
          </a>{' '}
          (domaine public, Unlicense). 1RM estimé avec la formule d’Epley.
        </p>
      </Section>
    </>
  )
}

function Section({
  title,
  text,
  children,
}: {
  title: string
  text?: string
  children: ReactNode
}) {
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {text && <p className="text-sm text-muted">{text}</p>}
      {children}
    </section>
  )
}
