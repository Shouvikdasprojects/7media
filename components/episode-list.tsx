import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSeasonDetails } from '@/lib/tmdb/hooks'
import { ChevronDown, Play, Star } from 'lucide-react'

interface Season {
  id: number
  name: string
  season_number: number
  episode_count?: number
}

interface EpisodeListProps {
  showId: number
  seasons: Season[]
  activeSeason?: number
  activeEpisode?: number
}

export function EpisodeList({ showId, seasons, activeSeason, activeEpisode }: EpisodeListProps) {
  const [selectedSeason, setSelectedSeason] = useState(
    activeSeason || seasons[0]?.season_number || 1
  )
  const { data, isLoading } = useSeasonDetails(showId, selectedSeason)

  if (seasons.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground md:text-2xl">Episodes</h2>
        <div className="relative">
          <label className="sr-only" htmlFor="season-select">
            Select season
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
            className="h-9 appearance-none rounded-md border border-border bg-secondary pl-3 pr-8 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.season_number}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.episodes.map((ep) => {
            const isCurrent = activeSeason === selectedSeason && activeEpisode === ep.episode_number
            return (
              <Link
                key={ep.id}
                href={`/watch/tv/${showId}?season=${selectedSeason}&episode=${ep.episode_number}`}
                className={`group flex gap-4 rounded-2xl border p-3.5 transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/40'
                }`}
              >
                <div className="relative aspect-video w-32 flex-shrink-0 overflow-hidden rounded-xl bg-secondary sm:w-44 shadow-sm">
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                      alt={ep.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No preview
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-8 w-8 fill-white text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isCurrent
                          ? 'bg-emerald-500 text-black font-black'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      E{ep.episode_number}
                    </span>
                    <h3 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {ep.name}
                    </h3>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {ep.overview || 'No description available.'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {ep.runtime ? <span>{ep.runtime} min</span> : null}
                    {ep.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                        <Star className="h-3 w-3 fill-yellow-400" aria-hidden="true" />
                        {ep.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
