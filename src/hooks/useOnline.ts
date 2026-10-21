import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** État de la connexion, mis à jour en direct. */
export const useOnline = () =>
  useSyncExternalStore(subscribe, () => navigator.onLine)
