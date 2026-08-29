'use client'

import { use, useState, Suspense } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MediaCard } from '@/components/media-card'
import { MOVIE_GENRES, LANGUAGES } from '@/lib/tmdb/constants'
import { useDiscoverMovies } from '@/lib/tmdb/hooks'
import { Film, ChevronDown, ArrowLeft, Sparkles, Star } from 'lucide-react'

const GENRE_DETAILS: Record<number, { icon: string; desc: string }> = {
  28: { icon: '💥', desc: 'High-octane action movies packed with thrilling stunts, chases, and adrenaline.' },
  12: { icon: '🗺️', desc: 'Epic journeys, explorations, and legendary quests into the uncharted and unknown.' },
  16: { icon: '🎨', desc: 'Captivating animated feature films from legendary studios around the world.' },
  35: { icon: '😂', desc: 'Laugh-out-loud comedies, satire, rom-coms, and heartwarming humor.' },
  80: { icon: '🕵️', desc: 'Gritty crime dramas, mobster epics, heist thrillers, and detective mysteries.' },
  99: { icon: '📹', desc: 'Eye-opening real-world documentaries and inspiring true stories.' },
  18: { icon: '🎭', desc: 'Deep emotional journeys, character studies, and gripping dramatic stories.' },
  10751: { icon: '👨‍👩‍👧‍👦', desc: 'Heartwarming family movies for kids, teens, and all generations to enjoy.' },
  14: { icon: '🧙', desc: 'Magical realms, mythical creatures, and otherworldly adventures.' },
  36: { icon: '📜', desc: 'Dramatizations of monumental historical events and legendary historical figures.' },
  27: { icon: '👻', desc: 'Spine-chilling horror movies, supernatural frights, and psychological terrors.' },
  10402: { icon: '🎵', desc: 'Electrifying musical films, concert features, and soundtrack-driven stories.' },
  9648: { icon: '🔍', desc: 'Twisted whodunits, mind-bending mysteries, and unsolved enigmas.' },
  10749: { icon: '💖', desc: 'Passionate romantic tales, love stories, and emotional bonds.' },
  878: { icon: '🚀', desc: 'Mind-expanding science fiction, future technology, space travel, and time warps.' },
  53: { icon: '⚡', desc: 'Nail-biting suspense thrillers, psychological mind games, and intense plots.' },
  10752: { icon: '⚔️', desc: 'Epic wartime chronicles, heroic battles, and historical military cinema.' },
  37: { icon: '🤠', desc: 'Classic and modern Western sagas across the frontier and old frontiers.' },
}

function MovieGenreContent({ id }: { id: string }) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [language, setLanguage] = useState('')

  // Resolve genre ID or slug
  const matchedGenre =
    MOVIE_GENRES.find((g) => String(g.id) === id) ||
    MOVIE_GENRES.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === id.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
    { id: parseInt(id) || 28, name: 'Movies' }

  const genreId = matchedGenre.id
  const genreName = matchedGenre.name
  const genreMeta = GENRE_DETAILS[genreId] || { icon: '🎬', desc: `Explore all popular, trending, and top-rated ${genreName} movies.` }

  const { data, isLoading } = useDiscoverMovies({
    page,
    genre: String(genreId),
    language: language || undefined,
    sortBy,
    minVotes: sortBy.startsWith('vote_average') ? 150 : undefined,
  })

  const movies = data?.results || []
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
              href="/movies"
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Movies
            </Link>
            <span>/</span>
            <span className="font-bold text-primary">{genreName}</span>
          </div>

          {/* Genre Banner Header */}
          <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-secondary/40 to-card p-6 md:p-10 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-3xl md:text-4xl select-none">{genreMeta.icon}</span>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-foreground font-display md:text-5xl">
                    {genreName} Movies
                  </h1>
                </div>
                <p className="max-w-2xl text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {genreMeta.desc}
                </p>
              </div>

              {totalResults > 0 && (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-card border border-border/80 px-4 py-2.5 shadow-sm">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-xs md:text-sm font-bold text-foreground">
                    {totalResults.toLocaleString()} Movies Available
                  </span>
                </div>
              )}
            </div>

            {/* Quick other genre pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <span className="self-center text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Other Genres:
              </span>
              {MOVIE_GENRES.filter((g) => g.id !== genreId)
                .slice(0, 10)
                .map((g) => (
                  <Link
                    key={g.id}
                    href={`/movies/genre/${g.id}`}
                    className="rounded-xl bg-secondary/80 border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-primary/15 hover:text-primary hover:border-primary/40 transition-all active:scale-95"
                  >
                    {GENRE_DETAILS[g.id]?.icon || '🎬'} {g.name}
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
                  className="h-10 appearance-none rounded-xl border border-border bg-secondary/70 pl-3.5 pr-9 text-xs font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  aria-label="Sort Movies"
                >
                  <option value="popularity.desc">Most Popular</option>
                  <option value="vote_average.desc">Top Rated (IMDb)</option>
                  <option value="primary_release_date.desc">Release Date (Newest)</option>
                  <option value="revenue.desc">Highest Box Office Revenue</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              </div>

              {/* Language selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value); setPage(1) }}
                  className="h-10 appearance-none rounded-xl border border-border bg-secondary/70 pl-3.5 pr-9 text-xs font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="text-xs font-bold text-primary hover:underline"
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
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 md:gap-4">
              {movies.map((movie) => (
                <MediaCard key={movie.id} item={movie} mediaType="movie" />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-muted-foreground">
              <Film size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold text-foreground">No {genreName} movies found</p>
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

export default function MovieGenrePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MovieGenreContent id={id} />
    </Suspense>
  )
}
