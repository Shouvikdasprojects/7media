'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { getLocalHistory, removeLocalProgress, clearLocalHistory, LocalHistoryItem } from '@/lib/local-history'
import { tmdbClient } from '@/lib/tmdb/client'
import { History, Trash2, X, Play } from 'lucide-react'

export default function HistoryPage() {
  const [items, setItems] = useState<LocalHistoryItem[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setItems(getLocalHistory())

    const handleUpdate = () => {
      setItems(getLocalHistory())
    }

    window.addEventListener('7media-history-updated', handleUpdate)
    return () => window.removeEventListener('7media-history-updated', handleUpdate)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-4 pb-16 pt-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1 text-accent">
                <History size={18} />
                <p className="text-xs font-bold uppercase tracking-[0.25em]">Browser Local Storage</p>
              </div>
              <h1 className="text-3xl font-black text-foreground md:text-5xl">Watch History</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Stored safely in your local browser — pick up where you left off anytime.
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearLocalHistory()
                  setItems([])
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:border-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto"
              >
                <Trash2 size={14} /> Clear All History
              </button>
            )}
          </div>

          {!isClient ? (
            <div className="py-20 text-center text-muted-foreground">Loading local history...</div>
          ) : items.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.map((item) => {
                const image = item.posterPath
                  ? (item.posterPath.startsWith('http') ? item.posterPath : tmdbClient.getImageUrl(item.posterPath, 'w342'))
                  : null
                const href = item.mediaType === 'anime' ? `/anime/${item.tmdbId}` : `/watch/${item.mediaType}/${item.tmdbId}`

                return (
                  <div key={item.id} className="group relative flex flex-col">
                    <Link href={href} className="relative aspect-[2/3] overflow-hidden rounded-xl bg-secondary border border-border">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 50vw, 220px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
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
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeLocalProgress(item.id)
                        }}
                        className="absolute right-2 top-2 z-10 rounded-full bg-black/75 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                        title="Remove from history"
                      >
                        <X size={14} />
                      </button>

                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="line-clamp-1 text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs text-white/70">
                          {item.mediaType === 'tv' && item.season
                            ? `S${item.season} · Ep ${item.episode || 1}`
                            : item.mediaType === 'anime'
                            ? `Episode ${item.episode || 1}`
                            : 'Movie'}
                        </p>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-border bg-card p-12 text-center">
              <History size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <h2 className="text-xl font-bold text-foreground">No watch history in this browser</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                As you explore movies, TV shows, and anime on 7MEDIA, your progress is automatically remembered right here in your browser.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/anime"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Explore Anime
                </Link>
                <Link
                  href="/movies"
                  className="rounded-xl border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary/80"
                >
                  Browse Movies
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
