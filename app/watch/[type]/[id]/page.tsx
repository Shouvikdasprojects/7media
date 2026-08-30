'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MovieCarousel } from '@/components/movie-carousel'
import { EpisodeList } from '@/components/episode-list'
import { ShareModal } from '@/components/share-modal'
import { useMovieDetails, useShowDetails } from '@/lib/tmdb/hooks'
import { saveLocalProgress, getLocalProgressItem } from '@/lib/local-history'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  ShieldAlert,
  ExternalLink,
  Server,
  Share2,
  FastForward,
  RotateCcw,
  Sparkles,
  Check,
  Film,
  Tv,
  ArrowRight,
  Info,
  Users
} from 'lucide-react'

export default function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: 'movie' | 'tv'; id: string }>
  searchParams?: Promise<{ season?: string; episode?: string }>
}) {
  const { type, id } = use(params)
  const query = searchParams ? use(searchParams) : {}
  const season = Number(query.season || 1)
  const episode = Number(query.episode || 1)
  const titleId = parseInt(id)
  const isMovie = type === 'movie'

  const [activeServer, setActiveServer] = useState<'alpha' | 'beta' | 'gamma'>('alpha')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showLicenseNotice, setShowLicenseNotice] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [savedProgress, setSavedProgress] = useState<any>(null)

  useEffect(() => {
    setSavedProgress(getLocalProgressItem(titleId, type))
  }, [titleId, type])

  const { data: movieData } = useMovieDetails(isMovie ? titleId : null)
  const { data: showData } = useShowDetails(isMovie ? null : titleId)

  const data: any = isMovie ? movieData : showData
  const title = data ? (isMovie ? data.title : data.name) || 'Untitled' : 'Loading...'
  const recommendations =
    (data?.recommendations?.results && data.recommendations.results.length > 0)
      ? data.recommendations.results
      : (data?.similar?.results && data.similar.results.length > 0)
      ? data.similar.results
      : []
  const backdropUrl = data?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null
  const posterUrl = data?.poster_path
    ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
    : null

  // Extract official trailer / video key from TMDB
  const trailerVideo = data?.videos?.results?.find(
    (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.official)
  ) || data?.videos?.results?.[0]
  const trailerKey = trailerVideo?.key || null

  const handlePlay = () => {
    setIsPlaying(true)
    if (data) {
      saveLocalProgress({
        tmdbId: titleId,
        mediaType: type,
        title,
        posterPath: data.poster_path,
        backdropPath: data.backdrop_path,
        season: isMovie ? null : season,
        episode: isMovie ? null : episode,
        timestamp: 120,
        duration: isMovie && data.runtime ? data.runtime * 60 : 3600,
      })
    }
  }

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) {
          setIsPlaying(false)
        } else {
          handlePlay()
        }
      } else if (e.code === 'KeyM') {
        setIsMuted((prev) => !prev)
      } else if (e.code === 'KeyF') {
        const player = document.getElementById('cinema-player-box')
        if (player) {
          if (!document.fullscreenElement) {
            player.requestFullscreen?.()
          } else {
            document.exitFullscreen?.()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, data])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-20 md:pt-24">
        {/* Cinema Video Player Container */}
        <div className="w-full bg-black border-b border-white/10">
          <div
            id="cinema-player-box"
            className="aspect-video w-full max-w-7xl mx-auto relative bg-zinc-950 flex items-center justify-center group overflow-hidden shadow-2xl"
          >
            {/* If playing and trailerKey exists, embed real video stream */}
            {isPlaying && trailerKey ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                title={`${title} Cinema Player`}
                className="w-full h-full border-0 absolute inset-0 z-10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <>
                {/* Backdrop as player backdrop */}
                {backdropUrl && (
                  <Image
                    src={backdropUrl}
                    alt=""
                    fill
                    priority
                    className="object-cover opacity-45 filter brightness-90 group-hover:scale-102 transition-transform duration-700"
                    aria-hidden="true"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />

                {/* Top Left Title Badge */}
                <div className="absolute left-4 top-4 z-20 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white backdrop-blur-xl shadow-lg">
                  <span className="font-black font-display uppercase tracking-tight text-sm">{title}</span>
                  {!isMovie && (
                    <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                      S{String(season).padStart(2, '0')} · E{String(episode).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Top Right Server Badge */}
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-black/60 px-3.5 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-xl">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="uppercase tracking-wider">
                      {activeServer === 'alpha'
                        ? 'Server 1: Alpha Fast CDN (1080p)'
                        : activeServer === 'beta'
                        ? 'Server 2: Beta Cinema (4K UHD)'
                        : 'Server 3: Multi-Audio & Subs'}
                    </span>
                  </div>
                </div>

                {/* Big Center Play Button */}
                <button
                  onClick={handlePlay}
                  className="relative z-20 flex items-center justify-center w-24 h-24 rounded-full bg-accent text-accent-foreground hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(229,9,20,0.6)] cursor-pointer group/play"
                  aria-label={`Play ${title}`}
                >
                  <Play size={44} fill="currentColor" className="ml-1 text-white group-hover/play:scale-105 transition-transform" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Player Controls & Server Switcher Bar */}
        <div className="border-b border-border bg-card/60 px-4 py-4 backdrop-blur-md md:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            {/* Title & Hub Link */}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
                  {title}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {!isMovie ? `Season ${season} Episode ${episode}` : 'Feature Film'} · High Speed Streaming Hub
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Server Switchers */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-900 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveServer('alpha')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeServer === 'alpha' ? 'bg-primary text-primary-foreground shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Server 1
                </button>
                <button
                  type="button"
                  onClick={() => setActiveServer('beta')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeServer === 'beta' ? 'bg-primary text-primary-foreground shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Server 2 (4K)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveServer('gamma')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeServer === 'gamma' ? 'bg-primary text-primary-foreground shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Server 3
                </button>
              </div>

              {/* Watch Party Launcher */}
              <Link
                href={`/party/7M-${titleId}`}
                className="flex items-center gap-1.5 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all shadow-md active:scale-95"
              >
                <Users size={14} />
                <span>Watch Party</span>
              </Link>

              {/* Share Button */}
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-all shadow-md active:scale-95"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              {/* Back to Details */}
              <Link
                href={`/title/${type}/${titleId}`}
                className="flex items-center gap-1 rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-md active:scale-95"
              >
                <span>Details Page</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* TV Episode Selector (if series) */}
        {!isMovie && data?.seasons && (
          <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
            <EpisodeList
              showId={titleId}
              seasons={data.seasons.filter((s: { season_number: number }) => s.season_number > 0)}
              activeSeason={season}
              activeEpisode={episode}
            />
          </section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <MovieCarousel
              title="More Like This"
              movies={recommendations.slice(0, 18)}
              mediaType={type}
            />
          </section>
        )}
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={title}
        overview={data?.overview}
        posterUrl={posterUrl}
      />

      <Footer />
    </div>
  )
}
