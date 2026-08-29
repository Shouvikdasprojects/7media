'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Check if user dismissed recently
      const dismissed = localStorage.getItem('7media_pwa_dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Fallback timer on mobile devices if prompt event doesn't fire immediately
    const timer = setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const dismissed = localStorage.getItem('7media_pwa_dismissed')
      if (!isStandalone && !dismissed && window.innerWidth < 768) {
        setShowBanner(true)
      }
    }, 4000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      // Guide mobile iOS/Android users
      alert('To install 7MEDIA: Tap the Share icon in your browser and select "Add to Home Screen".')
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    try {
      localStorage.setItem('7media_pwa_dismissed', 'true')
    } catch {}
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative flex items-center justify-between gap-3 rounded-3xl border border-accent/40 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 shadow-black/80">
        <div className="flex items-center gap-3">
          <Logo variant="icon" size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Install 7MEDIA App
              </h4>
              <span className="rounded-full bg-accent/20 px-1.5 py-0.2 text-[9px] font-black text-accent">
                Fast &amp; Free
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Instant launch, full-screen playback, and offline catalog.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-2xl bg-accent hover:bg-accent/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 shadow-md shadow-accent/25"
          >
            <Download size={13} />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
