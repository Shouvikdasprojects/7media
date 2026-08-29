'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Star, ChevronLeft, ChevronRight, Info, Radio, Sparkles } from 'lucide-react'
import { AniListMedia } from '@/lib/anilist/types'
import { TrailerModal } from './trailer-modal'

export function AnimeHero({ animeList }: { animeList: AniListMedia[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [trailerOpen, setTrailerOpen] = useState(false)
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
    if (distance > 50) {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    } else if (distance < -50) {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    }
  }

  const items = animeList.slice(0, 6)
  const current = items[currentIndex]

  // Auto rotate every 7 seconds
  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [items.length])

  if (!current) return null

  const title = current.title.english || current.title.romaji || current.title.native || 'Trending Anime'
  const nativeTitle = current.title.native
  const bannerUrl = current.bannerImage || current.coverImage?.extraLarge || null
  const score = current.averageScore
  const studio = current.studios?.nodes?.[0]?.name
  const trailerId = current.trailer?.site === 'youtube' ? current.trailer.id : null

  return (
    <section 
      className="relative min-h-[65vh] w-full overflow-hidden bg-black md:min-h-[75vh] touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Backdrop */}
      {bannerUrl && (
        <Image
          src={bannerUrl}
          alt={title}
          fill
          priority
          className="object-cover opacity-45 transition-opacity duration-700"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent md:w-3/4" />

      {/* Content Container */}
      <div className="relative z-10 mx-auto flex h-full min-h-[65vh] max-w-7xl flex-col justify-end px-4 pb-12 pt-28 md:min-h-[75vh] md:px-8">
        <div className="flex max-w-2xl flex-col gap-3.5">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-xs font-bold text-primary backdrop-blur-md">
              <Sparkles size={13} />
              FEATURED ANIME
            </span>
            {current.status === 'RELEASING' && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
                <Radio size={12} className="animate-pulse" />
                AIRING NOW
              </span>
            )}
            {score ? (
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                {score}% Score
              </span>
            ) : null}
            {studio && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                {studio}
              </span>
            )}
          </div>

          {/* Native Title */}
          {nativeTitle && nativeTitle !== title && (
            <p className="text-sm font-semibold tracking-widest text-primary/90">
              {nativeTitle}
            </p>
          )}

          {/* Main Title */}
          <h1 className="text-balance text-3xl font-extrabold text-foreground md:text-5xl lg:text-6xl">
            {title}
          </h1>

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5">
            {current.genres?.map((genre) => (
              <Link
                key={genre}
                href={`/anime/genre/${encodeURIComponent(genre)}`}
                className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                {genre}
              </Link>
            ))}
          </div>

          {/* Description */}
          {current.description && (
            <p
              className="line-clamp-3 text-sm leading-relaxed text-muted-foreground md:text-base"
              dangerouslySetInnerHTML={{
                __html: current.description.replace(/<[^>]*>?/gm, ''),
              }}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {trailerId && (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90"
              >
                <Play size={18} fill="currentColor" />
                Watch Trailer
              </button>
            )}

            <Link
              href={`/anime/${current.id}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-secondary/80 px-6 py-3 font-semibold text-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-secondary"
            >
              <Info size={18} />
              View Details
            </Link>
          </div>
        </div>

        {/* Carousel pagination indicators */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition-colors hover:bg-white/15"
              aria-label="Previous anime"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition-colors hover:bg-white/15"
              aria-label="Next anime"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeId={trailerId || null}
        title={title}
      />
    </section>
  )
}
