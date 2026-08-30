import Link from 'next/link'
import { ArrowLeft, Sparkles, Film, Zap, Heart, Globe, Database, ShieldCheck, Play, Award } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Logo } from '@/components/logo'

export const metadata = {
  title: 'About 7MEDIA · The Next-Gen Media Discovery Platform',
  description: 'Learn about 7MEDIA, our mission to build the fastest, ultra-modern cinema & anime discovery engine.',
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 pb-20 pt-28 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 sm:p-12 mb-12 shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent">
              <Sparkles size={16} />
              <span>Next-Gen Cinema Ecosystem</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
              Built for Cinephiles, by Cinephiles.
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              7MEDIA was created with a single vision: to replace cluttered, slow, ad-ridden streaming directories with an ultra-fast, visually breathtaking, and legal entertainment discovery platform.
            </p>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-bold text-foreground">Lightning Performance</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built with Next.js Turbopack, Tailwind CSS, and zero client bloat. Sub-50ms navigation and instant search.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="text-base font-bold text-foreground">Open Data Integration</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Powered by The Movie Database (TMDB) and AniList GraphQL APIs, offering over 1,000,000+ verified movie, series, and anime records.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-base font-bold text-foreground">Cinephile Leveling</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Watch history gamification, customized avatars, badges, and synchronized multi-peer Watch Party rooms.
            </p>
          </div>
        </div>

        {/* Tech Stack Statement */}
        <div className="p-8 rounded-3xl border border-border bg-card/60 space-y-4">
          <h2 className="text-lg font-bold text-foreground font-display uppercase tracking-tight">
            Our Open Data &amp; Engineering Philosophy
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            7MEDIA is designed with complete transparency and compliance. We do not operate illegal scraping or video file hosting. Instead, we empower users with official streaming availability, theatrical release schedules, original soundtracks, voice actor biographies, and official YouTube trailers.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/movies"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition hover:bg-primary/90 active:scale-95 shadow-md"
            >
              Explore Movies
            </Link>
            <Link
              href="/anime"
              className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs uppercase tracking-wider transition active:scale-95"
            >
              Explore Anime Hub
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
