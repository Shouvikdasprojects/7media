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

        {/* Creator & Lead Architect Section */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/60 to-primary/5 p-8 sm:p-10 mb-12 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar / Profile Graphic */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-primary via-rose-500 to-amber-400 p-1 shadow-[0_0_30px_rgba(164,19,60,0.35)]">
                <div className="w-full h-full rounded-[22px] bg-zinc-950 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-amber-200 font-display">
                    SD
                  </span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                    Architect
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg">
                Lead Dev
              </div>
            </div>

            {/* Details & Socials */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold uppercase tracking-wider">
                <Sparkles size={12} /> Meet the Creator &amp; Lead Architect
              </div>

              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground font-display">
                Shouvik Das
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Full-Stack Engineer, UI/UX Designer &amp; Cinephile. Conceived, architected, and engineered the complete <strong>7MEDIA</strong> ecosystem from the ground up—unifying high-speed TMDB &amp; AniList data streams, real-time MongoDB Atlas chat rooms, synchronized watch parties, and hardened multi-factor security.
              </p>

              {/* Action & Social Channels */}
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                {/* Portfolio */}
                <a
                  href="https://shouvikdasportfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/25 cursor-pointer"
                >
                  <Globe size={14} />
                  <span>Portfolio Website</span>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com/Shouvikdasprojects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </a>

                {/* Twitter / X */}
                <a
                  href="https://x.com/shouvikdas155"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  <span className="font-mono font-bold text-xs">𝕏</span>
                  <span>Twitter / X</span>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/shouvik_das_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-pink-400" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>

                {/* Linktree */}
                <a
                  href="https://heylink.me/ShouvikDas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-emerald-400 font-bold">🌲</span>
                  <span>Linktree</span>
                </a>
              </div>
            </div>
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
