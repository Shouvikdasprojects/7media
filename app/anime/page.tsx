'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AnimeHero } from '@/components/anime-hero'
import { AnimeCard } from '@/components/anime-card'
import { ANIME_GENRES } from '@/lib/anilist/types'
import {
  useTrendingAnime,
  usePopularAnime,
  useTopRatedAnime,
  useCurrentlyAiringAnime,
  useAnimeByGenre,
} from '@/lib/anilist/hooks'
import {
  Sparkles,
  Flame,
  Radio,
  Trophy,
  Compass,
  ChevronRight,
  Filter,
} from 'lucide-react'

export default function AnimePage() {
  const [tab, setTab] = useState<'trending' | 'popular' | 'top' | 'airing'>('trending')
  const [gridPage, setGridPage] = useState(1)

  // Data queries
  const { data: trendingData, isLoading: loadingTrending } = useTrendingAnime(1, 10)
  const { data: airingData, isLoading: loadingAiring } = useCurrentlyAiringAnime(1, 10)
  const { data: topRatedData, isLoading: loadingTop } = useTopRatedAnime(1, 10)

  // Explore grid query
  const sortMap = {
    trending: ['TRENDING_DESC', 'POPULARITY_DESC'],
    popular: ['POPULARITY_DESC'],
    top: ['SCORE_DESC'],
    airing: ['POPULARITY_DESC'],
  }

  const { data: gridData, isLoading: loadingGrid } = useAnimeByGenre({
    page: gridPage,
    perPage: 24,
    sort: sortMap[tab].join(','),
    status: tab === 'airing' ? 'RELEASING' : undefined,
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero Spotlight Carousel */}
        {trendingData?.media && trendingData.media.length > 0 ? (
          <AnimeHero animeList={trendingData.media} />
        ) : (
          <div className="h-[50vh] w-full animate-pulse bg-secondary/50" />
        )}

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-12">
          {/* 2. Anime Genre Pills Bar */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground md:text-2xl">
                  Explore by Genre
                </h2>
              </div>
            </div>

            <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-2 scrollbar-hide touch-pan-x md:flex-wrap">
              {ANIME_GENRES.map((g) => (
                <Link
                  key={g.id}
                  href={`/anime/genre/${encodeURIComponent(g.name)}`}
                  className="group flex shrink-0 snap-start items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-md"
                >
                  <span className="text-base">{g.icon}</span>
                  <span>{g.name}</span>
                  <ChevronRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          {/* 3. Currently Airing & Next Episode Schedule */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Radio size={18} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground md:text-2xl">
                    Currently Airing & Schedules
                  </h2>
                  <p className="text-xs text-muted-foreground">Fresh weekly episodes straight from Japan</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTab('airing')
                  document.getElementById('explore-grid')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
              >
                View All Airing
              </button>
            </div>

            {loadingAiring ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-secondary animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide touch-pan-x">
                {airingData?.media.map((anime) => (
                  <div key={anime.id} className="w-44 shrink-0 snap-start md:w-56">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Top Rated Masterpieces */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400">
                  <Trophy size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground md:text-2xl">
                    All-Time Legendary Masterpieces
                  </h2>
                  <p className="text-xs text-muted-foreground">Highest community scores on AniList</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTab('top')
                  document.getElementById('explore-grid')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
              >
                View All Top Rated
              </button>
            </div>

            {loadingTop ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-secondary animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide touch-pan-x">
                {topRatedData?.media.map((anime) => (
                  <div key={anime.id} className="w-44 shrink-0 snap-start md:w-56">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 5. Full Explore Grid with Interactive Tabs */}
          <section id="explore-grid" className="pt-4">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
                  Explore Anime Directory
                </h2>
                <p className="text-sm text-muted-foreground">Browse thousands of anime series, movies, and OVAs</p>
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-secondary p-1">
                <button
                  onClick={() => { setTab('trending'); setGridPage(1) }}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    tab === 'trending' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flame size={14} className={tab === 'trending' ? 'text-primary' : ''} />
                  Trending
                </button>
                <button
                  onClick={() => { setTab('popular'); setGridPage(1) }}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    tab === 'popular' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles size={14} className={tab === 'popular' ? 'text-primary' : ''} />
                  Popular
                </button>
                <button
                  onClick={() => { setTab('top'); setGridPage(1) }}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    tab === 'top' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Trophy size={14} className={tab === 'top' ? 'text-yellow-400' : ''} />
                  Top Rated
                </button>
                <button
                  onClick={() => { setTab('airing'); setGridPage(1) }}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    tab === 'airing' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Radio size={14} className={tab === 'airing' ? 'text-emerald-400' : ''} />
                  Airing
                </button>
              </div>
            </div>

            {/* Grid display */}
            {loadingGrid ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-secondary animate-pulse" />
                ))}
              </div>
            ) : gridData?.media && gridData.media.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {gridData.media.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                No anime found for this selection.
              </div>
            )}

            {/* Pagination */}
            {gridData?.pageInfo && gridData.pageInfo.lastPage > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setGridPage((p) => Math.max(1, p - 1))
                    document.getElementById('explore-grid')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  disabled={gridPage <= 1}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page <strong className="text-foreground">{gridPage}</strong> of {gridData.pageInfo.lastPage}
                </span>
                <button
                  onClick={() => {
                    setGridPage((p) => p + 1)
                    document.getElementById('explore-grid')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  disabled={!gridData.pageInfo.hasNextPage}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
