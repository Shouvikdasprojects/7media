'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bookmark, Star, Clapperboard, Tv, Play, Info } from 'lucide-react'
import { tmdbClient } from '@/lib/tmdb/client'
import type { TMDBMedia } from '@/lib/tmdb/types'

interface MediaCardProps {
  item: TMDBMedia
  mediaType?: 'movie' | 'tv'
  showMeta?: boolean
  sizes?: string
}

export function getMediaTitle(item: TMDBMedia): string {
  return 'title' in item && item.title ? item.title : ('name' in item ? item.name : '')
}

export function getMediaYear(item: TMDBMedia): string | null {
  const date =
    'release_date' in item && item.release_date
      ? item.release_date
      : 'first_air_date' in item
        ? item.first_air_date
        : null
  if (!date) return null
  return String(new Date(date).getFullYear())
}

export function MediaCard({ item, mediaType, showMeta = false, sizes }: MediaCardProps) {
  const type = mediaType || item.media_type || ('title' in item ? 'movie' : 'tv')
  const title = getMediaTitle(item)
  const year = getMediaYear(item)
  const posterUrl = item.poster_path ? tmdbClient.getImageUrl(item.poster_path, 'w342') : null
  const rating = item.vote_average || 0

  return (
    <Link
      href={`/title/${type}/${item.id}`}
      className="group/card relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background select-none touch-manipulation active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-secondary shadow-md ring-1 ring-border/70 transition duration-300 group-hover/card:-translate-y-1 group-hover/card:shadow-xl group-hover/card:ring-primary/50 group-focus-visible/card:ring-primary">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-60 transition-opacity duration-300 group-hover/card:opacity-95" />
        {posterUrl ? (
          <Image
            src={posterUrl || "/placeholder.svg"}
            alt={title}
            fill
            sizes={sizes || '(max-width: 768px) 45vw, 230px'}
            className="object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs px-2 text-center">
            {title}
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-x-3 bottom-3 z-20 flex translate-y-2 items-center justify-between opacity-0 transition duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-md">
            <Play size={13} fill="currentColor" /> Watch
          </span>
          <span className="rounded-full bg-white/20 p-1.5 text-white backdrop-blur-md">
            <Info size={13} />
          </span>
        </div>

        {/* Top Overlay: Bookmark on Top-Left + Star Rating on Top-Right (Exact 7REELS Layout) */}
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between">
          <span className="p-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white/90 hover:text-accent transition-colors shadow-sm">
            <Bookmark size={14} />
            <span className="sr-only">Add {title} to watchlist</span>
          </span>

          {rating > 0 && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-bold text-white shadow-sm">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {showMeta && (
        <div className="mt-2.5 px-0.5">
          <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover/card:text-accent transition-colors">
            {title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {year && <span>{year}</span>}
            {year && <span aria-hidden="true"> · </span>}
            <span>{type === 'tv' ? 'TV' : 'Movie'}</span>
          </p>
        </div>
      )}
    </Link>
  )
}
