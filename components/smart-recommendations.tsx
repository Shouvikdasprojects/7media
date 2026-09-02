'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ChevronLeft, ChevronRight, Play, Star, Film, Tv, Flame } from 'lucide-react'
import { getRecentlyViewed } from '@/lib/recently-viewed'

export function SmartRecommendations() {
  const [targetTitle, setTargetTitle] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const loadRecommendations = async () => {
      setLoading(true)
      const recentlyViewed = getRecentlyViewed()
      const latest = recentlyViewed[0]

      if (latest && latest.id) {
        setTargetTitle(latest.title)
        try {
          const endpoint = latest.type === 'tv'
            ? `/api/tmdb/tv/${latest.id}/recommendations`
            : `/api/tmdb/movie/${latest.id}/recommendations`
          
          const res = await fetch(endpoint).then((r) => r.json()).catch(() => ({ results: [] }))
          const items = (res.results || []).filter((item: any) => item.poster_path || item.backdrop_path)

          if (isMounted) {
            if (items.length > 0) {
              setRecommendations(items.slice(0, 16))
            } else {
              // Fallback to trending
              const fallback = await fetch('/api/tmdb/trending/movies?timeWindow=week').then((r) => r.json()).catch(() => ({ results: [] }))
              setRecommendations((fallback.results || []).slice(0, 16))
            }
          }
        } catch {
          if (isMounted) setRecommendations([])
        }
      } else {
        // Default smart curation
        setTargetTitle('Top Trending Blockbusters')
        try {
          const res = await fetch('/api/tmdb/popular/movies').then((r) => r.json()).catch(() => ({ results: [] }))
          if (isMounted) setRecommendations((res.results || []).slice(0, 16))
        } catch {}
      }

      if (isMounted) setLoading(false)
    }

    loadRecommendations()

    const handleUpdate = () => loadRecommendations()
    window.addEventListener('7media-recently-viewed-updated', handleUpdate)

    return () => {
      isMounted = false
      window.removeEventListener('7media-recently-viewed-updated', handleUpdate)
    }
  }, [])

  const handleScroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -500 : 500
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  if (!loading && recommendations.length === 0) return null

  return (
    <section className="px-4 md:px-8 lg:px-12 py-8 relative overflow-hidden">
      <div className="max-w-[1880px] mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={11} /> Personalized For You
              </span>
              <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                • Smart AI Matches
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-foreground uppercase tracking-tight flex items-center gap-2">
              <span>Because You Watched</span>
              <span className="text-primary truncate max-w-[280px] sm:max-w-md">&quot;{targetTitle || 'Cinema'}&quot;</span>
            </h2>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-2.5 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition active:scale-95 cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-2.5 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition active:scale-95 cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 touch-pan-x"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-40 sm:w-48 md:w-56 shrink-0 aspect-[2/3] rounded-2xl bg-card border border-border/50 animate-pulse"
              />
            ))
          ) : (
            recommendations.map((item) => {
              const isMovie = item.media_type !== 'tv' && (item.title || !item.name)
              const title = isMovie ? item.title : item.name
              const year = (item.release_date || item.first_air_date || '').split('-')[0]
              const link = `/title/${isMovie ? 'movie' : 'tv'}/${item.id}`

              return (
                <div
                  key={item.id}
                  className="w-36 sm:w-44 md:w-52 shrink-0 snap-start group relative flex flex-col"
                >
                  <Link
                    href={link}
                    className="block aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 relative ring-1 ring-border group-hover:ring-primary/60 transition-all duration-300 shadow-md"
                  >
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs px-2 text-center">
                        {title}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-95 transition-opacity" />

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40 transform group-hover:scale-110 transition-transform">
                        <Play size={18} fill="currentColor" />
                      </span>
                    </div>

                    {/* Rating Pill */}
                    {item.vote_average ? (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-amber-400 font-mono shadow-md">
                        <Star size={10} className="fill-amber-400" />
                        <span>{item.vote_average.toFixed(1)}</span>
                      </div>
                    ) : null}
                  </Link>

                  <div className="mt-2 px-0.5">
                    <Link href={link} className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {year ? `${year} • ` : ''}{isMovie ? 'Movie' : 'Series'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}