'use client'

import { useI18n } from '@/lib/i18n/context'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Play, Info, Star } from 'lucide-react'
import useSWR from 'swr'
import { MOVIE_GENRES } from '@/lib/tmdb/constants'
import type { TMDBMovie, TMDBPaginatedResponse } from '@/lib/tmdb/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const GENRE_MAP: Record<number, string> = Object.fromEntries(
  MOVIE_GENRES.map((g) => [g.id, g.name])
)

function getImageUrl(path: string | null, size = 'original') {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export function HeroCarousel() {
  const { t } = useI18n()
  const { data } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    '/api/tmdb/trending/movies?timeWindow=day',
    fetcher
  )
  const movies = (data?.results || []).filter((m) => m.backdrop_path).slice(0, 5)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (movies.length === 0 ? 0 : (prev + 1) % movies.length))
  }, [movies.length])

  // Auto-advance every 7 seconds like 7REELS
  useEffect(() => {
    if (movies.length < 2) return
    const timer = setInterval(goToNext, 7000)
    return () => clearInterval(timer)
  }, [movies.length, goToNext])

  const currentMovie = movies[currentIndex]

  if (!currentMovie) {
    return (
      <div className="relative h-[75vh] md:h-[88vh] bg-gradient-to-b from-secondary/40 via-card to-background flex items-center justify-center">
        <div className="animate-pulse text-center w-full max-w-xl px-4">
          <div className="h-14 w-3/4 bg-muted/40 rounded mb-4 mx-auto md:mx-0"></div>
          <div className="h-4 w-full bg-muted/30 rounded mb-2 mx-auto md:mx-0"></div>
          <div className="h-4 w-2/3 bg-muted/30 rounded mx-auto md:mx-0"></div>
        </div>
      </div>
    )
  }

  const backdropUrl = getImageUrl(currentMovie.backdrop_path)
  const year = currentMovie.release_date
    ? new Date(currentMovie.release_date).getFullYear()
    : null

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1))

  return (
    <section 
      aria-label="Featured titles" 
      className="relative touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[75vh] sm:h-[82vh] md:h-[90vh] lg:h-[94vh] overflow-hidden bg-background group">
        {/* Backdrop */}
        {backdropUrl && (
          <div className="absolute inset-0">
            <Image
              key={currentMovie.id}
              src={backdropUrl}
              alt={currentMovie.title || 'Featured movie'}
              fill
              className="object-cover object-top md:object-center animate-in fade-in duration-700"
              priority
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent w-full md:w-3/4" />
          </div>
        )}

        {/* Content Lowered Down Elegantly */}
        <div className="relative h-full flex items-end pb-24 md:pb-28 lg:pb-32">
          <div className="animate-reveal z-10 mx-auto w-full max-w-[1880px] px-4 md:px-8 lg:px-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground mb-3 max-w-4xl text-balance font-display uppercase tracking-tight leading-[1.08] text-glow break-words">
              {currentMovie.title}
            </h1>

            {/* Meta Row */}
            <div className="flex items-center gap-3 md:gap-4 mb-3.5 flex-wrap">
              {currentMovie.vote_average > 0 && (
                <span className="flex items-center gap-1.5 text-accent font-bold text-sm md:text-base">
                  <Star size={17} className="fill-accent text-accent" />
                  {currentMovie.vote_average.toFixed(1)}
                </span>
              )}
              {year && <span className="text-xs md:text-sm text-foreground/85 font-semibold">{year}</span>}
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                HD
              </span>
              {currentMovie.genre_ids?.slice(0, 3).map(
                (genreId) =>
                  GENRE_MAP[genreId] && (
                    <span
                      key={genreId}
                      className="px-3 py-1 text-xs rounded-full bg-secondary/80 backdrop-blur-md text-foreground font-semibold border border-border/60"
                    >
                      {GENRE_MAP[genreId]}
                    </span>
                  )
              )}
            </div>

            {/* Overview */}
            <p className="text-sm md:text-base text-foreground/85 max-w-2xl line-clamp-3 mb-6 md:mb-8 leading-relaxed">
              {currentMovie.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3.5 flex-wrap items-center">
              <Link
                href={`/watch/movie/${currentMovie.id}`}
                className="flex items-center gap-2.5 px-7 py-3.5 bg-foreground text-background font-bold text-sm md:text-base rounded-2xl hover:opacity-90 transition-opacity shadow-lg touch-manipulation active:scale-95"
              >
                <Play size={18} fill="currentColor" />
                {t('watchNow')}
              </Link>
              <Link
                href={`/title/movie/${currentMovie.id}`}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-secondary/85 backdrop-blur-md text-foreground font-semibold text-sm md:text-base rounded-2xl hover:bg-secondary border border-border/80 transition-all touch-manipulation active:scale-95"
              >
                <Info size={18} />
                {t('moreInfo')}
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center shadow-lg"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center shadow-lg"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-20 md:bottom-24 right-6 md:right-12 z-20 flex gap-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-7 bg-accent'
                  : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Genre pill bar overlapping bottom of hero */}
        <div className="absolute bottom-4 left-0 right-0 z-20 px-4 md:px-8 lg:px-12">
          <div className="max-w-[1880px] mx-auto">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Link
                href="/movies"
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold tracking-wide uppercase transition-all"
              >
                {t('editorsChoices')}
              </Link>
              {MOVIE_GENRES.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/movies?genre=${genre.id}`}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-card/85 backdrop-blur-md border border-border text-foreground hover:bg-secondary hover:border-primary/50 transition-all text-xs font-semibold"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
