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
  Users,
  Tv2,
  HelpCircle,
  Subtitles,
  FileText,
  Sliders,
  Radio,
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
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [customSubtitleName, setCustomSubtitleName] = useState<string | null>(null)
  const [savedProgress, setSavedProgress] = useState<any>(null)

  // Load preferred server & cinema mode from localStorage
  useEffect(() => {
    try {
      const prefServer = localStorage.getItem('7media_pref_server') as 'alpha' | 'beta' | 'gamma'
      if (prefServer && ['alpha', 'beta', 'gamma'].includes(prefServer)) {
        setActiveServer(prefServer)
      }
      const prefCinema = localStorage.getItem('7media_pref_cinema') === 'true'
      setIsCinemaMode(prefCinema)
    } catch {}
  }, [])

  const handleServerChange = (srv: 'alpha' | 'beta' | 'gamma') => {
    setActiveServer(srv)
    try {
      localStorage.setItem('7media_pref_server', srv)
    } catch {}
  }

  const toggleCinemaMode = () => {
    setIsCinemaMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem('7media_pref_cinema', String(next))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    setSavedProgress(getLocalProgressItem(titleId, type))
  }, [titleId, type])

  const { data: movieData } = useMovieDetails(isMovie ? titleId : null)
  const { data: showData } = useShowDetails(isMovie ? null : titleId)

  const data: any = isMovie ? movieData : showData
  const title = data ? (isMovie ? data.title : data.name) || 'Untitled' : 'Loading...'
  const recommendations =
    data?.recommendations?.results && data.recommendations.results.length > 0
      ? data.recommendations.results
      : data?.similar?.results && data.similar.results.length > 0
      ? data.similar.results
      : []
  const backdropUrl = data?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null
  const posterUrl = data?.poster_path
    ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
    : null

  // Extract official trailer / video key from TMDB
  const trailerVideo =
    data?.videos?.results?.find(
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

  // Handle custom subtitle drag and drop
  const handleSubtitleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file && (file.name.endsWith('.srt') || file.name.endsWith('.vtt'))) {
      setCustomSubtitleName(file.name)
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
      } else if (e.code === 'KeyC') {
        toggleCinemaMode()
      } else if (e.code === 'KeyF') {
        const player = document.getElementById('cinema-player-box')
        if (player) {
          if (!document.fullscreenElement) {
            player.requestFullscreen?.()
          } else {
            document.exitFullscreen?.()
          }
        }
      } else if (e.key === '?') {
        setShowShortcutsModal((prev) => !prev)
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
        <div
          className={`w-full transition-all duration-500 relative ${
            isCinemaMode
              ? 'bg-black/95 py-6 md:py-10 shadow-[0_0_100px_rgba(225,29,72,0.15)]'
              : 'bg-black border-b border-white/10'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleSubtitleDrop}
        >
          {/* Ambient Glow Backdrop (in Cinema Mode) */}
          {isCinemaMode && backdropUrl && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20 filter blur-3xl scale-110"
              style={{ backgroundImage: `url(${backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          )}

          <div
            id="cinema-player-box"
            className={`aspect-video w-full relative bg-zinc-950 flex items-center justify-center group overflow-hidden shadow-2xl transition-all duration-500 rounded-2xl md:rounded-3xl border border-white/10 ${
              isCinemaMode ? 'max-w-[1700px] mx-auto scale-100' : 'max-w-7xl mx-auto'
            }`}
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

                {/* Top Right Server Badge & Subtitle status */}
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  {customSubtitleName && (
                    <div className="hidden sm:flex items-center gap-1.5 rounded-2xl border border-cyan-500/40 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-cyan-400 backdrop-blur-xl">
                      <Subtitles size={13} />
                      <span>{customSubtitleName}</span>
                    </div>
                  )}

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
                  className="relative z-20 flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(225,29,72,0.6)] cursor-pointer group/play"
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
            {/* Title & Episode indicator */}
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
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-secondary/60 border border-border">
                <button
                  type="button"
                  onClick={() => handleServerChange('alpha')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeServer === 'alpha' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Server 1
                </button>
                <button
                  type="button"
                  onClick={() => handleServerChange('beta')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeServer === 'beta' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Server 2 (4K)
                </button>
                <button
                  type="button"
                  onClick={() => handleServerChange('gamma')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeServer === 'gamma' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Server 3
                </button>
              </div>

              {/* Cinema Mode Toggle */}
              <button
                type="button"
                onClick={toggleCinemaMode}
                className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isCinemaMode
                    ? 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/20'
                    : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground'
                }`}
                title="Toggle Theater / Cinema Mode"
              >
                <Tv2 size={14} />
                <span className="hidden sm:inline">Cinema Mode</span>
              </button>

              {/* Watch Party Launcher */}
              <Link
                href={`/party/7M-${titleId}`}
                className="flex items-center gap-1.5 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all shadow-md active:scale-95"
              >
                <Users size={14} />
                <span>Watch Party</span>
              </Link>

              {/* Keyboard Shortcuts Guide */}
              <button
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                className="p-2 rounded-2xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Player Keyboard Shortcuts"
              >
                <HelpCircle size={15} />
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/60 px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              {/* Next Episode Button (if series) */}
              {!isMovie && (
                <Link
                  href={`/watch/tv/${titleId}?season=${season}&episode=${episode + 1}`}
                  className="flex items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <span>Next Ep</span>
                  <FastForward size={14} />
                </Link>
              )}
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

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-border bg-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-foreground">Player Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <span className="text-muted-foreground">Play / Pause</span>
                <kbd className="px-2.5 py-1 rounded bg-zinc-800 border border-white/10 font-mono font-bold">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <span className="text-muted-foreground">Toggle Fullscreen</span>
                <kbd className="px-2.5 py-1 rounded bg-zinc-800 border border-white/10 font-mono font-bold">F</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <span className="text-muted-foreground">Cinema / Theater Mode</span>
                <kbd className="px-2.5 py-1 rounded bg-zinc-800 border border-white/10 font-mono font-bold">C</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <span className="text-muted-foreground">Toggle Mute / Unmute</span>
                <kbd className="px-2.5 py-1 rounded bg-zinc-800 border border-white/10 font-mono font-bold">M</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <span className="text-muted-foreground">Load Custom Subtitles</span>
                <span className="text-[11px] text-primary font-bold">Drag &amp; Drop .srt / .vtt</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

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
