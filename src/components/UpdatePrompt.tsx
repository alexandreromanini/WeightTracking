import { useRegisterSW } from 'virtual:pwa-register/react'
import { CloseIcon } from './icons'

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
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 bg-night text-white"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-2 [&_*:focus-visible]:outline-white">
        <p className="flex-1">Une nouvelle version de Barre est prête.</p>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="min-h-11 font-bold underline decoration-2 underline-offset-4"
        >
          Mettre à jour
        </button>
        <button
          type="button"
          aria-label="Plus tard"
          onClick={() => setNeedRefresh(false)}
          className="grid size-11 place-items-center"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
