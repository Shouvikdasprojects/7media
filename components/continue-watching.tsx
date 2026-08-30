'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Play, X, Trash2, History } from 'lucide-react'
import { getLocalHistory, removeLocalProgress, clearLocalHistory, LocalHistoryItem } from '@/lib/local-history'
import { tmdbClient } from '@/lib/tmdb/client'

export function ContinueWatching() {
  const [items, setItems] = useState<LocalHistoryItem[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setItems(getLocalHistory())

    const handleUpdate = () => {
      setItems(getLocalHistory())
    }

    window.addEventListener('7media-history-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('7media-history-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  if (!isClient || !items?.length) return null

  return (
    <section className="px-4 py-6 md:px-8 lg:px-12">
      <div className="max-w-[1880px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <History size={20} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-accent uppercase">Local Browser History</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground font-display uppercase tracking-tight">
                Continue Watching
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                clearLocalHistory()
                setItems([])
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 size={14} aria-hidden="true" /> Clear all
            </button>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase hover:text-accent transition-colors"
            >
              View Full History <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-3 touch-pan-x md:gap-3.5">
          {items.slice(0, 10).map((item) => {
            const percent = item.duration ? Math.min(100, Math.round((item.timestamp / item.duration) * 100)) : 45
            const href = item.mediaType === 'anime' ? `/anime/${item.tmdbId}` : `/watch/${item.mediaType}/${item.tmdbId}`
            const image = item.posterPath
              ? (item.posterPath.startsWith('http') ? item.posterPath : tmdbClient.getImageUrl(item.posterPath, 'w342'))
              : null

            return (
              <Link key={item.id} href={href} className="group w-[135px] flex-shrink-0 snap-start sm:w-[160px] md:w-[185px] lg:w-[210px] xl:w-[230px]">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card border border-border">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.title}
                      fill
                      sizes="210px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-xs text-muted-foreground p-2 text-center font-bold">
                      {item.title}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                      <Play size={20} fill="currentColor" />
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      removeLocalProgress(item.id)
                    }}
                    className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    aria-label={`Remove ${item.title} from continue watching`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-semibold text-white line-clamp-2">{item.title}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      {item.mediaType === 'tv' && item.season
                        ? `S${item.season} · E${item.episode || 1}`
                        : item.mediaType === 'anime'
                        ? `Episode ${item.episode || 1}`
                        : 'Movie'}
                    </p>
                    <div className="mt-2 h-1 rounded-full bg-white/30" aria-label={`${percent}% watched`}>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
