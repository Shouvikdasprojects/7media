'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { AnimeCard } from '@/components/anime-card'
import { AniListMedia } from '@/lib/anilist/types'

interface AnimeCarouselProps {
  title: string
  subtitle?: string
  animeList: AniListMedia[]
  viewAllHref?: string
}

export function AnimeCarousel({
  title,
  subtitle,
  animeList,
  viewAllHref = '/anime',
}: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -750 : 750,
      behavior: 'smooth',
    })
  }

  if (!animeList || animeList.length === 0) return null

  return (
    <section className="animate-reveal px-4 py-6 md:px-8 lg:px-12 md:py-8">
      <div className="max-w-[1880px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-foreground font-display uppercase tracking-tight leading-none">
                {title}
              </h2>
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase hover:text-accent transition-colors"
              >
                View All
              </Link>
            )}

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border hover:bg-secondary transition-colors"
                aria-label={`Scroll ${title} left`}
              >
                <ChevronLeft size={18} className="text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border hover:bg-secondary transition-colors"
                aria-label={`Scroll ${title} right`}
              >
                <ChevronRight size={18} className="text-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-3 pt-1 touch-pan-x md:gap-3.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {animeList.map((item) => (
            <div key={item.id} className="w-[135px] flex-shrink-0 snap-start sm:w-[160px] md:w-[185px] lg:w-[210px] xl:w-[230px]">
              <AnimeCard anime={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
