'use client'

import Link from 'next/link'
import { ArrowUp, ShieldCheck, Palette, Gauge, Languages, HelpCircle, MessageCircle } from 'lucide-react'
import { Logo } from './logo'
import { useI18n } from '@/lib/i18n/context'

export function Footer() {
  const { t } = useI18n()
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-16 px-4 pb-8 md:px-8 lg:px-12">
      <div className="max-w-[1880px] mx-auto bg-card/80 border border-border/80 rounded-3xl p-8 md:p-12 shadow-xl backdrop-blur-xl flex flex-col items-center gap-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center select-none">
          <Logo size="lg" href="/" />
          <p className="text-xs text-muted-foreground max-w-md">
            The next-generation streaming discovery platform. Fast, beautiful, and legal.
          </p>
        </div>

        {/* Categorized Navigation Columns */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-6 text-center sm:text-left border-y border-border/60 py-8">
          
          {/* 1. Discover */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display">
              Discover
            </p>
            <Link href="/movies" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('movies')}
            </Link>
            <Link href="/series" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('series')}
            </Link>
            <Link href="/anime" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('anime')}
            </Link>
            <Link href="/my-list" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('myList')}
            </Link>
            <Link href="/history" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('history')}
            </Link>
          </div>

          {/* 2. Preferences & Settings */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display">
              Preferences
            </p>
            <Link href="/settings#appearance" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('appearance')}
            </Link>
            <Link href="/settings#performance" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('performance')}
            </Link>
            <Link href="/settings#language" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('language')}
            </Link>
            <Link href="/settings#privacy" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              All Site Controls
            </Link>
          </div>

          {/* 3. Help & Legal */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display">
              Help &amp; Legal
            </p>
            <Link href="/faq" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('helpFaq')}
            </Link>
            <Link href="/faq#content" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Content &amp; Sources
            </Link>
            <Link href="/faq#playback" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Playback Guidelines
            </Link>
            <Link href="/faq#legal" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Legal Disclaimer
            </Link>
            <Link href="/faq#terms" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link href="/faq#dmca" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              DMCA Policy
            </Link>
          </div>

          {/* 4. Community & Support */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-foreground font-display">
              Community
            </p>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center justify-center sm:justify-start gap-1.5"
            >
              <MessageCircle size={14} /> {t('discord')}
            </a>
            <a
              href="mailto:support@7media.cc"
              className="text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              Support Contact
            </a>
            <Link href="/sign-in" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t('signIn')}
            </Link>
            <Link href="/sign-up" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Create Account
            </Link>
          </div>
        </div>

        {/* Bottom Bar with Back to Top */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>&copy; {new Date().getFullYear()} 7MEDIA</span>
            <span className="text-accent">•</span>
            <span>Does not host video files</span>
            <span className="text-accent">•</span>
            <span>TMDB &amp; AniList Powered</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/80 border border-border text-foreground text-xs font-bold hover:bg-secondary hover:border-primary/50 transition-all touch-manipulation active:scale-95"
          >
            <ArrowUp size={14} />
            {t('backToTop')}
          </button>
        </div>
      </div>
    </footer>
  )
}
