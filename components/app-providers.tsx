'use client'

import React, { useEffect } from 'react'
import { I18nProvider } from '@/lib/i18n/context'

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA ServiceWorker registration failed:', err)
      })
    }
  }, [])

  return <I18nProvider>{children}</I18nProvider>
}

