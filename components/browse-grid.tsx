'use client'

import { MediaCard } from '@/components/media-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TMDBMovie, TMDBShow } from '@/lib/tmdb/types'

interface BrowseGridProps {
  items: Array<TMDBMovie | TMDBShow>
  type: 'movie' | 'tv'
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function BrowseGrid({
  items,
  type,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: BrowseGridProps) {
  const maxPages = Math.min(totalPages, 500)

  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 md:gap-4 lg:gap-5">
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] animate-pulse rounded-2xl bg-secondary"
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-foreground">No results found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 md:gap-4 lg:gap-5">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} mediaType={type} />
        ))}
      </div>

      {maxPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-6 border-t border-border" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-10 items-center gap-1.5 px-4 rounded-xl border border-border bg-card text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>Previous</span>
          </button>
          <span className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Page <span className="font-bold text-foreground">{page}</span> of{' '}
            {maxPages.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= maxPages}
            className="flex h-10 items-center gap-1.5 px-4 rounded-xl border border-border bg-card text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
