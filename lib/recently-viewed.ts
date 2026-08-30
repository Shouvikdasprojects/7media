'use client'

export interface RecentlyViewedItem {
  id: number
  type: 'movie' | 'tv' | 'anime'
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number | string
  release_date?: string | null
  genres?: string[]
  viewedAt: string
}

const STORAGE_KEY = '7media_recently_viewed'

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addToRecentlyViewed(item: {
  id: number
  type: 'movie' | 'tv' | 'anime'
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number | string
  release_date?: string | null
  genres?: string[]
}) {
  if (typeof window === 'undefined' || !item.id) return
  try {
    const current = getRecentlyViewed()
    // Remove if already in list to move to front
    const filtered = current.filter(
      (entry) => !(entry.id === item.id && entry.type === item.type)
    )

    const newItem: RecentlyViewedItem = {
      id: item.id,
      type: item.type,
      title: item.title || 'Untitled',
      poster_path: item.poster_path || null,
      backdrop_path: item.backdrop_path || null,
      vote_average: item.vote_average,
      release_date: item.release_date || null,
      genres: item.genres || [],
      viewedAt: new Date().toISOString(),
    }

    // Keep top 30 recently viewed
    const updated = [newItem, ...filtered].slice(0, 30)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Notify listeners
    window.dispatchEvent(new Event('7media-recently-viewed-updated'))
  } catch {}
}

export function removeFromRecentlyViewed(id: number, type: string) {
  if (typeof window === 'undefined') return
  try {
    const current = getRecentlyViewed()
    const updated = current.filter((entry) => !(entry.id === id && entry.type === type))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('7media-recently-viewed-updated'))
  } catch {}
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('7media-recently-viewed-updated'))
  } catch {}
}
