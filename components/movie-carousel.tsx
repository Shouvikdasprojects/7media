'use client'

import { useI18n } from '@/lib/i18n/context'
import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaCard } from '@/components/media-card'
import type { TMDBMedia } from '@/lib/tmdb/types'

interface MovieCarouselProps {
  title: string
  movies: TMDBMedia[]
  mediaType?: 'movie' | 'tv'
  viewAllHref?: string
}

export function MovieCarousel({ title, movies, mediaType, viewAllHref }: MovieCarouselProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -750 : 750,
      behavior: 'smooth',
    })
  }

  if (!movies || movies.length === 0) return null

  return (
    <section className="animate-reveal px-4 py-6 md:px-8 lg:px-12 md:py-8">
      <div className="max-w-[1880px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-foreground font-display uppercase tracking-tight leading-none">
              {title}
            </h2>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase hover:text-accent transition-colors"
              >
                View All
              </Link>
            )}
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border hover:bg-secondary transition-colors"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border hover:bg-secondary transition-colors"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-3 pt-1 touch-pan-x md:gap-3.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {movies.map((item) => (
            <div key={item.id} className="w-[135px] flex-shrink-0 snap-start sm:w-[160px] md:w-[185px] lg:w-[210px] xl:w-[230px]">
              <MediaCard item={item} mediaType={mediaType} sizes="(max-width: 768px) 160px, (max-width: 1200px) 210px, 230px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
