import { useRegisterSW } from 'virtual:pwa-register/react'
import { CloseIcon } from './icons'
import { buttonSmall } from './ui'

/** Propose la nouvelle version au lieu de recharger d'office (séance en cours). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-2xl px-4"
    >
      <div className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-lg">
        <p className="flex-1 text-sm">Nouvelle version disponible.</p>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className={`${buttonSmall} border-brand bg-brand text-white`}
        >
          Mettre à jour
        </button>
        <button
          type="button"
          aria-label="Plus tard"
          onClick={() => setNeedRefresh(false)}
          className="grid size-11 place-items-center rounded-full text-muted hover:text-ink"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
