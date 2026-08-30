'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Tv, Film, Clock, Radio } from 'lucide-react'
import { AniListMedia } from '@/lib/anilist/types'
import { addToRecentlyViewed } from '@/lib/recently-viewed'

function formatCountdown(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function AnimeCard({ anime }: { anime: AniListMedia }) {
  const title = anime.title.english || anime.title.romaji || anime.title.native || 'Untitled Anime'
  const japaneseTitle = anime.title.native
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium || ''
  const score = anime.averageScore
  const studio = anime.studios?.nodes?.[0]?.name
  const isAiring = anime.status === 'RELEASING'
  const isMovie = anime.format === 'MOVIE'

  const handleClick = () => {
    addToRecentlyViewed({
      id: anime.id,
      type: 'anime',
      title,
      poster_path: posterUrl,
      backdrop_path: anime.bannerImage || null,
      vote_average: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : undefined,
      release_date: anime.startDate?.year ? String(anime.startDate.year) : undefined,
      genres: anime.genres || [],
    })
  }

  return (
    <Link
      href={`/anime/${anime.id}`}
      onClick={handleClick}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl select-none touch-manipulation active:scale-[0.97] active:border-primary"
    >
      {/* Poster image container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-secondary">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground text-xs px-2 text-center font-bold">
            {title}
          </div>
        )}

        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top Badges */}
        <div className="absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-1.5">
          {/* Format badge */}
          <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {isMovie ? <Film size={11} className="text-accent" /> : <Tv size={11} className="text-primary" />}
            {anime.format || 'TV'}
          </span>

          {/* Score Badge */}
          {score ? (
            <span className="flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md shadow-sm">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              {score}%
            </span>
          ) : null}
        </div>

        {/* Airing / Next Episode Countdown Badge */}
        {isAiring && anime.nextAiringEpisode ? (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-lg border border-emerald-500/30 bg-black/80 p-1.5 text-[11px] text-emerald-400 backdrop-blur-md flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">
              Ep {anime.nextAiringEpisode.episode} in {formatCountdown(anime.nextAiringEpisode.timeUntilAiring)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          {/* Studio & Season Year */}
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate font-medium text-primary">
              {studio || anime.season || 'Anime'}
            </span>
            {anime.seasonYear && <span>{anime.seasonYear}</span>}
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>

          {japaneseTitle && japaneseTitle !== title && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground/80">
              {japaneseTitle}
            </p>
          )}
        </div>

        {/* Genres */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {anime.genres?.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {genre}
            </span>
          ))}
          {anime.episodes ? (
            <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock size={10} />
              {anime.episodes} ep{anime.episodes > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
