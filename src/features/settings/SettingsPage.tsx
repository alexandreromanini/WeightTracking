import { useLiveQuery } from 'dexie-react-hooks'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { PageHeader } from '../../components/PageHeader'
import {
  buttonDanger,
  buttonSecondary,
  linkAction,
  linkDanger,
} from '../../components/ui'
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
        `weighttracking-sauvegarde-${toISODate(new Date())}.json`,
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
        {counts && <p className="mt-3">Tu suis actuellement {current}.</p>}
      </PageHeader>

      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`mb-6 border-l-4 py-1 pl-3 font-bold ${
            message.tone === 'error'
              ? 'border-signal text-signal'
              : 'border-electric text-night'
          }`}
        >
          {message.text}
        </p>
      )}

      {pending && (
        <div
          role="alertdialog"
          aria-labelledby="confirm-title"
          className="mb-8 border-2 border-signal p-4"
        >
          <p id="confirm-title" className="font-bold">
            {pending.kind === 'clear'
              ? `Effacer définitivement ${current} ?`
              : `Remplacer tes données (${current}) par ${describe(
                  pending.backup.userExercises.length,
                  pending.backup.workouts.length,
                )} ?`}
          </p>
          {hasData && (
            <p className="mt-1 text-label text-steel">
              Pas de retour en arrière : exporte d’abord si tu as un doute.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5">
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
              className={linkAction}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <Section
        title="Tes données restent ici"
        text="Rien ne part sur un serveur : tout vit dans ce navigateur. Exporte un fichier de temps en temps, il se réimporte en un geste, même sur un autre téléphone."
      >
        <button
          type="button"
          onClick={() => void exportData()}
          disabled={!hasData}
          className={`${buttonSecondary} disabled:border-rule disabled:text-steel`}
        >
          Exporter mes données
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className={buttonSecondary}
        >
          Importer un fichier
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
        title="Essayer sans rien saisir"
        text="10 semaines fictives sur 5 mouvements de base, avec des records à battre."
      >
        <button type="button" onClick={loadDemo} className={buttonSecondary}>
          Charger les données de démo
        </button>
      </Section>

      {hasData && (
        <Section title="Repartir de zéro">
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              setPending({ kind: 'clear' })
            }}
            className={linkDanger}
          >
            Effacer toutes mes données
          </button>
        </Section>
      )}

      <Section title="D’où viennent les exercices">
        <p className="max-w-md text-steel">
          Les 870 exercices et leurs photos viennent de{' '}
          <a
            href="https://github.com/yuhonas/free-exercise-db"
            className="font-bold text-night underline underline-offset-4"
          >
            free-exercise-db
          </a>
          , une base libre de droits. Le 1RM est estimé avec la formule d’Epley
          : poids × (1 + reps / 30).
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
    <section className="border-t border-rule py-8">
      <h2 className="display text-lead">{title}</h2>
      {text && <p className="mt-2 max-w-md text-steel">{text}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}
