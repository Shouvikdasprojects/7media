'use client'

import { useI18n } from '@/lib/i18n/context'
import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { tmdbClient } from '@/lib/tmdb/client'
import { getMediaTitle, getMediaYear } from '@/components/media-card'
import type { TMDBMedia } from '@/lib/tmdb/types'

interface RankedCarouselProps {
  popularItems: TMDBMedia[]
  weeklyItems: TMDBMedia[]
}

export function RankedCarousel({ popularItems, weeklyItems }: RankedCarouselProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'popular' | 'week'>('popular')

  const items = (tab === 'popular' ? popularItems : weeklyItems).slice(0, 10)

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -750 : 750,
      behavior: 'smooth',
    })
  }

  return (
    <section className="py-8 md:py-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-[1880px] mx-auto">
        {/* Header: logo wordmark + toggle */}
        <div className="flex items-end justify-between gap-4 mb-3 flex-wrap">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground font-display uppercase tracking-tight leading-none">
              7Media
            </h2>
            <div className="flex items-center gap-4 mt-2" role="tablist" aria-label="Ranking period">
              <button
                role="tab"
                aria-selected={tab === 'popular'}
                onClick={() => setTab('popular')}
                className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
                  tab === 'popular' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Popular
              </button>
              <button
                role="tab"
                aria-selected={tab === 'week'}
                onClick={() => setTab('week')}
                className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
                  tab === 'week' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                This Week
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border hover:bg-secondary transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border hover:bg-secondary transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Ranked posters with giant numbers behind */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pt-4 pb-2"
        >
          {items.map((item, index) => {
            const type = item.media_type || ('title' in item ? 'movie' : 'tv')
            const title = getMediaTitle(item)
            const year = getMediaYear(item)
            const posterUrl = item.poster_path
              ? tmdbClient.getImageUrl(item.poster_path, 'w342')
              : null

            return (
              <Link
                key={`${tab}-${item.id}`}
                href={`/title/${type}/${item.id}`}
                className="relative flex-shrink-0 flex items-end group/rank cursor-pointer"
              >
                {/* Giant rank number behind poster with glowing illumination on card hover */}
                <span
                  aria-hidden="true"
                  className="font-display font-black text-[9rem] md:text-[11rem] leading-[0.75] text-transparent select-none -mr-10 md:-mr-12 relative z-0 transition-all duration-300 ease-out group-hover/rank:text-white group-hover/rank:drop-shadow-[0_0_35px_rgba(255,255,255,0.85)] group-hover/rank:scale-105 group-hover/rank:-translate-y-1"
                  style={{
                    WebkitTextStroke: '2px rgba(255, 255, 255, 0.28)',
                  }}
                >
                  {index + 1}
                </span>

                <div className="relative z-10 w-36 sm:w-44 md:w-48 lg:w-52 transition-transform duration-300 group-hover/rank:scale-[1.03]">
                  <div className="relative aspect-[2/3] bg-secondary rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/70 group-hover/rank:ring-white/40 group-hover/rank:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all">
                    {posterUrl ? (
                      <Image
                        src={posterUrl || "/placeholder.svg"}
                        alt={title}
                        fill
                        sizes="200px"
                        className="object-cover group-hover/rank:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs px-2 text-center">
                        {title}
                      </div>
                    )}
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-foreground line-clamp-1 text-center group-hover/rank:text-accent transition-colors">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-0.5 flex items-center justify-center gap-1.5">
                    {item.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-accent font-semibold">
                        <Star size={10} className="fill-accent" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    )}
                    {year && <span>· {year}</span>}
                    <span>· {type === 'tv' ? 'TV' : 'Movie'}</span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
