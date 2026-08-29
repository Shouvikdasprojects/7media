'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AnimeCard } from '@/components/anime-card'
import { ANIME_GENRES } from '@/lib/anilist/types'
import { useAnimeByGenre } from '@/lib/anilist/hooks'
import { Sparkles, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'

export default function AnimeGenrePage({
  params,
}: {
  params: Promise<{ genre: string }>
}) {
  const { genre } = use(params)
  const decodedGenre = decodeURIComponent(genre)

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('POPULARITY_DESC')
  const [format, setFormat] = useState('')
  const [status, setStatus] = useState('')

  const genreMeta = ANIME_GENRES.find(
    (g) => g.name.toLowerCase() === decodedGenre.toLowerCase()
  )

  const { data, isLoading } = useAnimeByGenre({
    genre: decodedGenre,
    page,
    perPage: 24,
    sort,
    format: format || undefined,
    status: status || undefined,
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-4 pb-16 pt-24 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/anime"
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Anime Hub
            </Link>
            <span>/</span>
            <span className="font-semibold text-primary">{decodedGenre}</span>
          </div>

          {/* Genre Header */}
          <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-secondary/50 to-card p-6 md:p-10 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">{genreMeta?.icon || '🎬'}</span>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
                    {decodedGenre} Anime
                  </h1>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                  {genreMeta?.desc || `Explore all popular, trending, and top-rated ${decodedGenre} anime series and movies.`}
                </p>
              </div>

              {/* Total count badge */}
              {data?.pageInfo && (
                <div className="flex shrink-0 items-center gap-2 rounded-xl bg-card border border-border px-4 py-2.5 shadow-sm">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {data.pageInfo.total.toLocaleString()} Titles Available
                  </span>
                </div>
              )}
            </div>

            {/* Quick other genre pills */}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <span className="self-center text-xs font-bold uppercase text-muted-foreground">Other Genres:</span>
              {ANIME_GENRES.filter((g) => g.name.toLowerCase() !== decodedGenre.toLowerCase())
                .slice(0, 8)
                .map((g) => (
                  <Link
                    key={g.id}
                    href={`/anime/genre/${encodeURIComponent(g.name)}`}
                    className="rounded-lg bg-secondary/80 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {g.icon} {g.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort selector */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1) }}
                  className="h-10 appearance-none rounded-lg border border-border bg-secondary pl-3 pr-9 text-sm font-semibold text-foreground outline-none hover:border-primary/50 focus:border-primary"
                  aria-label="Sort Anime"
                >
                  <option value="POPULARITY_DESC">Most Popular</option>
                  <option value="SCORE_DESC">Top Rated (AniList Score)</option>
                  <option value="TRENDING_DESC">Trending Now</option>
                  <option value="START_DATE_DESC">Newest Releases</option>
                  <option value="FAVOURITES_DESC">Most Favorited</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              </div>

              {/* Format selector */}
              <div className="relative">
                <select
                  value={format}
                  onChange={(e) => { setFormat(e.target.value); setPage(1) }}
                  className="h-10 appearance-none rounded-lg border border-border bg-secondary pl-3 pr-9 text-sm font-semibold text-foreground outline-none hover:border-primary/50 focus:border-primary"
                  aria-label="Format filter"
                >
                  <option value="">All Formats</option>
                  <option value="TV">TV Series</option>
                  <option value="MOVIE">Anime Movie</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA / Web Anime</option>
                  <option value="SPECIAL">Special</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              </div>

              {/* Status selector */}
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                  className="h-10 appearance-none rounded-lg border border-border bg-secondary pl-3 pr-9 text-sm font-semibold text-foreground outline-none hover:border-primary/50 focus:border-primary"
                  aria-label="Status filter"
                >
                  <option value="">All Statuses</option>
                  <option value="RELEASING">Currently Airing</option>
                  <option value="FINISHED">Finished Airing</option>
                  <option value="NOT_YET_RELEASED">Upcoming</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              </div>

              {(format || status || sort !== 'POPULARITY_DESC') && (
                <button
                  onClick={() => { setFormat(''); setStatus(''); setSort('POPULARITY_DESC'); setPage(1) }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Results count text */}
            <div className="text-xs text-muted-foreground">
              Showing page <strong>{page}</strong>
            </div>
          </div>

          {/* Anime Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : data?.media && data.media.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {data.media.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg font-semibold">No anime found matching your filter criteria.</p>
              <button
                onClick={() => { setFormat(''); setStatus(''); setSort('POPULARITY_DESC'); setPage(1) }}
                className="mt-3 text-sm font-bold text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {data?.pageInfo && data.pageInfo.lastPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={page <= 1}
                className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page <strong className="text-foreground">{page}</strong> of {data.pageInfo.lastPage}
              </span>
              <button
                onClick={() => {
                  setPage((p) => p + 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={!data.pageInfo.hasNextPage}
                className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
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
