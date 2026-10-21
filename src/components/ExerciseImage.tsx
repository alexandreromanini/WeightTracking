import { useState } from 'react'

interface Props {
  src: string | undefined
  name: string
  /** Texte alternatif ; vide si l'image est décorative (nom affiché à côté). */
  alt?: string
  className?: string
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/** Image d'exercice avec repli (initiales) si l'URL manque ou ne charge pas. */
export function ExerciseImage({ src, name, alt = '', className = '' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>()

  if (!src || failedSrc === src) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`grid place-items-center bg-steel font-display text-2xl font-bold text-dust ${className}`}
      >
        {initials(name)}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      // Requête CORS : la réponse n'est pas « opaque », le service worker
      // peut la mettre en cache sans gonfler le quota de stockage.
      crossOrigin="anonymous"
      onError={() => setFailedSrc(src)}
      className={`bg-chalk object-cover ${className}`}
    />
  )
}
