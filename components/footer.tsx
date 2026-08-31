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

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Operational Status Badge */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational</span>
            </div>
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
            <Link href="/disclaimer" className="text-xs text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
              Legal Disclaimer
            </Link>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Creator Attribution, Socials & Scroll to Top */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-semibold text-foreground">&copy; {new Date().getFullYear()} 7MEDIA Inc.</span>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <span>
              Architected &amp; Built with <span className="text-rose-500">❤️</span> by{' '}
              <a
                href="https://shouvikdasportfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground hover:text-primary transition underline underline-offset-4 decoration-primary/40"
              >
                Shouvik Das
              </a>
            </span>
          </div>

          {/* Creator Social Channels */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a
              href="https://shouvikdasportfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground hover:text-primary transition"
              title="Shouvik Das Portfolio"
            >
              <Globe2 size={15} />
            </a>
            <a
              href="https://github.com/Shouvikdasprojects"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground hover:text-primary transition"
              title="GitHub Profile"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://x.com/shouvikdas155"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground hover:text-primary transition font-mono font-bold text-xs"
              title="Twitter / X"
            >
              𝕏
            </a>
            <a
              href="https://www.instagram.com/shouvik_das_official"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground hover:text-pink-400 transition"
              title="Instagram"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://heylink.me/ShouvikDas/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-emerald-400 font-bold transition"
              title="Linktree"
            >
              🌲
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowUp size={14} />
              <span>{t('backToTop')}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
