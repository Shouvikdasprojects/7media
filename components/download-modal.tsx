'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Apple,
  CheckCircle2,
  Sparkles,
  Zap,
  WifiOff,
  ShieldCheck,
  Share,
  PlusSquare,
  ArrowRight
} from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [activeTab, setActiveTab] = useState<'pwa' | 'desktop' | 'mobile'>('pwa')

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      // Fallback instruction
      alert('To install 7MEDIA: Click your browser address bar menu (three dots) and select "Install 7MEDIA App" or "Add to Home Screen".')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-black/90 max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition active:scale-90 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(229,9,20,0.3)]">
            <Download size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                Download 7MEDIA App
              </h2>
              <span className="rounded-full bg-primary/20 border border-primary/40 px-2 py-0.5 text-[9px] font-black uppercase text-primary">
                v2.4 PWA
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Install native standalone experience across all devices
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
            <Zap size={18} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">Instant Launch</p>
            <p className="text-[9px] text-zinc-400">Zero lag startup</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
            <WifiOff size={18} className="text-cyan-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">Offline Cache</p>
            <p className="text-[9px] text-zinc-400">Local storage sync</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
            <ShieldCheck size={18} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">Ad-Free Stream</p>
            <p className="text-[9px] text-zinc-400">Pure cinema</p>
          </div>
        </div>

        {/* Tabs: One-Click / Desktop / Mobile */}
        <div className="flex rounded-2xl bg-zinc-900 p-1 mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'pwa'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚡ 1-Click Install
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'mobile'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📱 Mobile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'desktop'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💻 Desktop
          </button>
        </div>

        {/* Tab 1: One-Click PWA */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Click below to install 7MEDIA directly to your desktop or mobile home screen as a standalone application with hardware acceleration and full offline support.
              </p>
            </div>

            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
                <CheckCircle2 size={18} />
                <span>7MEDIA App is Already Installed on this Device!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 px-6 py-4 text-sm font-black uppercase tracking-wider text-primary-foreground transition shadow-lg shadow-primary/30 active:scale-95 cursor-pointer"
              >
                <Download size={18} />
                <span>Install 7MEDIA App Now</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Mobile Guide */}
        {activeTab === 'mobile' && (
          <div className="space-y-4">
            {/* iOS Safari */}
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase mb-2">
                <Apple size={16} className="text-zinc-300" />
                <span>iOS (iPhone &amp; iPad Safari)</span>
              </div>
              <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Tap the <Share size={13} className="inline mx-1 text-primary" /> <strong>Share</strong> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <PlusSquare size={13} className="inline mx-1 text-primary" /> <strong>Add to Home Screen</strong>.
                </li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>

            {/* Android Chrome */}
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase mb-2">
                <Smartphone size={16} className="text-emerald-400" />
                <span>Android (Chrome / Brave / Edge)</span>
              </div>
              <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Tap the <strong>Three Dots (⋮)</strong> menu in the browser.</li>
                <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Enjoy full-screen cinema streaming with zero browser bars.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 3: Desktop Guide */}
        {activeTab === 'desktop' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase mb-2">
                <Monitor size={16} className="text-cyan-400" />
                <span>Windows, Mac &amp; Linux (Chrome / Edge)</span>
              </div>
              <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Look at the right side of the browser URL / address bar.</li>
                <li>Click the <Download size={13} className="inline mx-1 text-primary" /> <strong>Install 7MEDIA</strong> icon.</li>
                <li>7MEDIA will launch in its own native borderless dark cinema window.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
