'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MediaCard } from '@/components/media-card'
import { AnimeCard } from '@/components/anime-card'
import { useSearchMulti } from '@/lib/tmdb/hooks'
import { useSearchAnime } from '@/lib/anilist/hooks'
import { Search as SearchIcon, X, Film, Tv, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type') || 'all'

  const [query, setQuery] = useState(initialQuery)
  const [submitted, setSubmitted] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'anime'>(initialType as any)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (initialQuery && initialQuery !== submitted) {
      setQuery(initialQuery)
      setSubmitted(initialQuery)
    }
  }, [initialQuery, submitted])

  // TMDB Search (Movies & Shows)
  const { data: tmdbData, isLoading: tmdbLoading } = useSearchMulti(submitted, page)
  // AniList Search (Anime)
  const { data: animeData, isLoading: animeLoading } = useSearchAnime(submitted, page, 24)

  const tmdbResults = (tmdbData?.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
  const movies = tmdbResults.filter((item) => item.media_type === 'movie')
  const shows = tmdbResults.filter((item) => item.media_type === 'tv')
  const anime = animeData?.media || []

  const isLoading = tmdbLoading || animeLoading
  const totalCount = (tmdbData?.total_results || 0) + (animeData?.pageInfo?.total || 0)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (query.trim()) {
      setSubmitted(query.trim())
      setPage(1)
    }
  }

  function clearSearch() {
    setQuery('')
    setSubmitted('')
    setPage(1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 md:pt-0">
        <header className="border-b border-border bg-secondary/30 px-4 py-12 md:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              All-in-One Media Discovery
            </p>
            <h1 className="mb-6 text-balance text-4xl font-black text-foreground md:text-5xl font-display uppercase tracking-tight">
              Search
            </h1>

            <form onSubmit={handleSubmit} className="relative max-w-3xl">
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={22}
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search movies, TV series, anime, characters..."
                className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base md:text-lg text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </form>

            {submitted && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={'rounded-xl px-4 py-2 text-xs font-bold transition-all touch-manipulation active:scale-95 ' +
                      (activeTab === 'all'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground')}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('movie')}
                    className={'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all touch-manipulation active:scale-95 ' +
                      (activeTab === 'movie'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground')}
                  >
                    <Film size={13} />
                    <span>Movies ({movies.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tv')}
                    className={'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all touch-manipulation active:scale-95 ' +
                      (activeTab === 'tv'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground')}
                  >
                    <Tv size={13} />
                    <span>TV Series ({shows.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('anime')}
                    className={'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all touch-manipulation active:scale-95 ' +
                      (activeTab === 'anime'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground')}
                  >
                    <Sparkles size={13} />
                    <span>Anime ({anime.length})</span>
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Searching...' : 'Found ' + totalCount + ' results for "' + submitted + '"'}
                </p>
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          {!submitted ? (
            <div className="py-20 text-center text-muted-foreground">
              <SearchIcon size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-base font-semibold text-foreground">Search for movies, TV series, or anime</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Search through millions of titles from TMDB and AniList.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {/* 1. Anime Section */}
              {(activeTab === 'all' || activeTab === 'anime') && anime.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-primary" size={20} />
                      <h2 className="text-2xl font-bold text-foreground">Anime</h2>
                    </div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      AniList ({anime.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
                    {anime.map((item) => (
                      <AnimeCard key={item.id} anime={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Movies Section */}
              {(activeTab === 'all' || activeTab === 'movie') && movies.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Film className="text-accent" size={20} />
                      <h2 className="text-2xl font-bold text-foreground">Movies</h2>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      TMDB ({movies.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
                    {movies.map((item: any) => (
                      <MediaCard key={item.id} item={item} mediaType="movie" />
                    ))}
                  </div>
                </section>
              )}

              {/* 3. TV Shows Section */}
              {(activeTab === 'all' || activeTab === 'tv') && shows.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Tv className="text-accent" size={20} />
                      <h2 className="text-2xl font-bold text-foreground">TV Series</h2>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      TMDB ({shows.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
                    {shows.map((item: any) => (
                      <MediaCard key={item.id} item={item} mediaType="tv" />
                    ))}
                  </div>
                </section>
              )}

              {/* No results in active tab */}
              {((activeTab === 'anime' && anime.length === 0) ||
                (activeTab === 'movie' && movies.length === 0) ||
                (activeTab === 'tv' && shows.length === 0) ||
                (activeTab === 'all' && anime.length === 0 && movies.length === 0 && shows.length === 0)) && (
                <div className="py-16 text-center">
                  <p className="text-lg font-bold text-foreground">No matches found for &ldquo;{submitted}&rdquo;</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try searching with different keywords or switch categories.
                  </p>
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-border">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-secondary transition"
                >
                  <ArrowLeft size={14} /> Previous
                </button>
                <span className="text-xs font-semibold text-muted-foreground">Page {page}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPage((current) => current + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-secondary transition"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" aria-label="Loading search" />}>
      <SearchPageContent />
    </Suspense>
  )
}
