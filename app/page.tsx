'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { HeroCarousel } from '@/components/hero-carousel'
import { MovieCarousel } from '@/components/movie-carousel'
import { AnimeCarousel } from '@/components/anime-carousel'
import { RankedCarousel } from '@/components/ranked-carousel'
import { SafetyBanner } from '@/components/safety-banner'
import { ProvidersRow } from '@/components/providers-row'
import { ContinueWatching } from '@/components/continue-watching'
import {
  useTrendingMovies,
  usePopularMovies,
  useTopRatedMovies,
  useNowPlayingMovies,
  useTrendingShows,
  usePopularShows,
  useTopRatedShows,
  useOnTheAirShows,
} from '@/lib/tmdb/hooks'
import {
  useTrendingAnime,
  useCurrentlyAiringAnime,
  useTopRatedAnime,
} from '@/lib/anilist/hooks'
import { Film, Tv, Sparkles, ChevronRight } from 'lucide-react'

function SectionDivider({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="px-4 md:px-8 lg:px-12 pt-10 md:pt-14 pb-2">
      <div className="max-w-[1880px] mx-auto">
        <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase mb-1">
          {eyebrow}
        </p>
        <div className="flex items-center gap-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-display uppercase tracking-tight leading-none">
            {title}
          </h2>
          <div className="flex-1 h-px bg-border" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  )
}

function HomePageContent() {
  // Movies
  const { data: trendingMoviesWeek } = useTrendingMovies('week')
  const { data: trendingMoviesDay } = useTrendingMovies('day')
  const { data: popularMovies } = usePopularMovies()
  const { data: topRatedMovies } = useTopRatedMovies()
  const { data: nowPlayingMovies } = useNowPlayingMovies()

  // TV
  const { data: trendingShowsWeek } = useTrendingShows('week')
  const { data: popularShows } = usePopularShows()
  const { data: topRatedShows } = useTopRatedShows()
  const { data: onTheAirShows } = useOnTheAirShows()

  // Anime (AniList)
  const { data: trendingAnimeData } = useTrendingAnime(1, 18)
  const { data: airingAnimeData } = useCurrentlyAiringAnime(1, 18)
  const { data: topRatedAnimeData } = useTopRatedAnime(1, 18)

  const rankedPopular = popularMovies?.results || []
  const rankedWeekly = trendingMoviesWeek?.results || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero with genre pill bar */}
        <HeroCarousel />

        {/* Ranked 7REELS row with Popular / This Week toggle */}
        <RankedCarousel popularItems={rankedPopular} weeklyItems={rankedWeekly} />

        {/* Safety notice + community */}
        <SafetyBanner />

        <ContinueWatching />

        {/* Streaming providers */}
        <ProvidersRow />

        {/* ============ MOVIES ============ */}
        <SectionDivider eyebrow="Discover" title="Movies" />

        <MovieCarousel
          title="Editor's Choices Movies"
          movies={(topRatedMovies?.results || []).slice(0, 18)}
          mediaType="movie"
          viewAllHref="/movies?category=editors_choice"
        />
        <MovieCarousel
          title="Trending Movies"
          movies={(trendingMoviesDay?.results || []).slice(0, 18)}
          mediaType="movie"
          viewAllHref="/movies"
        />
        <MovieCarousel
          title="Latest Releases"
          movies={(nowPlayingMovies?.results || []).slice(0, 18)}
          mediaType="movie"
          viewAllHref="/movies?category=now_playing"
        />
        <MovieCarousel
          title="Popular Movies"
          movies={(popularMovies?.results || []).slice(0, 18)}
          mediaType="movie"
          viewAllHref="/movies"
        />
        <MovieCarousel
          title="Top IMDb Movies"
          movies={(topRatedMovies?.results || []).slice(0, 18)}
          mediaType="movie"
          viewAllHref="/movies?category=editors_choice"
        />

        {/* ============ TV SHOWS ============ */}
        <SectionDivider eyebrow="Discover" title="TV Shows" />

        <MovieCarousel
          title="Editor's Choices TV"
          movies={(topRatedShows?.results || []).slice(0, 18)}
          mediaType="tv"
          viewAllHref="/series?tab=top"
        />
        <MovieCarousel
          title="Popular Series"
          movies={(popularShows?.results || []).slice(0, 18)}
          mediaType="tv"
          viewAllHref="/series"
        />
        <MovieCarousel
          title="Trending Series"
          movies={(trendingShowsWeek?.results || []).slice(0, 18)}
          mediaType="tv"
          viewAllHref="/series"
        />
        <MovieCarousel
          title="Top on 7MEDIA"
          movies={(onTheAirShows?.results || []).slice(0, 18)}
          mediaType="tv"
          viewAllHref="/series"
        />

        {/* ============ ANIME (NEW SECTION) ============ */}
        <SectionDivider eyebrow="Discover" title="Anime" />

        <AnimeCarousel
          title="Trending Anime"
          subtitle="Top trending anime right now powered by AniList"
          animeList={trendingAnimeData?.media || []}
          viewAllHref="/anime"
        />

        <AnimeCarousel
          title="Currently Airing &amp; Schedules"
          subtitle="Weekly broadcast episodes with live countdown timers"
          animeList={airingAnimeData?.media || []}
          viewAllHref="/anime"
        />

        <AnimeCarousel
          title="All-Time Legendary Masterpieces"
          subtitle="Highest scored Japanese anime of all time"
          animeList={topRatedAnimeData?.media || []}
          viewAllHref="/anime"
        />

        {/* ============ BROWSE CTA ============ */}
        <SectionDivider eyebrow="Discover" title="Browse" />
        <section className="px-4 md:px-8 lg:px-12 py-8 mb-8">
          <div className="max-w-[1880px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Movies */}
            <Link
              href="/movies"
              className="group/cta bg-card border border-border rounded-3xl p-8 hover:border-accent hover:bg-secondary/40 transition-all duration-200 touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
                  Browse
                </p>
                <span className="p-2 rounded-xl bg-primary/10 text-primary group-hover/cta:bg-primary group-hover/cta:text-primary-foreground transition-colors">
                  <Film size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-foreground font-display uppercase tracking-tight group-hover/cta:text-accent transition-colors">
                Movies
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Explore all movies with a clean genre picker, release date sorting, and top IMDb rankings.
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-primary group-hover/cta:translate-x-1 transition-transform">
                <span>Explore Movies</span>
                <ChevronRight size={14} />
              </div>
            </Link>

            {/* 2. Series */}
            <Link
              href="/series"
              className="group/cta bg-card border border-border rounded-3xl p-8 hover:border-accent hover:bg-secondary/40 transition-all duration-200 touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
                  Browse
                </p>
                <span className="p-2 rounded-xl bg-accent/10 text-accent group-hover/cta:bg-accent group-hover/cta:text-accent-foreground transition-colors">
                  <Tv size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-foreground font-display uppercase tracking-tight group-hover/cta:text-accent transition-colors">
                Series
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Every TV show from every network, filterable by genre, country, and episode guides.
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-accent group-hover/cta:translate-x-1 transition-transform">
                <span>Explore Series</span>
                <ChevronRight size={14} />
              </div>
            </Link>

            {/* 3. Anime */}
            <Link
              href="/anime"
              className="group/cta bg-card border border-border rounded-3xl p-8 hover:border-primary hover:bg-secondary/40 transition-all duration-200 touch-manipulation active:scale-[0.98] sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
                  Browse
                </p>
                <span className="p-2 rounded-xl bg-primary/20 text-primary group-hover/cta:bg-primary group-hover/cta:text-primary-foreground transition-colors">
                  <Sparkles size={18} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-foreground font-display uppercase tracking-tight group-hover/cta:text-primary transition-colors">
                Anime
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Explore Japanese anime by genre, with release order timelines, Seiyuu voice actors, and airing schedules.
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-primary group-hover/cta:translate-x-1 transition-transform">
                <span>Explore Anime Hub</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomePageContent />
    </Suspense>
  )
}
