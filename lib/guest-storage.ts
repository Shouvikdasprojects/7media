'use client'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds (604,800,000 ms)
const GUEST_STORAGE_TIMESTAMP_KEY = '7media_guest_storage_created_at'

export const GUEST_STORAGE_KEYS = [
  '7media_watchlist',
  '7media_catalogs',
  '7media_watched',
  '7media_liked',
  '7media_disliked',
  '7media_recently_viewed',
  '7media_history',
  '7media_movie_history',
  '7media_guest_storage_created_at',
]

/**
 * Initializes or touches the 7-day countdown when guest saves their first item.
 */
export function touchGuestStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const existing = localStorage.getItem(GUEST_STORAGE_TIMESTAMP_KEY)
    if (!existing) {
      localStorage.setItem(GUEST_STORAGE_TIMESTAMP_KEY, String(Date.now()))
    }
  } catch {}
}

/**
 * Checks if 7 days have passed since guest storage was initialized.
 * If 7 days have passed, automatically purges guest local storage.
 */
export function checkAndCleanGuestStorage(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const timestampStr = localStorage.getItem(GUEST_STORAGE_TIMESTAMP_KEY)
    if (!timestampStr) return false

    const createdAt = parseInt(timestampStr, 10)
    if (isNaN(createdAt)) {
      localStorage.removeItem(GUEST_STORAGE_TIMESTAMP_KEY)
      return false
    }

    const elapsed = Date.now() - createdAt
    if (elapsed > SEVEN_DAYS_MS) {
      // 7 days have passed! Purge all guest items from local storage
      GUEST_STORAGE_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key)
        } catch {}
      })

      // Clean any reviews created by guest
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('7media_reviews_')) {
            localStorage.removeItem(key)
          }
        }
      } catch {}

      // Dispatch events so UI updates immediately
      window.dispatchEvent(new CustomEvent('7media-watchlist-changed'))
      window.dispatchEvent(new CustomEvent('7media-catalogs-changed', { detail: [] }))
      window.dispatchEvent(new CustomEvent('7media-recently-viewed-updated'))
      window.dispatchEvent(new CustomEvent('7media-history-updated'))

      return true // Was cleaned
    }
  } catch (err) {
    console.error('Error during guest storage 7-day cleanup check:', err)
  }

  return false
}

/**
 * Returns remaining time (in days or hours) before guest local storage expires.
 */
export function getGuestStorageExpiry(): { daysRemaining: number; hoursRemaining: number; isExpiringSoon: boolean } | null {
  if (typeof window === 'undefined') return null

  try {
    const timestampStr = localStorage.getItem(GUEST_STORAGE_TIMESTAMP_KEY)
    if (!timestampStr) return null

    const createdAt = parseInt(timestampStr, 10)
    if (isNaN(createdAt)) return null

    const elapsed = Date.now() - createdAt
    const remainingMs = Math.max(0, SEVEN_DAYS_MS - elapsed)

    const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
    const hoursRemaining = Math.ceil(remainingMs / (60 * 60 * 1000))

    return {
      daysRemaining,
      hoursRemaining,
      isExpiringSoon: daysRemaining <= 2,
    }
  } catch {
    return null
  }
}
