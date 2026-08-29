'use client'

export interface LocalHistoryItem {
  id: string
  tmdbId: number
  mediaType: 'movie' | 'tv' | 'anime'
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  season?: number | null
  episode?: number | null
  timestamp: number
  duration?: number | null
  updatedAt: string
}

const STORAGE_KEY = '7media_watch_history'
const WATCHED_KEY = '7media_watched_episodes'

export function getLocalHistory(): LocalHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveLocalProgress(item: Omit<LocalHistoryItem, 'id' | 'updatedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const history = getLocalHistory()
    const id = `${item.mediaType}-${item.tmdbId}-${item.season || 0}-${item.episode || 0}`
    const now = new Date().toISOString()

    const filtered = history.filter((h) => h.id !== id)
    const updatedItem: LocalHistoryItem = {
      ...item,
      id,
      updatedAt: now,
    }

    // Keep up to 50 recent items
    const newHistory = [updatedItem, ...filtered].slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))

    // Dispatch event so all components reactively update
    window.dispatchEvent(new Event('7media-history-updated'))
  } catch {
    // localStorage full or unavailable
  }
}

export function removeLocalProgress(id: string) {
  if (typeof window === 'undefined') return
  try {
    const history = getLocalHistory()
    const newHistory = history.filter((h) => h.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    window.dispatchEvent(new Event('7media-history-updated'))
  } catch {}
}

export function clearLocalHistory() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('7media-history-updated'))
  } catch {}
}

export function getLocalProgressItem(tmdbId: number, mediaType: string): LocalHistoryItem | null {
  if (typeof window === 'undefined') return null
  const history = getLocalHistory()
  return history.find((h) => h.tmdbId === tmdbId && h.mediaType === mediaType) || null
}

export function getWatchedEpisodes(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(WATCHED_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function toggleWatchedEpisodeKey(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const current = getWatchedEpisodes()
    const nextState = !current[key]
    if (nextState) {
      current[key] = true
    } else {
      delete current[key]
    }
    localStorage.setItem(WATCHED_KEY, JSON.stringify(current))
    window.dispatchEvent(new Event('7media-history-updated'))
    return nextState
  } catch {
    return false
  }
}
