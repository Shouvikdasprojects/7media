'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
  Film,
  Tv,
  Sparkles,
  X,
  Clock
} from 'lucide-react'
import {
  getRecentlyViewed,
  removeFromRecentlyViewed,
  clearRecentlyViewed,
  type RecentlyViewedItem
} from '@/lib/recently-viewed'

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [isClient, setIsClient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const loadItems = () => {
    setItems(getRecentlyViewed())
  }

  useEffect(() => {
    setIsClient(true)
    loadItems()

    const handleUpdate = () => {
      loadItems()
    }

    window.addEventListener('7media-recently-viewed-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('7media-recently-viewed-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault()
    clearRecentlyViewed()
    setItems([])
  }

  const handleRemoveSingle = (e: React.MouseEvent, id: number, type: string) => {
    e.preventDefault()
    e.stopPropagation()
    removeFromRecentlyViewed(id, type)
    setItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)))
  }

  if (!isClient || items.length === 0) return null

  return (
    <section aria-label="Recently Viewed" className="relative my-8 select-none">
      <div className="mx-auto max-w-[1880px] px-4 md:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25 shadow-[0_0_15px_rgba(229,9,20,0.2)]">
              <History size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-tight text-white">
                  Recently Viewed
                </h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                  {items.length}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Continue exploring titles you previously opened
              </p>
            </div>
          </div>

          {/* Controls: Clear & Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 px-3 py-1.5 text-xs font-bold text-zinc-400 transition-all active:scale-95 cursor-pointer"
              title="Clear all recently viewed"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear History</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="p-1.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95"
                title="Scroll Left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="p-1.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95"
                title="Scroll Right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 overflow-x-auto scrollbar-hide py-2 overscroll-x-contain touch-pan-x"
        >
          {items.map((item) => {
            const href =
              item.type === 'anime'
                ? `/anime/${item.id}`
                : `/title/${item.type}/${item.id}`
            const posterSrc = item.poster_path
              ? item.poster_path.startsWith('http')
                ? item.poster_path
                : `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : null

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="group relative w-36 sm:w-44 md:w-48 shrink-0 rounded-2xl border border-white/10 bg-zinc-950/80 hover:border-white/25 transition-all duration-300 shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
              >
                {/* Delete button on card */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveSingle(e, item.id, item.type)}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white/70 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                  title="Remove from history"
                >
                  <X size={12} />
                </button>

                <Link href={href} className="flex-1 flex flex-col">
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                    {posterSrc ? (
                      <Image
                        src={posterSrc}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 144px, 192px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900 text-zinc-500">
                        <Film size={24} className="mb-1" />
                        <span className="text-[10px] font-bold text-white line-clamp-2">
                          {item.title}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md ${
                          item.type === 'anime'
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : item.type === 'tv'
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-primary/20 border-primary/40 text-primary'
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Rating Badge */}
                    {item.vote_average && (
                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-bold text-yellow-400">
                        <Star size={10} className="fill-yellow-400" />
                        <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : item.vote_average}</span>
                      </div>
                    )}
                  </div>

                  {/* Title Info */}
                  <div className="p-3">
                    <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1 truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                      {item.release_date && <span>{item.release_date.substring(0, 4)}</span>}
                      {item.release_date && <span>·</span>}
                      <span className="capitalize">{item.type}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
