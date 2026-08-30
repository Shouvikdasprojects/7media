'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronDown,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  List,
  LayoutGrid,
  Film,
  Tv,
  Disc,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { tmdbClient } from '@/lib/tmdb/client'
import { AniListMedia } from '@/lib/anilist/types'
import {
  saveLocalProgress,
  getWatchedEpisodes,
  toggleWatchedEpisodeKey,
} from '@/lib/local-history'

interface AnimeEpisode {
  id: number
  episode_number: number
  name: string
  overview: string
  still_path: string | null
  air_date: string | null
  runtime: number | null
  vote_average: number
}

interface SeasonOption {
  id: number
  name: string
  season_number: number
  episode_count: number
  isSpecial?: boolean
}

export function AnimeEpisodeList({ anime }: { anime: AniListMedia }) {
  const [activeTab, setActiveTab] = useState<'episodes' | 'chronology'>('episodes')
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([])
  const [loading, setLoading] = useState(true)
  const [tmdbShowId, setTmdbShowId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<number, boolean>>({})

  const animeTitle = anime.title.english || anime.title.romaji || anime.title.native || ''

  // 1. Build Chronological Release Order Timeline (TV Seasons + OVAs + Movies + Specials)
  const chronologyTimeline = useMemo(() => {
    const entries = [
      {
        id: anime.id,
        isCurrent: true,
        relationType: 'CURRENT_ENTRY',
        title: animeTitle,
        format: anime.format || 'TV',
        status: anime.status,
        seasonYear: anime.seasonYear || anime.startDate?.year || 0,
        startDate: anime.startDate,
        episodes: anime.episodes || 1,
        averageScore: anime.averageScore,
        coverImage: anime.coverImage?.large || anime.coverImage?.medium || '/placeholder.svg',
      },
    ]

    const validFormats = ['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA', 'SPECIAL']
    for (const rel of anime.relations?.edges || []) {
      if (validFormats.includes(rel.node.format)) {
        entries.push({
          id: rel.node.id,
          isCurrent: rel.node.id === anime.id,
          relationType: rel.relationType,
          title: rel.node.title.english || rel.node.title.romaji || 'Anime Entry',
          format: rel.node.format,
          status: rel.node.status,
          seasonYear: rel.node.seasonYear || rel.node.startDate?.year || 0,
          startDate: rel.node.startDate,
          episodes: rel.node.episodes || 1,
          averageScore: rel.node.averageScore,
          coverImage: rel.node.coverImage?.large || rel.node.coverImage?.medium || '/placeholder.svg',
        })
      }
    }

    // Sort chronologically by start date / release year
    entries.sort((a, b) => {
      const yearA = a.startDate?.year || a.seasonYear || 0
      const yearB = b.startDate?.year || b.seasonYear || 0
      if (yearA !== yearB) return yearA - yearB
      const monthA = a.startDate?.month || 0
      const monthB = b.startDate?.month || 0
      if (monthA !== monthB) return monthA - monthB
      const dayA = a.startDate?.day || 0
      const dayB = b.startDate?.day || 0
      return dayA - dayB
    })

    return entries
  }, [anime, animeTitle])

  // 2. Match anime with TMDB Show to get all seasons (including Specials / Season 0)
  useEffect(() => {
    let isMounted = true
    async function loadTmdbData() {
      setLoading(true)
      try {
        const searchTitle = anime.title.english || anime.title.romaji || ''
        const searchRes = await fetch('/api/tmdb/search?query=' + encodeURIComponent(searchTitle))
        const searchData = await searchRes.json()

        const matchedShow = searchData.results?.find(
          (r: any) => r.media_type === 'tv' || r.name
        )

        if (matchedShow && isMounted) {
          setTmdbShowId(matchedShow.id)
          const detailsRes = await fetch('/api/tmdb/show/' + matchedShow.id)
          const details = await detailsRes.json()

          // Include regular seasons (S1, S2...) AND Specials / OVAs (Season 0)
          const validSeasons: SeasonOption[] = (details.seasons || []).map((s: any) => ({
            id: s.id,
            name: s.season_number === 0 ? 'Specials & OVAs' : s.name,
            season_number: s.season_number,
            episode_count: s.episode_count,
            isSpecial: s.season_number === 0,
          }))

          if (validSeasons.length > 0) {
            validSeasons.sort((a, b) => {
              if (a.season_number === 0) return 1
              if (b.season_number === 0) return -1
              return a.season_number - b.season_number
            })

            setSeasons(validSeasons)
            const initialSeason = validSeasons.find((s) => s.season_number > 0)?.season_number || 0
            setSelectedSeason(initialSeason)
            return
          }
        }
      } catch {
        // Fallback to AniList
      }

      if (isMounted) {
        const total = anime.episodes || 12
        const fallbackSeasons: SeasonOption[] = [
          {
            id: 1,
            name: anime.season ? `${anime.season} ${anime.seasonYear || ''}` : 'Season 1',
            season_number: 1,
            episode_count: total,
          },
        ]
        setSeasons(fallbackSeasons)
        setSelectedSeason(1)

        const fallbackEps: AnimeEpisode[] = Array.from({ length: total }, (_, i) => ({
          id: i + 1,
          episode_number: i + 1,
          name: `Episode ${i + 1}`,
          overview: `Episode ${i + 1} of ${animeTitle}.`,
          still_path: null,
          air_date: null,
          runtime: anime.duration || 24,
          vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
        }))
        setEpisodes(fallbackEps)
        setLoading(false)
      }
    }

    loadTmdbData()
    return () => {
      isMounted = false
    }
  }, [anime.id, anime.title.english, anime.title.romaji, anime.episodes, animeTitle])

  // 3. Fetch specific season / specials episodes when selectedSeason changes
  useEffect(() => {
    let isMounted = true
    if (!tmdbShowId) return

    async function fetchSeason() {
      setLoading(true)
      try {
        const res = await fetch(`/api/tmdb/season/${tmdbShowId}/${selectedSeason}`)
        const data = await res.json()
        if (data?.episodes && isMounted) {
          setEpisodes(data.episodes)
        }
      } catch {
        // fallback
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSeason()
    return () => {
      isMounted = false
    }
  }, [tmdbShowId, selectedSeason])

  useEffect(() => {
    const map = getWatchedEpisodes()
    const activeForThis: Record<number, boolean> = {}
    Object.keys(map).forEach((key) => {
      const prefix = `anime-${anime.id}-s${selectedSeason}-e`
      if (key.startsWith(prefix)) {
        const epNum = parseInt(key.replace(prefix, ''))
        if (!isNaN(epNum)) activeForThis[epNum] = true
      }
    })
    setWatchedEpisodes(activeForThis)
  }, [anime.id, selectedSeason])

  const toggleWatched = (epNumber: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const key = `anime-${anime.id}-s${selectedSeason}-e${epNumber}`
    const isNowWatched = toggleWatchedEpisodeKey(key)

    setWatchedEpisodes((prev) => ({
      ...prev,
      [epNumber]: isNowWatched,
    }))

    if (isNowWatched) {
      saveLocalProgress({
        tmdbId: anime.id,
        mediaType: 'anime',
        title: animeTitle,
        posterPath: anime.coverImage?.large || null,
        backdropPath: anime.bannerImage || null,
        season: selectedSeason,
        episode: epNumber,
        timestamp: 1440, // Completed 24 min episode
        duration: (anime.duration || 24) * 60,
      })
    }
  }

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'MOVIE':
        return { label: 'Movie', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
      case 'OVA':
        return { label: 'OVA', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
      case 'SPECIAL':
        return { label: 'Special', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' }
      case 'ONA':
        return { label: 'ONA', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
      default:
        return { label: 'TV Series', color: 'bg-primary/20 text-primary border-primary/40' }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Franchise Guide &amp; Episodes
          </h2>
          <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {chronologyTimeline.length} Franchise Titles
          </span>
        </div>

        {/* Tab Switcher: Episodes vs Chronological Release Order */}
        <div className="flex rounded-xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setActiveTab('episodes')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'episodes'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List size={14} />
            Episode Guide ({episodes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chronology')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'chronology'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={14} className={activeTab === 'chronology' ? 'text-primary' : ''} />
            Release &amp; Watch Order ({chronologyTimeline.length})
          </button>
        </div>
      </div>

      {/* --- TAB 1: CHRONOLOGICAL RELEASE & WATCH ORDER TIMELINE --- */}
      {activeTab === 'chronology' ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">🎬 Complete Release &amp; Watch Order:</strong> All TV Seasons, Feature Movies, OVAs, and Specials are listed in their official chronological release sequence. Click any entry to view its details and episodes.
          </div>

          <div className="relative pl-6 before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border space-y-4">
            {chronologyTimeline.map((item, index) => {
              const badge = getFormatBadge(item.format)
              const releaseDate = item.startDate?.year
                ? `${item.startDate.year}${item.startDate.month ? `-${String(item.startDate.month).padStart(2, '0')}` : ''}`
                : item.seasonYear || 'N/A'

              return (
                <div key={item.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-5 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 text-[10px] font-black ${
                      item.isCurrent
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Timeline Card */}
                  <Link
                    href={`/anime/${item.id}`}
                    className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200 ${
                      item.isCurrent
                        ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative aspect-[2/3] w-14 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-sm">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground p-1 text-center font-bold">
                            {item.title}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${badge.color}`}
                          >
                            {badge.label}
                          </span>

                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            {item.relationType.replace(/_/g, ' ')}
                          </span>

                          {item.isCurrent && (
                            <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground uppercase">
                              Currently Viewing
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Release: {releaseDate}
                          </span>
                          <span>•</span>
                          <span>{item.episodes} {item.episodes > 1 ? 'Episodes' : 'Episode / Film'}</span>
                          {item.averageScore ? (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-foreground">
                                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                                {item.averageScore}%
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline">
                        View Entry <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* --- TAB 2: SEASONS & EPISODES GUIDE --- */
        <div className="flex flex-col gap-6">
          {/* Season Selector & View Options */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {seasons.length > 1 && (
                <div className="relative min-w-52">
                  <label className="sr-only" htmlFor="anime-season-select">
                    Select season or specials
                  </label>
                  <select
                    id="anime-season-select"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="h-10 w-full appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 text-sm font-semibold text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        {s.name} ({s.episode_count} eps)
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                    aria-hidden="true"
                  />
                </div>
              )}

              {selectedSeason === 0 && (
                <span className="rounded-lg bg-pink-500/15 border border-pink-500/30 px-3 py-1.5 text-xs font-bold text-pink-300">
                  ✨ OVAs, Specials &amp; Side Episodes
                </span>
              )}
            </div>

            {/* Layout Toggle */}
            <div className="flex rounded-lg bg-secondary p-0.5" role="group" aria-label="View layout">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" aria-hidden="true" />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            /* --- LIST VIEW --- */
            <div className="flex flex-col gap-3">
              {episodes.map((ep) => {
                const isWatched = watchedEpisodes[ep.episode_number]
                const stillUrl = ep.still_path
                  ? tmdbClient.getImageUrl(ep.still_path, 'w500')
                  : anime.coverImage?.large || null

                return (
                  <div
                    key={ep.id || ep.episode_number}
                    className={`group flex flex-col sm:flex-row gap-4 rounded-xl border p-3.5 transition-all duration-200 ${
                      isWatched
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full sm:w-52 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {stillUrl ? (
                        <Image
                          src={stillUrl}
                          alt={ep.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 208px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute left-2.5 top-2.5 rounded bg-black/75 px-2 py-0.5 text-xs font-bold text-primary backdrop-blur-sm">
                        {selectedSeason === 0 ? `SPECIAL ${ep.episode_number}` : `EP ${ep.episode_number}`}
                      </div>

                      {ep.runtime ? (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
                          <Clock size={10} />
                          {ep.runtime}m
                        </div>
                      ) : null}
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                            {ep.name || `Episode ${ep.episode_number}`}
                          </h3>

                          <button
                            type="button"
                            onClick={(e) => toggleWatched(ep.episode_number, e)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                              isWatched
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                            title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                          >
                            <CheckCircle size={13} className={isWatched ? 'fill-emerald-400 text-black' : ''} />
                            <span>{isWatched ? 'Watched' : 'Mark'}</span>
                          </button>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                          {ep.overview || 'No synopsis available for this episode.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {ep.air_date && (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            {new Date(ep.air_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        {ep.vote_average > 0 && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Star size={13} className="fill-yellow-400 text-yellow-400" />
                            {ep.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* --- GRID VIEW --- */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {episodes.map((ep) => {
                const isWatched = watchedEpisodes[ep.episode_number]
                const stillUrl = ep.still_path
                  ? tmdbClient.getImageUrl(ep.still_path, 'w300')
                  : anime.coverImage?.large || null

                return (
                  <div
                    key={ep.id || ep.episode_number}
                    className={`group flex flex-col overflow-hidden rounded-xl border transition-all ${
                      isWatched ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                      {stillUrl ? (
                        <Image
                          src={stillUrl}
                          alt={ep.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground bg-secondary">
                          No preview
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-primary backdrop-blur-sm">
                        {selectedSeason === 0 ? `SP ${ep.episode_number}` : `EP ${ep.episode_number}`}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <h4 className="line-clamp-1 text-xs font-bold text-foreground">
                        {ep.name || `Episode ${ep.episode_number}`}
                      </h4>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{ep.runtime ? `${ep.runtime}m` : '24m'}</span>
                        <button
                          type="button"
                          onClick={(e) => toggleWatched(ep.episode_number, e)}
                          className={`${isWatched ? 'text-emerald-400 font-bold' : 'hover:text-primary'}`}
                        >
                          {isWatched ? 'Watched' : 'Mark'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
