'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWatchProviders } from '@/lib/tmdb/hooks'
import { useI18n } from '@/lib/i18n/context'

export function ProvidersRow() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { regionCode, t } = useI18n()
  const { data, isLoading } = useWatchProviders('movie', regionCode || 'US')

  const providers = (data?.results || [])
    .sort((a, b) => a.display_priority - b.display_priority)
    .slice(0, 28)

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -500 : 500,
      behavior: 'smooth',
    })
  }

  return (
    <section className="py-8 md:py-10 px-4 md:px-8 lg:px-12">
      <div className="max-w-[1880px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl md:text-3xl font-black text-foreground font-display uppercase tracking-tight">
              {t('providers')}
            </h2>
            <Link
              href="/movies"
              className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase hover:text-accent transition-colors"
            >
              {t('viewAll')}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-card border border-border hover:bg-secondary transition-colors active:scale-90"
              aria-label="Scroll providers left"
            >
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-card border border-border hover:bg-secondary transition-colors active:scale-90"
              aria-label="Scroll providers right"
            >
              <ChevronRight size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Provider logos */}
        <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-hide pb-3 touch-pan-x md:gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-secondary animate-pulse"
                />
              ))
            : providers.map((provider) => (
                <Link
                  key={provider.provider_id}
                  href={`/movies?provider=${provider.provider_id}`}
                  className="group/provider flex w-24 flex-shrink-0 snap-start flex-col items-center gap-2 md:w-28"
                  title={provider.provider_name}
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-card border border-border group-hover/provider:border-accent transition-colors relative shadow-sm">
                    <Image
                      src={`https://image.tmdb.org/t/p/w154${provider.logo_path}`}
                      alt={provider.provider_name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover/provider:text-foreground transition-colors max-w-28 text-center line-clamp-1">
                    {provider.provider_name}
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
