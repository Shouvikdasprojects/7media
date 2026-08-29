'use client'

export type Preferences = {
  quality: 'Auto' | 'Performance' | 'Default' | 'HD'
  language: string
  region: string
  saveHistory: boolean
  hideMature: boolean
}

export const defaultPreferences: Preferences = {
  quality: 'Default',
  language: 'English',
  region: 'Auto (detect)',
  saveHistory: true,
  hideMature: false,
}

const COOKIE = '7media-prefs'

export function readPreferences(): Preferences {
  if (typeof document === 'undefined') return defaultPreferences
  try {
    const raw = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))?.[1]
    if (!raw) return defaultPreferences
    const parsed = JSON.parse(decodeURIComponent(raw))
    return { ...defaultPreferences, ...parsed }
  } catch {
    return defaultPreferences
  }
}

export function writePreferences(prefs: Preferences) {
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=31536000; samesite=lax`
  applyPreferences(prefs)
}

export function clearPreferences() {
  document.cookie = `${COOKIE}=; path=/; max-age=0`
  applyPreferences(defaultPreferences)
}

export function applyPreferences(prefs: Preferences) {
  const root = document.documentElement
  root.dataset.quality = prefs.quality.toLowerCase()
  root.dir = prefs.language === 'Arabic' ? 'rtl' : 'ltr'
}
