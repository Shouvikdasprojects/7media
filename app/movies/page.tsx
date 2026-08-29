'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BrowseFilterBar, type BrowseFilters } from '@/components/browse-filter-bar'
import { BrowseGrid } from '@/components/browse-grid'
import {
  useDiscoverMovies,
  useTrendingMovies,
  useTopRatedMovies,
  useNowPlayingMovies,
  usePopularMovies,
} from '@/lib/tmdb/hooks'
import { MOVIE_GENRES } from '@/lib/tmdb/constants'
import { Film, Sparkles, TrendingUp, Star, Clock, Flame, Award } from 'lucide-react'

const DEFAULT_FILTERS: BrowseFilters = {
  genre: '',
  language: '',
  provider: '',
  country: '',
  sortBy: 'popularity.desc',
}

const GENRE_ICONS: Record<number, string> = {
  28: '💥', 12: '🗺️', 16: '🎨', 35: '😂', 80: '🕵️', 99: '📹',
  18: '🎭', 10751: '👨‍👩‍👧‍👦', 14: '🧙', 36: '📜', 27: '👻', 10402: '🎵',
  9648: '🔍', 10749: '💖', 878: '🚀', 53: '⚡', 10752: '⚔️', 37: '🤠',
}

const CATEGORIES = [
  { id: 'discover', label: 'All Movies', icon: Film, desc: 'Explore all movies with custom filters, language, and sort options.' },
  { id: 'trending', label: 'Trending', icon: Flame, desc: 'Today\'s most viral, popular, and trending movies worldwide.' },
  { id: 'now_playing', label: 'Latest Releases', icon: Clock, desc: 'Newly released and currently in-theater movies.' },
  { id: 'top_rated', label: 'Top IMDb', icon: Star, desc: 'Highest rated masterpiece movies of all time by global IMDb scores.' },
  { id: 'editors_choice', label: 'Editor\'s Choices', icon: Award, desc: 'Critically acclaimed selections and hand-picked cinema gems.' },
]

function MoviesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialCat = searchParams.get('category') || (searchParams.get('tab') === 'top' ? 'top_rated' : searchParams.get('tab') === 'recent' ? 'now_playing' : 'discover')
  const initialGenre = searchParams.get('genre') || ''
  const initialProvider = searchParams.get('provider') || ''

  const [category, setCategory] = useState(initialCat)
  const [filters, setFilters] = useState<BrowseFilters>({
    ...DEFAULT_FILTERS,
    genre: initialGenre,
    provider: initialProvider,
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    const cat = searchParams.get('category') || (searchParams.get('tab') === 'top' ? 'top_rated' : searchParams.get('tab') === 'recent' ? 'now_playing' : 'discover')
    if (cat && cat !== category) {
      setCategory(cat)
      setPage(1)
    }
  }, [searchParams])

  // Fetch based on active category
  const { data: discoverData, isLoading: discoverLoading } = useDiscoverMovies({
    page,
    genre: filters.genre,
    language: filters.language,
    provider: filters.provider,
    country: filters.country,
    sortBy: filters.sortBy,
    minVotes: filters.sortBy.startsWith('vote_average') ? 200 : undefined,
  })

  const { data: trendingData, isLoading: trendingLoading } = useTrendingMovies('day', page)
  const { data: nowPlayingData, isLoading: nowPlayingLoading } = useNowPlayingMovies(page)
  const { data: topRatedData, isLoading: topRatedLoading } = useTopRatedMovies(page)

  let activeData = discoverData
  let isLoading = discoverLoading

  if (category === 'trending') {
    activeData = trendingData
    isLoading = trendingLoading
  } else if (category === 'now_playing') {
    activeData = nowPlayingData
    isLoading = nowPlayingLoading
  } else if (category === 'top_rated' || category === 'editors_choice') {
    activeData = topRatedData
    isLoading = topRatedLoading
  }

  const currentCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0]

  const handleFilterChange = (next: BrowseFilters) => {
    setFilters(next)
    setCategory('discover')
    setPage(1)
  }

  const handleCategorySwitch = (catId: string) => {
    setCategory(catId)
    setPage(1)
    router.push(catId === 'discover' ? '/movies' : `/movies?category=${catId}`, { scroll: false })
  }

  const handlePageChange = (next: number) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 pb-16 pt-24 md:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1880px] flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
                <Film className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground font-display uppercase tracking-tight md:text-4xl">
                  {currentCategoryObj.label}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {currentCategoryObj.desc}
                </p>
              </div>
            </div>

            {activeData?.total_results && (
              <span className="self-start sm:self-auto rounded-xl bg-card border border-border px-3.5 py-1.5 text-xs font-bold text-muted-foreground shadow-sm">
                {activeData.total_results.toLocaleString()} Titles Available
              </span>
            )}
          </header>

          {/* Category Tabs Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySwitch(cat.id)}
                  className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all touch-manipulation active:scale-95 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'bg-card border border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Quick Genre Hub Carousel Bar */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                Movie Genres:
              </span>
              {MOVIE_GENRES.map((g) => (
                <Link
                  key={g.id}
                  href={`/movies/genre/${g.id}`}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/15 hover:text-primary active:scale-95"
                >
                  <span>{GENRE_ICONS[g.id] || '🎬'}</span>
                  <span>{g.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Filter Bar (Active in Discover mode) */}
          {category === 'discover' && (
            <BrowseFilterBar type="movie" filters={filters} onChange={handleFilterChange} />
          )}

          {/* Grid */}
          <BrowseGrid
            items={activeData?.results || []}
            type="movie"
            isLoading={isLoading}
            page={page}
            totalPages={activeData?.total_pages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MoviesContent />
    </Suspense>
  )
}
