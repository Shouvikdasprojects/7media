'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  Download,
  User,
  LogOut,
  X,
  Settings,
  Palette,
  Languages,
  Bell,
  MessageCircle,
  CircleHelp,
  ChevronDown,
  Check,
  Menu,
  Sparkles,
  Calendar,
  Users,
  Trophy,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession, signOut } from '@/lib/auth-client'
import { useI18n } from '@/lib/i18n/context'
import { verifyIsAdmin } from '@/app/actions/admin'
import { Logo } from './logo'

const SearchModal = dynamic(() => import('./search-modal').then((m) => m.SearchModal), { ssr: false })
const NotificationsModal = dynamic(() => import('./notifications-modal').then((m) => m.NotificationsModal), { ssr: false })
const PwaInstallBanner = dynamic(() => import('./pwa-install-banner').then((m) => m.PwaInstallBanner), { ssr: false })
const MoodRouletteModal = dynamic(() => import('./mood-roulette-modal').then((m) => m.MoodRouletteModal), { ssr: false })
const DownloadModal = dynamic(() => import('./download-modal').then((m) => m.DownloadModal), { ssr: false })

const AVATAR_MAP: Record<string, string> = {
  crimson: '🎬',
  anime: '⚡',
  cyber: '🌌',
  director: '🎥',
  shadow: '🕶️',
  star: '⭐',
  retro: '📼',
  popcorn: '🍿',
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [theme, setTheme] = useState<string>('Dark')
  const [quality, setQuality] = useState<'HD' | 'Default' | 'Performance'>('Default')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      verifyIsAdmin().then((res) => setIsAdminUser(Boolean(res?.isAdmin)))
    } else {
      setIsAdminUser(false)
    }
  }, [session?.user])

  // Real-time synchronization of Avatar & Theme across profile, settings and navbar
  useEffect(() => {
    const readAvatar = () => {
      try {
        const stored = localStorage.getItem('7media_avatar')
        if (stored) setAvatar(stored)
        else if (session?.user?.image) setAvatar(session.user.image)
      } catch {}
    }

    readAvatar()

    const handleAvatarChange = (e: any) => {
      if (e?.detail) setAvatar(e.detail)
      else readAvatar()
    }

    window.addEventListener('7media-avatar-changed', handleAvatarChange)
    window.addEventListener('storage', readAvatar)

    return () => {
      window.removeEventListener('7media-avatar-changed', handleAvatarChange)
      window.removeEventListener('storage', readAvatar)
    }
  }, [session?.user?.image])

  // Real-time synchronization of Theme across settings and navbar
  useEffect(() => {
    const readTheme = () => {
      try {
        const savedCookie = document.cookie.match(/(?:^|; )7media-theme=([^;]+)/)?.[1]
        const savedStorage = localStorage.getItem('7media-theme')
        const currentTheme = savedStorage || (savedCookie ? decodeURIComponent(savedCookie) : 'Dark')
        if (currentTheme) setTheme(currentTheme)
      } catch {}
    }

    readTheme()

    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        setTheme(e.detail)
      } else {
        readTheme()
      }
    }

    window.addEventListener('7media-theme-changed', handleThemeChange)
    window.addEventListener('storage', readTheme)

    return () => {
      window.removeEventListener('7media-theme-changed', handleThemeChange)
      window.removeEventListener('storage', readTheme)
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false)
        setSearchOpen(false)
        setDownloadOpen(false)
        setRouletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const navItems = [
    { label: t('home'), href: '/' },
    { label: t('movies'), href: '/movies' },
    { label: t('series'), href: '/series' },
    { label: t('anime'), href: '/anime' },
    { label: 'Calendar', href: '/calendar' },
    { label: 'Party', href: '/party' },
    { label: t('myList'), href: '/my-list' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const handleLogout = async () => {
    await signOut()
    router.refresh()
  }

  const toggleLanguage = () => {
    const nextLang = language === 'English' ? 'Bengali' : language === 'Bengali' ? 'Hindi' : language === 'Hindi' ? 'Spanish' : 'English'
    setLanguage(nextLang)
    setNotice(`Language switched to ${nextLang}`)
  }

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <MoodRouletteModal isOpen={rouletteOpen} onClose={() => setRouletteOpen(false)} />
      <PwaInstallBanner />

      {/* Floating Notice Toast */}
      {notice && (
        <div
          className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3"
          role="status"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Download PWA Modal */}
      {downloadOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/95 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">7MEDIA PWA</p>
                <h2 id="download-title" className="mt-1 text-2xl font-black text-foreground font-display uppercase tracking-tight">
                  {t('downloadApp')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDownloadOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Close download dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className="leading-relaxed text-sm text-muted-foreground">
              7MEDIA is an ultra-fast Progressive Web App (PWA). You can add it directly to your Home Screen from your browser menu without any app store download.
            </p>
            <button
              type="button"
              onClick={() => setDownloadOpen(false)}
              className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 active:scale-95"
            >
              Got it, continue browsing
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP NAVBAR: APPLE DYNAMIC ISLAND BALANCED PILL                        */}
      {/* ========================================================================= */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden md:block max-w-fit pointer-events-auto">
        <div className="flex items-center gap-3 lg:gap-5 bg-black/85 border border-white/15 rounded-full px-5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:border-primary/50 hover:shadow-[0_16px_45px_rgba(229,9,20,0.22)]">
          
          {/* Logo Badge */}
          <Logo size="md" href="/" className="pl-1" />

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-white/15" aria-hidden="true" />

          {/* Dynamic Island Navigation Pills */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'relative px-3.5 py-1.5 text-xs lg:text-sm font-semibold rounded-full transition-all duration-200 ease-out select-none touch-manipulation active:scale-95 ' +
                    (active
                      ? 'bg-white/20 text-white font-bold shadow-inner ring-1 ring-white/25 backdrop-blur-md'
                      : 'text-white/75 hover:text-white hover:bg-white/10')
                  }
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-accent animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Surprise Me / Roulette Action Pill */}
          <button
            type="button"
            onClick={() => setRouletteOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-all shadow-[0_0_15px_rgba(229,9,20,0.25)] active:scale-95 select-none"
            title="Surprise Me (Mood Roulette)"
          >
            <Sparkles size={14} className="animate-spin" />
            <span className="hidden lg:inline">Surprise Me</span>
          </button>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-white/15" aria-hidden="true" />

          {/* Right Action Icons (Capsule buttons) */}
          <div className="flex items-center gap-1.5 pr-1">
            {/* Download Icon */}
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="p-2 text-white/75 hover:text-white rounded-full hover:bg-white/10 transition-all touch-manipulation active:scale-90 select-none"
              aria-label={t('downloadApp')}
              title={t('downloadApp')}
            >
              <Download size={17} />
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative p-2 text-white/75 hover:text-white rounded-full hover:bg-white/10 transition-all touch-manipulation active:scale-90 select-none"
              aria-label="Notifications"
              title="Notifications & Airing Alerts"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-ping" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>

            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-white/75 hover:text-white rounded-full hover:bg-white/10 transition-all touch-manipulation active:scale-90 select-none"
              aria-label={t('search')}
              title={t('search')}
            >
              <Search size={17} />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className={
                  'flex items-center gap-1.5 rounded-full p-1.5 pl-2 pr-2 text-xs font-bold transition-all touch-manipulation active:scale-95 ' +
                  (accountOpen
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white')
                }
                aria-label="Account menu"
                aria-expanded={accountOpen}
              >
                {avatar && avatar.startsWith('http') ? (
                  <img src={avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-white/40" />
                ) : avatar && AVATAR_MAP[avatar] ? (
                  <span className="text-sm">{AVATAR_MAP[avatar]}</span>
                ) : (
                  <User size={17} />
                )}
                <ChevronDown
                  size={13}
                  className={'transition-transform duration-200 ' + (accountOpen ? 'rotate-180' : '')}
                />
              </button>

              {/* Account Dropdown Modal with Badges & Settings */}
              <div
                className={
                  'absolute right-0 top-12 z-50 w-64 origin-top-right overflow-hidden rounded-3xl border border-white/15 bg-black/90 p-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-200 ease-out ' +
                  (accountOpen
                    ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none -translate-y-2 scale-95 opacity-0')
                }
                aria-hidden={!accountOpen}
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 border-b border-white/10 px-3.5 py-3">
                  <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
                    {avatar && avatar.startsWith('http') ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : avatar && AVATAR_MAP[avatar] ? (
                      <span className="text-lg">{AVATAR_MAP[avatar]}</span>
                    ) : (
                      <User size={18} className="text-white/80" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {session?.user?.name ?? 'Guest profile'}
                    </p>
                    <p className="truncate text-[10px] text-white/50">{session?.user?.email ?? 'Sign in to sync watchlist'}</p>
                  </div>
                </div>

                {/* Profile Navigation Links */}
                <div className="py-1.5 space-y-0.5">
                  {isAdminUser && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition shadow-sm mb-1"
                    >
                      <ShieldCheck size={15} /> <span>Admin Panel</span>
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition"
                  >
                    <User size={15} /> <span>My Profile</span>
                  </Link>

                  <Link
                    href="/badges"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-yellow-400 hover:bg-yellow-500/10 transition"
                  >
                    <Trophy size={15} /> <span>Badges &amp; Rewards</span>
                  </Link>

                  <Link
                    href="/party"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition"
                  >
                    <Users size={15} /> <span>Watch Party Room</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Settings size={15} /> {t('settings')}
                  </Link>

                  <Link
                    href="/settings#appearance"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Palette size={15} /> {t('themes')}
                    </span>
                    <span className="text-[10px] text-white/50">{theme}</span>
                  </Link>

                  <Link
                    href="/settings#language"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Languages size={15} /> {t('language')}
                    </span>
                    <span className="text-[10px] font-bold text-accent">{language}</span>
                  </Link>
                </div>

                {/* Account Controls & FAQ */}
                <div className="border-t border-white/10 pt-1">
                  {session?.user ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-white/10 hover:text-red-300"
                    >
                      <LogOut size={15} /> {t('signOut')}
                    </button>
                  ) : (
                    <Link
                      href="/sign-in"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      <User size={15} /> {t('signIn')}
                    </Link>
                  )}

                  <Link
                    href="/faq"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <CircleHelp size={15} /> {t('helpFaq')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE NAVBAR                                                             */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRouletteOpen(true)}
              className="p-2 text-accent hover:bg-accent/10 rounded-full transition-all"
              aria-label="Surprise Me"
            >
              <Sparkles size={18} />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all"
              aria-label="Open search"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-all"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Horizontal Mobile Pills */}
        <div className="border-t border-white/10 bg-black/80 px-3 py-2">
          <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto scrollbar-hide touch-pan-x">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={
                  'shrink-0 rounded-full px-3.5 py-1.5 text-center text-xs font-bold transition-all active:scale-95 ' +
                  (isActive(item.href)
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white')
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-black/95 p-4 animate-in fade-in">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={
                    'px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all ' +
                    (isActive(item.href)
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white')
                  }
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-white/10"
                >
                  {avatar && avatar.startsWith('http') ? (
                    <img src={avatar} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
                  ) : avatar && AVATAR_MAP[avatar] ? (
                    <span>{AVATAR_MAP[avatar]}</span>
                  ) : (
                    <User size={15} />
                  )}
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/badges"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-yellow-400 hover:bg-white/10"
                >
                  <Trophy size={15} /> Badges
                </Link>
                <Link
                  href="/party"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-cyan-400 hover:bg-white/10"
                >
                  <Users size={15} /> Watch Party
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Settings size={15} /> {t('settings')}
                </Link>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Languages size={15} /> {language}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS & DIALOGS                                                   */}
      {/* ========================================================================= */}
      {searchOpen && (
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
      {notifOpen && (
        <NotificationsModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      )}
      {rouletteOpen && (
        <MoodRouletteModal isOpen={rouletteOpen} onClose={() => setRouletteOpen(false)} />
      )}
      {downloadOpen && (
        <DownloadModal isOpen={downloadOpen} onClose={() => setDownloadOpen(false)} />
      )}
    </>
  )
}
