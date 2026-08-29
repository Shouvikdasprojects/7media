import Link from 'next/link'
import { ArrowLeft, ChevronDown, HelpCircle, Shield, FileText, Film, Play, MessageCircle } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const faqs = [
  {
    id: 'general',
    question: 'What is 7MEDIA?',
    answer: '7MEDIA is an ultra-fast modern media discovery, trailer playback, and watchlist tracker app for movies, TV series, K-Dramas, and Japanese Anime powered by TMDB and AniList APIs.',
    category: 'General',
  },
  {
    id: 'content',
    question: 'Does 7MEDIA host video files or streams?',
    answer: 'No. 7MEDIA does not host, upload, scrape, or provide unauthorized video streaming. All metadata, artwork, and trailers are legally indexed from TMDB and AniList public APIs with official watch provider availability (Netflix, Disney+, Prime Video, Apple TV, etc.).',
    category: 'Content & Licensing',
  },
  {
    id: 'playback',
    question: 'How does trailer playback and stream info work?',
    answer: '7MEDIA embeds official YouTube high-definition trailers and links to legitimate subscription streaming services where titles can be officially watched in your region.',
    category: 'Playback & Features',
  },
  {
    id: 'watchlist',
    question: 'How do Watchlist (My List) and Watch History work?',
    answer: 'You can save unlimited titles to your personal Watchlist and track your viewing progress. Your data is synced securely to your account or saved locally in your browser when browsing as a guest.',
    category: 'Account & Sync',
  },
  {
    id: 'legal',
    question: 'Legal Disclaimer & Information Source',
    answer: '7MEDIA is a media cataloging and discovery application. All trademarks, posters, and media metadata belong to their respective copyright holders (TMDB, AniList, production studios).',
    category: 'Legal',
  },
  {
    id: 'terms',
    question: 'Terms of Service & Usage Policy',
    answer: 'By using 7MEDIA, you agree to use the service for personal, non-commercial entertainment and media discovery purposes.',
    category: 'Terms',
  },
  {
    id: 'dmca',
    question: 'DMCA & Copyright Compliance',
    answer: '7MEDIA strictly respects intellectual property rights. If you believe any content or metadata infringes upon your copyright, please reach out to legal@7media.cc with your takedown notice and it will be processed promptly.',
    category: 'DMCA',
  },
]

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-4 pb-20 pt-28 text-foreground md:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back home
          </Link>

          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">Help Center</p>
            <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl uppercase">
              Help &amp; FAQ
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Frequently asked questions, legal policies, streaming info, and guidelines.
            </p>
          </div>

          {/* Quick Anchor Navigation */}
          <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-border bg-card/60 p-3">
            {[
              ['Content & Streaming', '#content'],
              ['Playback Issues', '#playback'],
              ['Legal & Disclaimer', '#legal'],
              ['Terms of Service', '#terms'],
              ['DMCA Policy', '#dmca'],
            ].map(([label, hash]) => (
              <a
                key={label}
                href={hash}
                className="rounded-xl bg-secondary/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-accent/15 hover:text-accent hover:border-accent/40 transition-all active:scale-95"
              >
                {label}
              </a>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-4">
            {faqs.map((faq) => (
              <section
                key={faq.id}
                id={faq.id}
                className="scroll-mt-28 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm transition hover:border-accent/40"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                    {faq.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">{faq.question}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </section>
            ))}
          </div>

          {/* Community Card */}
          <div className="mt-12 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h3 className="text-xl font-bold text-foreground">Need more help or have suggestions?</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Join our Discord community or visit the site settings to configure preferences.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition hover:opacity-90 active:scale-95"
              >
                <MessageCircle size={16} /> Discord
              </a>
              <Link
                href="/settings"
                className="rounded-xl border border-border bg-secondary px-5 py-2.5 text-xs font-bold text-foreground hover:bg-card transition active:scale-95"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
