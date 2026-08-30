'use client'

export function TitleDetailsSkeleton() {
  return (
    <div className="w-full animate-pulse select-none">
      {/* 1. Hero Skeleton */}
      <div className="relative min-h-[75vh] md:min-h-[80vh] flex items-end px-4 md:px-8 lg:px-12 pt-36 pb-14 max-w-[1880px] mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 lg:gap-12 w-full">
          {/* Poster Skeleton */}
          <div className="shrink-0 w-48 sm:w-60 md:w-68 lg:w-76 aspect-[2/3] rounded-3xl bg-zinc-900/90 border border-white/5 shadow-2xl" />

          {/* Metadata & Synopsis Skeleton */}
          <div className="flex flex-1 flex-col gap-4 w-full">
            {/* Pill badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-6 w-28 rounded-full bg-zinc-900/90 border border-white/5" />
              <div className="h-6 w-20 rounded-full bg-zinc-900/90 border border-white/5" />
              <div className="h-6 w-16 rounded-full bg-zinc-900/90 border border-white/5" />
              <div className="h-6 w-24 rounded-full bg-zinc-900/90 border border-white/5" />
            </div>

            {/* Title Bar */}
            <div className="h-10 sm:h-14 md:h-16 w-3/4 max-w-xl rounded-2xl bg-zinc-900/90 border border-white/5" />

            {/* Subtitle / Tagline */}
            <div className="h-4 w-1/2 max-w-md rounded-xl bg-zinc-900/60 border border-white/5" />

            {/* Genres Row */}
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-20 rounded-xl bg-zinc-900/80 border border-white/5" />
              <div className="h-6 w-24 rounded-xl bg-zinc-900/80 border border-white/5" />
              <div className="h-6 w-16 rounded-xl bg-zinc-900/80 border border-white/5" />
            </div>

            {/* Synopsis Paragraph Lines */}
            <div className="space-y-2 max-w-3xl pt-2">
              <div className="h-3.5 w-full rounded-lg bg-zinc-900/70" />
              <div className="h-3.5 w-11/12 rounded-lg bg-zinc-900/70" />
              <div className="h-3.5 w-4/5 rounded-lg bg-zinc-900/70" />
              <div className="h-3.5 w-2/3 rounded-lg bg-zinc-900/70" />
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <div className="h-12 w-36 rounded-2xl bg-primary/20 border border-primary/30" />
              <div className="h-12 w-28 rounded-2xl bg-zinc-900/90 border border-white/5" />
              <div className="h-12 w-32 rounded-2xl bg-purple-500/10 border border-purple-500/20" />
              <div className="h-12 w-12 rounded-2xl bg-zinc-900/90 border border-white/5" />
              <div className="h-12 w-12 rounded-2xl bg-zinc-900/90 border border-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. HUD Stats Row Skeleton */}
      <div className="max-w-[1880px] mx-auto px-4 md:px-8 lg:px-12 py-8 border-t border-b border-white/5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-zinc-900/60 border border-white/5 p-4 flex flex-col justify-between">
              <div className="h-3 w-16 rounded bg-zinc-800/80" />
              <div className="h-4 w-28 rounded bg-zinc-800/90" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Carousel Row Skeleton */}
      <div className="max-w-[1880px] mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="h-7 w-48 rounded-xl bg-zinc-900/90 border border-white/5 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-zinc-900/80 border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
