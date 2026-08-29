'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import {
  type LanguageCode,
  TRANSLATIONS,
  REGION_CODE_MAP,
  TMDB_LANG_MAP,
  RTL_LANGUAGES,
} from './translations'
import { defaultPreferences, readPreferences, writePreferences } from '@/lib/preferences'

interface I18nContextType {
  language: LanguageCode
  region: string
  regionCode: string
  tmdbLang: string
  isRTL: boolean
  setLanguage: (lang: LanguageCode | string) => void
  setRegion: (region: string) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  language: 'English',
  region: 'Auto (detect)',
  regionCode: 'US',
  tmdbLang: 'en-US',
  isRTL: false,
  setLanguage: () => {},
  setRegion: () => {},
  t: (key: string) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('English')
  const [region, setRegionState] = useState('Auto (detect)')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const prefs = readPreferences()
    if (prefs.language && TRANSLATIONS[prefs.language as LanguageCode]) {
      setLanguageState(prefs.language as LanguageCode)
    }
    if (prefs.region) {
      setRegionState(prefs.region)
    }
    setLoaded(true)
  }, [])

  const isRTL = useMemo(() => RTL_LANGUAGES.includes(language), [language])

  useEffect(() => {
    if (!loaded) return
    const root = document.documentElement
    root.dir = isRTL ? 'rtl' : 'ltr'
    const langCode = TMDB_LANG_MAP[language] ? TMDB_LANG_MAP[language].split('-')[0] : 'en'
    root.lang = langCode
  }, [language, isRTL, loaded])

  const setLanguage = (newLang: LanguageCode | string) => {
    const validLang = (TRANSLATIONS[newLang as LanguageCode] ? newLang : 'English') as LanguageCode
    setLanguageState(validLang)
    const current = readPreferences()
    const updated = { ...current, language: validLang }
    writePreferences(updated)
  }

  const setRegion = (newRegion: string) => {
    setRegionState(newRegion)
    const current = readPreferences()
    const updated = { ...current, region: newRegion }
    writePreferences(updated)
  }

  const regionCode = useMemo(() => {
    return REGION_CODE_MAP[region] || 'US'
  }, [region])

  const tmdbLang = useMemo(() => {
    return TMDB_LANG_MAP[language] || 'en-US'
  }, [language])

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.English
    return dict[key] || TRANSLATIONS.English[key] || key
  }

  return (
    <I18nContext.Provider value={{ language, region, regionCode, tmdbLang, isRTL, setLanguage, setRegion, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
