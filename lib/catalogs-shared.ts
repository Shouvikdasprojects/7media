export interface CatalogData {
  id: string
  name: string
  color: 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'pink'
  thumbnail?: 'Folder' | 'Clapperboard' | 'Film' | 'Tv' | 'Sparkles' | 'Flame' | 'Star' | 'Heart'
  itemIds: number[]
  custom?: boolean
}

export const CATALOGS_CHANGED_EVENT = '7media-catalogs-changed'
export const WATCHLIST_CHANGED_EVENT = '7media-watchlist-changed'

export const DEFAULT_USER_CATALOGS: CatalogData[] = [
  { id: 'watchlist', name: 'Main Watchlist', color: 'emerald', thumbnail: 'Folder', itemIds: [] },
  { id: 'movies', name: 'Favorite Movies', color: 'emerald', thumbnail: 'Film', itemIds: [], custom: true },
  { id: 'series', name: 'TV Series Binge', color: 'cyan', thumbnail: 'Tv', itemIds: [], custom: true },
  { id: 'anime', name: 'Anime Vault', color: 'purple', thumbnail: 'Sparkles', itemIds: [], custom: true },
  { id: 'must_watch', name: 'Must Watch & Top Rated', color: 'amber', thumbnail: 'Star', itemIds: [], custom: true },
  { id: 'horror', name: 'Late Night Thrills', color: 'rose', thumbnail: 'Flame', itemIds: [], custom: true },
  { id: 'critics', name: "Critics' Masterpieces", color: 'pink', thumbnail: 'Clapperboard', itemIds: [], custom: true },
]

/**
 * Merges existing user catalogs with default folders so no default category is ever missing,
 * while preserving all custom folders and saved item IDs.
 */
export function mergeWithDefaultCatalogs(existing: CatalogData[] = []): CatalogData[] {
  if (!Array.isArray(existing) || existing.length === 0) {
    return DEFAULT_USER_CATALOGS.map((c) => ({ ...c, itemIds: [...(c.itemIds || [])] }))
  }

  const existingMap = new Map<string, CatalogData>()
  existing.forEach((c) => {
    if (c && c.id) {
      existingMap.set(c.id, {
        ...c,
        name: c.name || 'Custom Folder',
        color: c.color || 'emerald',
        thumbnail: c.thumbnail || 'Folder',
        itemIds: Array.isArray(c.itemIds) ? c.itemIds : [],
      })
    }
  })

  // Ensure all default catalogs exist
  const result: CatalogData[] = []

  // 1. First add 'watchlist'
  const watchlistCat = existingMap.get('watchlist') || DEFAULT_USER_CATALOGS[0]
  result.push({
    ...DEFAULT_USER_CATALOGS[0],
    ...watchlistCat,
    name: 'Main Watchlist',
  })
  existingMap.delete('watchlist')

  // 2. Add other default categories if not already in existingMap, or use existing version
  for (let i = 1; i < DEFAULT_USER_CATALOGS.length; i++) {
    const def = DEFAULT_USER_CATALOGS[i]
    if (existingMap.has(def.id)) {
      result.push(existingMap.get(def.id)!)
      existingMap.delete(def.id)
    } else {
      result.push({ ...def, itemIds: [] })
    }
  }

  // 3. Append all user-created custom catalogs
  for (const customCat of existingMap.values()) {
    result.push(customCat)
  }

  return result
}

/**
 * Dispatches a global event so all open tabs and components sync their folder state in real-time.
 */
export function dispatchCatalogsUpdated(catalogs: CatalogData[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('7media_catalogs', JSON.stringify(catalogs))
    } catch {}
    window.dispatchEvent(new CustomEvent(CATALOGS_CHANGED_EVENT, { detail: catalogs }))
  }
}

export function dispatchWatchlistUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT))
  }
}
