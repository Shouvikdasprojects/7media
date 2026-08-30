'use client'

import { use, useState, Suspense } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MediaCard } from '@/components/media-card'
import { TV_GENRES, LANGUAGES } from '@/lib/tmdb/constants'
import { useDiscoverShows } from '@/lib/tmdb/hooks'
import { Tv, ChevronDown, ArrowLeft, Sparkles, Star } from 'lucide-react'

const TV_GENRE_DETAILS: Record<number, { icon: string; desc: string }> = {
  10759: { icon: '💥', desc: 'Action-packed series, heroic exploits, and epic adventure sagas across seasons.' },
  16: { icon: '🎨', desc: 'Animated television series, anime crossovers, and animated adventures.' },
  35: { icon: '😂', desc: 'Hilarious sitcoms, witty workplace comedies, and feel-good series.' },
  80: { icon: '🕵️', desc: 'Gripping police procedurals, detective series, cartel sagas, and true crime dramas.' },
  99: { icon: '📹', desc: 'Fascinating docuseries, nature chronicles, and real historical investigations.' },
  18: { icon: '🎭', desc: 'Prestige drama series, intense character conflicts, and award-winning storytelling.' },
  10751: { icon: '👨‍👩‍👧‍👦', desc: 'Family-friendly shows full of heart, laughter, and fun for all ages.' },
  10762: { icon: '🧸', desc: 'Fun, educational, and adventurous animated and live-action shows for kids.' },
  9648: { icon: '🔍', desc: 'Mind-bending mystery thrillers, plot twists, and investigative series.' },
  10763: { icon: '📰', desc: 'Current events, investigative reporting, and international news specials.' },
  10764: { icon: '⭐', desc: 'Competition shows, unscripted reality series, and lifestyle entertainment.' },
  10765: { icon: '🚀', desc: 'Sci-fi epics, space odysseys, magical fantasy lore, and supernatural series.' },
  10766: { icon: '🌹', desc: 'Long-running daily soap operas, intense romance, and family rivalries.' },
  10767: { icon: '🎙️', desc: 'Celebrity talk shows, late-night entertainment, and interview programs.' },
  10768: { icon: '⚔️', desc: 'Political intrigue, government conspiracies, wartime struggles, and power battles.' },
  37: { icon: '🤠', desc: 'Old West frontier dramas, cowboy showdowns, and ranching sagas.' },
}

function SeriesGenreContent({ id }: { id: string }) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [language, setLanguage] = useState('')

  // Resolve genre ID or slug
  const matchedGenre =
    TV_GENRES.find((g) => String(g.id) === id) ||
    TV_GENRES.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === id.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
    { id: parseInt(id) || 10759, name: 'Series' }

  const genreId = matchedGenre.id
  const genreName = matchedGenre.name
  const genreMeta = TV_GENRE_DETAILS[genreId] || { icon: '📺', desc: `Explore all popular, trending, and top-rated ${genreName} TV series.` }

  const { data, isLoading } = useDiscoverShows({
    page,
    genre: String(genreId),
    language: language || undefined,
    sortBy,
    minVotes: sortBy?.startsWith('vote_average') ? 100 : undefined,
  })

  const shows = data?.results || []
  const totalPages = Math.min(data?.total_pages || 1, 500)
  const totalResults = data?.total_results || 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-4 pb-16 pt-24 md:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1880px] flex-col gap-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Link
              href="/series"
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Series
            </Link>
            <span>/</span>
            <span className="font-bold text-accent">{genreName}</span>
          </div>

          {/* Genre Banner Header */}
          <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-secondary/40 to-card p-6 md:p-10 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-3xl md:text-4xl select-none">{genreMeta.icon}</span>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-foreground font-display md:text-5xl">
                    {genreName} Series
                  </h1>
                </div>
                <p className="max-w-2xl text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {genreMeta.desc}
                </p>
              </div>

              {totalResults > 0 && (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-card border border-border/80 px-4 py-2.5 shadow-sm">
                  <Sparkles size={16} className="text-accent" />
                  <span className="text-xs md:text-sm font-bold text-foreground">
                    {totalResults.toLocaleString()} Series Available
                  </span>
                </div>
              )}
            </div>

            {/* Quick other genre pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <span className="self-center text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Other Genres:
              </span>
              {TV_GENRES.filter((g) => g.id !== genreId)
                .slice(0, 10)
                .map((g) => (
                  <Link
                    key={g.id}
                    href={`/series/genre/${g.id}`}
                    className="rounded-xl bg-secondary/80 border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent/15 hover:text-accent hover:border-accent/40 transition-all active:scale-95"
                  >
                    {TV_GENRE_DETAILS[g.id]?.icon || '📺'} {g.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
                  className="h-10 appearance-none rounded-xl border border-border bg-secondary/70 pl-3.5 pr-9 text-xs font-bold text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  aria-label="Sort Series"
                >
                  <option value="popularity.desc">Most Popular</option>
                  <option value="vote_average.desc">Top Rated (IMDb)</option>
                  <option value="first_air_date.desc">First Air Date (Newest)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              </div>

              {/* Language selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value); setPage(1) }}
                  className="h-10 appearance-none rounded-xl border border-border bg-secondary/70 pl-3.5 pr-9 text-xs font-bold text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  aria-label="Language filter"
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.slice(0, 15).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              </div>

              {(language || sortBy !== 'popularity.desc') && (
                <button
                  onClick={() => { setLanguage(''); setSortBy('popularity.desc'); setPage(1) }}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-muted-foreground">
              Page {page} of {totalPages}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 md:gap-4">
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : shows.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 md:gap-4">
              {shows.map((show) => (
                <MediaCard key={show.id} item={show} mediaType="tv" />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-muted-foreground">
              <Tv size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold text-foreground">No {genreName} series found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try selecting a different language or reset filters.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 border-t border-border pt-6">
              <button
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={page <= 1}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-muted-foreground">
                Page <strong className="text-foreground">{page}</strong> of {totalPages}
              </span>
              <button
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={page >= totalPages}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SeriesGenrePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SeriesGenreContent id={id} />
    </Suspense>
  )
}
