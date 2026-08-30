'use client'

import Link from 'next/link'
import {
  ArrowUp,
  ShieldCheck,
  Palette,
  Gauge,
  Languages,
  HelpCircle,
  MessageCircle,
  Sparkles,
  Film,
  Tv,
  Calendar,
  Users,
  Trophy,
  History,
  Bookmark,
  Scale,
  FileText,
  Mail,
  Zap,
  Globe,
  Radio
} from 'lucide-react'
import { Logo } from './logo'
import { useI18n } from '@/lib/i18n/context'

export function Footer() {
  const { t } = useI18n()

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="mt-20 px-4 pb-8 md:px-8 lg:px-12 select-none">
      <div className="max-w-[1880px] mx-auto bg-card/70 border border-border/80 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-2xl flex flex-col gap-10">
        
        {/* Brand & System Status Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-border/60">
          <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
            <Logo size="lg" href="/" />
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              The next-generation cinematic &amp; anime streaming discovery ecosystem. Fast, visually breathtaking, and 100% legal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Operational Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>

            {/* Version Pill */}
            <span className="rounded-full bg-zinc-900 border border-white/10 px-3 py-1.5 text-[11px] font-mono text-zinc-400 font-bold">
              v2.4 PWA
            </span>
          </div>
        </div>

        {/* 5 Categorized Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-left">
          
          {/* 1. Media Hub */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5">
              <Film size={14} className="text-primary" /> Media Hub
            </p>
            <Link href="/movies" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('movies')}
            </Link>
            <Link href="/series" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('series')}
            </Link>
            <Link href="/anime" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('anime')}
            </Link>
            <Link href="/calendar" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('calendar')} (Tokyo Live)
            </Link>
            <Link href="/party" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              Watch Party Lounge
            </Link>
          </div>

          {/* 2. Cinephile Profile */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-400" /> User Zone
            </p>
            <Link href="/my-list" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('myList')}
            </Link>
            <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('history')}
            </Link>
            <Link href="/badges" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              Badges &amp; XP Rewards
            </Link>
            <Link href="/sign-in" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('signIn')} / Register
            </Link>
          </div>

          {/* 3. Site Controls */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5">
              <Palette size={14} className="text-cyan-400" /> Preferences
            </p>
            <Link href="/settings#appearance" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('appearance')} &amp; Themes
            </Link>
            <Link href="/settings#performance" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('performance')} &amp; Quality
            </Link>
            <Link href="/settings#language" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('language')} (25 Locales)
            </Link>
            <Link href="/settings#privacy" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('privacy')} &amp; Storage
            </Link>
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              All Controls
            </Link>
          </div>

          {/* 4. Legal & Compliance */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5">
              <Scale size={14} className="text-emerald-400" /> Legal &amp; Policy
            </p>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              Privacy Policy
            </Link>
            <Link href="/dmca" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              DMCA Takedown
            </Link>
            <Link href="/faq#legal" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              Legal Disclaimer
            </Link>
          </div>

          {/* 5. Support & Community */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5">
              <HelpCircle size={14} className="text-purple-400" /> Support
            </p>
            <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              About 7MEDIA
            </Link>
            <Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              {t('helpFaq')}
            </Link>
            <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all">
              Contact &amp; Support
            </Link>
          </div>
        </div>

        {/* Bottom Bar with Attributions & Scroll to Top */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold">&copy; {new Date().getFullYear()} 7MEDIA Inc.</span>
            <span className="text-muted-foreground/40">•</span>
            <span>Does not host media files</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-zinc-300 font-medium">TMDB &amp; AniList Open Data</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border text-foreground text-xs font-bold transition-all touch-manipulation active:scale-95 shadow-sm cursor-pointer"
          >
            <ArrowUp size={14} />
            <span>{t('backToTop')}</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
