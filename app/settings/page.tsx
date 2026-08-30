'use client'

const AVATARS = [
  { id: 'crimson', name: 'Crimson 7', emoji: '🎬', bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'anime', name: 'Anime Protagonist', emoji: '⚡', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'cyber', name: 'Cyber Neon', emoji: '🌌', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'director', name: 'Film Director', emoji: '🎥', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'shadow', name: 'Mystic Shadow', emoji: '🕶️', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'star', name: 'Golden Star', emoji: '⭐', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'retro', name: 'Retro Reel', emoji: '📼', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'popcorn', name: 'Cinephile', emoji: '🍿', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
]

import Link from 'next/link'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Gauge,
  Languages,
  LogOut,
  Palette,
  ShieldCheck,
  Trash2,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { getProgress, clearProgress } from '@/app/actions/progress'
import { getWatchlist } from '@/app/actions/watchlist'
import {
  defaultPreferences,
  readPreferences,
  writePreferences,
  clearPreferences,
  type Preferences,
} from '@/lib/preferences'
import { useI18n } from '@/lib/i18n/context'

const themes = [
  { name: 'Dark', description: 'Balanced default dark theme.' },
  { name: 'Midnight', description: 'Deep blue-violet cinema glow.' },
  { name: 'Sakura', description: 'Blossom-lit anime aesthetic.' },
  { name: 'Apple Theme', description: 'Modern Apple-style glassmorphism.' },
]

const qualities = [
  { name: 'Auto', detail: 'Adapts' },
  { name: 'Performance', detail: 'Fastest' },
  { name: 'Default', detail: 'Balanced' },
  { name: 'HD', detail: 'Sharpest' },
] as const

const qualityBlurbs: Record<string, string> = {
  Auto: 'Adapts to your device and connection automatically.',
  Performance: 'Animations, glows and blur effects are disabled for maximum speed.',
  Default: 'Balanced image quality and effects. Recommended for most people.',
  HD: 'Full effects and sharpest images. Best on fast connections.',
}

const languages = [
  { name: 'English', native: 'English', code: 'en' },
  { name: 'Bengali', native: 'বাংলা (Bengali)', code: 'bn' },
  { name: 'Hindi', native: 'हिन्दी (Hindi)', code: 'hi' },
  { name: 'Spanish', native: 'Español (Spanish)', code: 'es' },
  { name: 'French', native: 'Français (French)', code: 'fr' },
  { name: 'German', native: 'Deutsch (German)', code: 'de' },
  { name: 'Arabic', native: 'العربية (Arabic - RTL)', code: 'ar' },
  { name: 'Urdu', native: 'اردو (Urdu - RTL)', code: 'ur' },
  { name: 'Japanese', native: '日本語 (Japanese)', code: 'ja' },
  { name: 'Korean', native: '한국어 (Korean)', code: 'ko' },
  { name: 'Chinese (Simplified)', native: '简体中文 (Simplified Chinese)', code: 'zh' },
  { name: 'Chinese (Traditional)', native: '繁體中文 (Traditional Chinese)', code: 'zh-TW' },
  { name: 'Portuguese', native: 'Português (Portuguese)', code: 'pt' },
  { name: 'Russian', native: 'Русский (Russian)', code: 'ru' },
  { name: 'Italian', native: 'Italiano (Italian)', code: 'it' },
  { name: 'Turkish', native: 'Türkçe (Turkish)', code: 'tr' },
  { name: 'Indonesian', native: 'Bahasa Indonesia (Indonesian)', code: 'id' },
  { name: 'Vietnamese', native: 'Tiếng Việt (Vietnamese)', code: 'vi' },
  { name: 'Thai', native: 'ไทย (Thai)', code: 'th' },
  { name: 'Tamil', native: 'தமிழ் (Tamil)', code: 'ta' },
  { name: 'Telugu', native: 'తెలుగు (Telugu)', code: 'te' },
  { name: 'Dutch', native: 'Nederlands (Dutch)', code: 'nl' },
  { name: 'Polish', native: 'Polski (Polish)', code: 'pl' },
  { name: 'Swedish', native: 'Svenska (Swedish)', code: 'sv' },
  { name: 'Greek', native: 'Ελληνικά (Greek)', code: 'el' },
]

const regions = [
  { name: 'Auto (detect)', desc: 'Detect from device / IP' },
  { name: 'United States', desc: 'Netflix, Max, Hulu, Prime Video, Apple TV' },
  { name: 'United Kingdom', desc: 'BBC iPlayer, Sky, Disney+, ITVX' },
  { name: 'Bangladesh', desc: 'Chorki, Hoichoi, Toffee, Netflix BD' },
  { name: 'India', desc: 'Disney+ Hotstar, JioCinema, Prime Video, Zee5' },
  { name: 'Japan', desc: 'U-Next, Abema, DMM TV, Hulu JP' },
  { name: 'South Korea', desc: 'Wavve, Watcha, TVING, Coupang Play' },
  { name: 'Canada', desc: 'Crave, CBC Gem, Prime Video' },
  { name: 'Germany', desc: 'WOW, Joyn, RTL+, Paramount+' },
  { name: 'France', desc: 'Canal+, OCS, France TV, Netflix' },
  { name: 'Spain', desc: 'Movistar+, Filmin, RTVE Play' },
  { name: 'Brazil', desc: 'Globoplay, Telecine, Star+' },
  { name: 'Italy', desc: 'NOW, TIMVISION, Mediaset Infinity' },
  { name: 'Australia', desc: 'Stan, Binge, ABC iview, Foxtel' },
  { name: 'Mexico', desc: 'ViX, Claro Video, HBO Max' },
  { name: 'Indonesia', desc: 'Vidio, Vision+, Disney+ Hotstar' },
  { name: 'Turkey', desc: 'BluTV, GAIN, Exxen, Disney+' },
  { name: 'Saudi Arabia', desc: 'Shahid VIP, OSN+, STARZPLAY' },
  { name: 'United Arab Emirates', desc: 'Shahid, OSN+, TOD, Netflix' },
]

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-5">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  )
}

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ name: string; native?: string; desc?: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const currentObj = options.find((o) => o.name === value) || options[0]

  return (
    <div className="relative">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-left text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 shadow-sm"
      >
        <span>{currentObj.native || currentObj.name}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-2xl scrollbar-hide"
        >
          {options.map((option) => (
            <button
              key={option.name}
              type="button"
              role="option"
              aria-selected={option.name === value}
              onClick={() => {
                onChange(option.name)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                option.name === value
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <div>
                <p className="font-semibold">{option.native || option.name}</p>
                {option.desc && (
                  <p className="text-[11px] text-muted-foreground">{option.desc}</p>
                )}
              </div>
              {option.name === value && <Check size={16} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({
  active,
  onToggle,
  label,
}: {
  active: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={onToggle}
      className={`group relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-95 touch-manipulation ${
        active
          ? 'bg-accent shadow-[0_0_16px_rgba(229,9,20,0.5)] border border-accent'
          : 'bg-zinc-800/90 border border-white/20 hover:bg-zinc-700/80 hover:border-white/30'
      }`}
    >
      <span
        className={`pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-x-110 ${
          active ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}


export default function SettingsPage() {
  const { data: session, isPending } = useSession()
  const { language, region, setLanguage, setRegion, t } = useI18n()
  const [theme, setTheme] = useState('Dark')
  const [selectedAvatar, setSelectedAvatar] = useState('crimson')
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences)
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const notify = (text: string) => setMessage(text)

  const { data: progressItems, mutate: mutateProgress } = useSWR(
    session ? 'settings-progress' : null,
    getProgress
  )
  const { data: watchlistItems } = useSWR(
    session ? 'settings-watchlist' : null,
    getWatchlist
  )

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )7media-theme=([^;]+)/)?.[1]
    if (saved && themes.some((item) => item.name === decodeURIComponent(saved))) {
      setTheme(decodeURIComponent(saved))
    }
    setPrefs(readPreferences())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const el = document.querySelector(window.location.hash)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    }
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    const root = document.documentElement
    root.dataset.theme = theme.toLowerCase().replace(/\s+/g, '-')
    root.classList.remove('dark', 'theme-midnight', 'theme-sakura', 'theme-apple')
    if (theme !== 'Apple Theme') root.classList.add('dark')
    root.style.colorScheme = 'dark'
    if (theme === 'Midnight') root.classList.add('theme-midnight')
    if (theme === 'Sakura') root.classList.add('theme-sakura')
    if (theme === 'Apple Theme') root.classList.add('theme-apple')
    document.cookie = `7media-theme=${encodeURIComponent(theme)}; path=/; max-age=31536000; samesite=lax`
    try {
      localStorage.setItem('7media-theme', theme)
    } catch {}
    window.dispatchEvent(new CustomEvent('7media-theme-changed', { detail: theme }))
  }, [theme, loaded])

  const updatePrefs = (next: Partial<Preferences>, text: string) => {
    const merged = { ...prefs, ...next }
    setPrefs(merged)
    writePreferences(merged)
    notify(text)
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    updatePrefs({ language: newLang }, `Language switched to ${newLang}`)
  }

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion)
    updatePrefs({ region: newRegion }, `Watch region set to ${newRegion}`)
  }

  const handleClearProgress = async () => {
    await clearProgress()
    await mutateProgress()
    notify('Continue watching cleared.')
  }

  const handleReset = async () => {
    clearPreferences()
    setPrefs(defaultPreferences)
    setLanguage('English')
    setRegion('Auto (detect)')
    if (session) {
      await clearProgress()
      await mutateProgress()
    }
    notify('All settings and preferences reset to defaults.')
  }

  const progressCount = progressItems?.length ?? 0
  const watchlistCount = watchlistItems?.items?.length ?? 0

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-28 text-foreground md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> {t('backHome')}
        </Link>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">
          {t('settings')}
        </p>
        <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl uppercase">
          Site Controls
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage your account, language localization, streaming region, and appearance.
        </p>

        {/* Section Shortcut Tabs */}
        <nav
          className="mt-8 flex gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card/60 p-1.5 scrollbar-hide"
          aria-label="Settings sections"
        >
          {[
            ['Appearance', Palette, '#appearance'],
            ['Performance', Gauge, '#performance'],
            ['Language & Region', Globe, '#language'],
            ['Privacy', ShieldCheck, '#privacy'],
            ['Help & FAQ', CircleHelp, '#help'],
          ].map(([label, Icon, hash]) => (
            <a
              key={label as string}
              href={hash as string}
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-95"
            >
              <Icon size={16} />
              {label as string}
            </a>
          ))}
        </nav>

        {message && (
          <div
            className="mt-5 flex items-center justify-between rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs font-bold text-accent shadow-md animate-in fade-in"
            role="status"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} /> {message}
            </span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-muted-foreground hover:text-foreground text-sm font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Account Section */}
        <section className="mt-8 border-b border-border pb-8">
          <SectionHeader
            title="Account"
            description="Your 7MEDIA account syncs watchlists and continue watching across devices."
          />
          {isPending ? (
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
          ) : session ? (
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-foreground">{session.user.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{session.user.email}</p>
                <p className="mt-1 text-xs font-bold text-accent">
                  Signed in — watchlist and history sync is on.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-95"
              >
                <LogOut size={15} /> {t('signOut')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-foreground">Not signed in</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Most settings below still work locally. Sign in to sync your watchlist and continue watching.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="rounded-xl bg-primary px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-md"
              >
                {t('signIn')}
              </Link>
            </div>
          )}
        
            {/* Avatar Customization */}
            <div className="mt-4 rounded-2xl border border-border bg-card/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Profile Avatar
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(av.id)
                      notify(`Profile avatar set to ${av.name}`)
                      try { localStorage.setItem('7media_avatar', av.id) } catch {}
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all active:scale-95 ${av.bg} ${
                      selectedAvatar === av.id
                        ? 'ring-2 ring-accent scale-105 shadow-md'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl mb-1">{av.emoji}</span>
                    <span className="text-[10px] font-bold text-foreground truncate max-w-full">
                      {av.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

        </section>

        {/* Appearance Section */}
        <section id="appearance" className="scroll-mt-24 border-b border-border py-8">
          <SectionHeader
            title="Appearance"
            description="Pick the look that suits you. Applies across the whole site instantly."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setTheme(item.name)
                  notify(`${item.name} theme selected`)
                }}
                aria-label={`${item.name} theme${theme === item.name ? ' active' : ''} ${item.description}`}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition hover:border-accent active:scale-95 ${
                  theme === item.name
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border bg-card/50'
                }`}
              >
                <span>
                  <span className="block font-bold text-foreground text-sm">{item.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
                </span>
                {theme === item.name && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-black uppercase text-accent-foreground shadow-sm">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Performance Section */}
        <section id="performance" className="scroll-mt-24 border-b border-border py-8">
          <SectionHeader
            title="Performance & Quality"
            description="One switch for speed vs. sharpness — sets image quality and effects together."
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {qualities.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => updatePrefs({ quality: item.name }, `${item.name} quality selected`)}
                className={`rounded-2xl border p-4 text-left transition hover:border-accent active:scale-95 ${
                  prefs.quality === item.name
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border bg-card/50'
                }`}
              >
                <span className="block font-bold text-foreground text-sm">{item.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{qualityBlurbs[prefs.quality]}</p>
        </section>

        {/* Language & Region Section (DYNAMIC WORKING) */}
        <section id="language" className="scroll-mt-24 border-b border-border py-8">
          <SectionHeader
            title="Language & Regional Settings"
            description="Select your preferred language (changes entire web app UI) and streaming region for watch providers."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingSelect
              label="Web App Language"
              value={language}
              options={languages}
              onChange={handleLanguageChange}
            />
            <SettingSelect
              label="Streaming Watch Region"
              value={region}
              options={regions}
              onChange={handleRegionChange}
            />
          </div>
        </section>

        {/* Privacy & Data Section */}
        <section id="privacy" className="scroll-mt-24 border-b border-border py-8">
          <SectionHeader
            title="Privacy & Data"
            description="Control watch history, continue watching, and mature content filters."
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/50 p-5">
              <div>
                <p className="font-bold text-sm text-foreground">Save watch history</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Remembers what you watched so Continue watching can show across devices.
                </p>
              </div>
              <Toggle
                active={prefs.saveHistory}
                onToggle={() =>
                  updatePrefs(
                    { saveHistory: !prefs.saveHistory },
                    prefs.saveHistory
                      ? 'Watch history saving turned off.'
                      : 'Watch history saving turned on.'
                  )
                }
                label="Save watch history"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/50 p-5">
              <div>
                <p className="font-bold text-sm text-foreground">Hide mature content</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Filter adult titles out of search results and recommendations on this browser.
                </p>
              </div>
              <Toggle
                active={prefs.hideMature}
                onToggle={() =>
                  updatePrefs(
                    { hideMature: !prefs.hideMature },
                    prefs.hideMature ? 'Mature content will be shown.' : 'Mature content hidden.'
                  )
                }
                label="Hide mature content"
              />
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card/50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-sm text-foreground">Continue Watching</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {session
                    ? `${progressCount} title${progressCount === 1 ? '' : 's'} stored on your account.`
                    : 'Sign in to sync continue watching.'}
                </p>
              </div>
              <button
                type="button"
                disabled={!session || progressCount === 0}
                onClick={handleClearProgress}
                className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95 ${
                  session && progressCount > 0
                    ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                    : 'cursor-not-allowed border-border text-muted-foreground opacity-50'
                }`}
              >
                <Trash2 size={14} className="mr-1.5 inline" />
                Clear
              </button>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card/50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-sm text-foreground">My List (Watchlist)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {session
                    ? `${watchlistCount} title${watchlistCount === 1 ? '' : 's'} saved.`
                    : 'Sign in to build your list.'}
                </p>
              </div>
              <Link
                href="/my-list"
                className="rounded-xl border border-border px-5 py-2 text-center text-xs font-bold uppercase tracking-wider transition hover:border-accent hover:bg-accent/10 active:scale-95"
              >
                Open
              </Link>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-destructive/30 bg-card/50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-sm text-foreground">Reset All Preferences</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Clears your continue watching history and resets every setting on this page to defaults.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-destructive/40 px-5 py-2 text-xs font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10 active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Help & Policies Section */}
        <section id="help" className="scroll-mt-24 py-8">
          <SectionHeader
            title="Help, Policies & Community"
            description="Access legal documentation, contact channels, and platform guides."
          />
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[
              ['About 7MEDIA', '/about'],
              ['Help & FAQ Hub', '/faq'],
              ['Contact & Support', '/contact'],
              ['Terms of Service', '/terms'],
              ['Privacy Policy', '/privacy'],
              ['DMCA Guidelines', '/dmca'],
              ['Badges & Rewards', '/badges'],
              ['Watch History', '/history'],
              ['Watch Party Lounge', '/party'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-2xl border border-border bg-card/50 p-4 text-xs font-bold uppercase tracking-wider transition hover:border-accent hover:bg-accent/5 active:scale-95 shadow-sm"
              >
                <span>{label}</span>
                <ChevronDown size={16} className="-rotate-90 text-accent" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
