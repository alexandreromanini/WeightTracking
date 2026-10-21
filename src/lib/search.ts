import Fuse from 'fuse.js'
import type { Exercise } from '../types'
import { FRENCH_SYNONYMS, POPULAR_EXERCISE_IDS } from './synonyms'

/** Minuscules, sans accents ni ponctuation : « Développé-couché » → « developpe couche ». */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const SYNONYMS = FRENCH_SYNONYMS.map(
  ([fr, en]) => [` ${normalize(fr)} `, ` ${en} `] as const,
).sort((a, b) => b[0].length - a[0].length)

/** Traduit les termes français connus, laisse le reste intact. */
export function translateQuery(query: string): string {
  let q = ` ${normalize(query)} `
  for (const [fr, en] of SYNONYMS) q = q.replaceAll(fr, en)
  return q.trim()
}

export interface SearchFilters {
  muscle?: string
  equipment?: string
}

export function createSearcher(exercises: Exercise[]) {
  // Recherche étendue : chaque mot est cherché en flou, et tous doivent matcher.
  const fuse = new Fuse(exercises, {
    keys: ['name'],
    threshold: 0.35,
    ignoreLocation: true,
    useExtendedSearch: true,
  })

  return (query: string, { muscle, equipment }: SearchFilters = {}) => {
    const q = translateQuery(query)
    const matches = q ? fuse.search(q).map((r) => r.item) : exercises
    // Tri stable : les classiques d'abord, l'ordre de pertinence est conservé ensuite.
    const popularFirst = matches.toSorted(
      (a, b) =>
        Number(POPULAR_EXERCISE_IDS.has(b.id)) -
        Number(POPULAR_EXERCISE_IDS.has(a.id)),
    )
    return popularFirst.filter(
      (e) =>
        (!muscle || e.primaryMuscles.includes(muscle)) &&
        (!equipment || e.equipment === equipment),
    )
  }
}
