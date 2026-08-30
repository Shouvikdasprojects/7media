'use client'

import Link from 'next/link'
import {
  ArrowUp,
  ShieldCheck,
  Palette,
  HelpCircle,
  MessageSquare,
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
  Globe2,
  Crown,
  Heart,
  DownloadCloud,
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
    <footer className="mt-20 px-3 sm:px-6 lg:px-10 pb-10 select-none">
      <div className="max-w-[1880px] mx-auto rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 via-card/60 to-background/90 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl flex flex-col gap-10">
        
        {/* Brand, Tagline & Live Status Header */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 pb-8 border-b border-border/60">
          <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left max-w-xl">
            <Logo size="lg" href="/" />
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The premier next-generation cinema &amp; anime discovery ecosystem. Streamlined, visually breathtaking, powered by real-time community engagement and open metadata APIs.
            </p>

            {/* Feature Pills */}
            <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
                <Zap size={12} /> Ultra-Fast CDN
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                <Crown size={12} /> Verified Community
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold">
                <Globe2 size={12} /> 25+ Locales
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* Live Operational Status Badge */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational</span>
            </div>

            {/* Official Support Email Pill */}
            <a
              href="mailto:7media.support@gmail.com"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Mail size={14} className="text-primary" />
              <span>7media.support@gmail.com</span>
            </a>
          </div>
        </div>

        {/* 5 Categorized Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-left">
          
          {/* Column 1: Entertainment Hub */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Film size={14} className="text-primary" /> Entertainment Hub
            </p>
            <Link href="/movies" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('movies')} (4K &amp; HD)
            </Link>
            <Link href="/series" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('series')} &amp; Seasons
            </Link>
            <Link href="/anime" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('anime')} Portal (AniList)
            </Link>
            <Link href="/calendar" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('calendar')} (Tokyo Schedule)
            </Link>
            <Link href="/party" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Watch Party Lounge
            </Link>
          </div>

          {/* Column 2: Community & Social */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5 border-b border-border/40 pb-2">
              <MessageSquare size={14} className="text-amber-400" /> Community &amp; Chat
            </p>
            <Link href="/chat" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-1">
              <span>Global Cinema Lounge</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black">LIVE</span>
            </Link>
            <Link href="/chat" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              1-on-1 Direct Support
            </Link>
            <Link href="/my-list" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('myList')}
            </Link>
            <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('history')}
            </Link>
            <Link href="/badges" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Badges &amp; XP Rewards
            </Link>
          </div>

          {/* Column 3: Preferences & UX */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Palette size={14} className="text-cyan-400" /> Preferences
            </p>
            <Link href="/settings#appearance" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('appearance')} &amp; Themes
            </Link>
            <Link href="/settings#performance" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('performance')} &amp; Quality
            </Link>
            <Link href="/settings#language" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('language')} (25 Locales)
            </Link>
            <Link href="/settings#privacy" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('privacy')} &amp; Storage
            </Link>
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              All Preferences
            </Link>
          </div>

          {/* Column 4: Help & Support */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5 border-b border-border/40 pb-2">
              <HelpCircle size={14} className="text-purple-400" /> Support Desk
            </p>
            <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Contact Desk &amp; Inquiry
            </Link>
            <Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              {t('helpFaq')} &amp; Guides
            </Link>
            <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              About 7MEDIA
            </Link>
            <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Cinephile Profile &amp; 2FA
            </Link>
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-1 text-amber-400/90 font-bold">
              <Crown size={12} /> Admin Portal
            </Link>
          </div>

          {/* Column 5: Legal & Policy */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Scale size={14} className="text-emerald-400" /> Legal &amp; Policy
            </p>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Privacy Policy
            </Link>
            <Link href="/dmca" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              DMCA Takedown Protocol
            </Link>
            <Link href="/faq#legal" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Legal Disclaimer
            </Link>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Open Data Attribution & Scroll to Top */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-foreground">&copy; {new Date().getFullYear()} 7MEDIA Inc.</span>
            <span className="text-muted-foreground/40">•</span>
            <span>Made with passion for cinephiles</span>
            <span className="text-muted-foreground/40">•</span>
            <span>Does not host media on private servers</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-zinc-300 font-medium">Powered by TMDB &amp; AniList APIs</span>
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
