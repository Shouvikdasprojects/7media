'use client'

import { use, useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MovieCarousel } from '@/components/movie-carousel'
import { EpisodeList } from '@/components/episode-list'
import { WatchlistButton } from '@/components/watchlist-button'
import { ShareModal } from '@/components/share-modal'
import { TrailerModal } from '@/components/trailer-modal'
import { UserReviewModal, type UserReview } from '@/components/user-review-modal'
import { SoundtrackSection } from '@/components/soundtrack-section'
import { TitleDetailsSkeleton } from '@/components/title-skeleton'
import { useMovieDetails, useShowDetails } from '@/lib/tmdb/hooks'
import { useSession } from '@/lib/auth-client'
import { getUserReactions, toggleUserReaction } from '@/app/actions/catalogs'
import { addToRecentlyViewed } from '@/lib/recently-viewed'
import Image from 'next/image'
import Link from 'next/link'
import {
  Play,
  Share2,
  Star,
  Calendar,
  Clock,
  Tv,
  Film,
  MessageSquarePlus,
  ShieldCheck,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Users,
  Building2,
  DollarSign,
  Globe2,
  Award,
  Video,
  Sparkles,
  TrendingUp,
  Radio,
  CheckCircle2,
  Flame,
  Layers,
  Disc3
} from 'lucide-react'

export default function TitlePage({
  params,
}: {
  params: Promise<{ type: 'movie' | 'tv'; id: string }>
}) {
  const { type, id } = use(params)
  const { data: session } = useSession()
  const titleId = parseInt(id)
  const isMovie = type === 'movie'

  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [trailerModalOpen, setTrailerModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviews, setReviews] = useState<UserReview[]>([])

  // Reactions state
  const [isWatched, setIsWatched] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)

  const { data: movieData, isLoading: isMovieLoading } = useMovieDetails(isMovie ? titleId : null)
  const { data: showData, isLoading: isShowLoading } = useShowDetails(isMovie ? null : titleId)

  const data: any = isMovie ? movieData : showData
  const isLoading = isMovie ? isMovieLoading : isShowLoading

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`7media_reviews_${titleId}`)
      if (stored) setReviews(JSON.parse(stored))
    } catch {}

    if (session?.user) {
      getUserReactions().then((res) => {
        if (res.authenticated) {
          setIsWatched(res.watchedIds.includes(titleId))
          setIsLiked(res.likedIds.includes(titleId))
          setIsDisliked(res.dislikedIds.includes(titleId))
        }
      })
    } else {
      try {
        const w = JSON.parse(localStorage.getItem('7media_watched') || '[]')
        const l = JSON.parse(localStorage.getItem('7media_liked') || '[]')
        const d = JSON.parse(localStorage.getItem('7media_disliked') || '[]')
        setIsWatched(w.includes(titleId))
        setIsLiked(l.includes(titleId))
        setIsDisliked(d.includes(titleId))
      } catch {}
    }
  }, [titleId, session?.user])

  useEffect(() => {
    if (data && titleId) {
      addToRecentlyViewed({
        id: titleId,
        type,
        title: isMovie ? data.title : data.name,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        vote_average: data.vote_average,
        release_date: isMovie ? data.release_date : data.first_air_date,
        genres: data.genres?.map((g: any) => g.name),
      })
    }
  }, [data, titleId, type, isMovie])

  const handleToggleReaction = async (reaction: 'watched' | 'liked' | 'disliked') => {
    if (reaction === 'watched') {
      const next = !isWatched
      setIsWatched(next)
      try {
        const w = JSON.parse(localStorage.getItem('7media_watched') || '[]')
        const updated = next ? [...w, titleId] : w.filter((x: number) => x !== titleId)
        localStorage.setItem('7media_watched', JSON.stringify(updated))
      } catch {}
    } else if (reaction === 'liked') {
      const next = !isLiked
      setIsLiked(next)
      if (next) setIsDisliked(false)
      try {
        const l = JSON.parse(localStorage.getItem('7media_liked') || '[]')
        const updated = next ? [...l, titleId] : l.filter((x: number) => x !== titleId)
        localStorage.setItem('7media_liked', JSON.stringify(updated))
        if (next) {
          const d = JSON.parse(localStorage.getItem('7media_disliked') || '[]')
          localStorage.setItem('7media_disliked', JSON.stringify(d.filter((x: number) => x !== titleId)))
        }
      } catch {}
    } else if (reaction === 'disliked') {
      const next = !isDisliked
      setIsDisliked(next)
      if (next) setIsLiked(false)
      try {
        const d = JSON.parse(localStorage.getItem('7media_disliked') || '[]')
        const updated = next ? [...d, titleId] : d.filter((x: number) => x !== titleId)
        localStorage.setItem('7media_disliked', JSON.stringify(updated))
        if (next) {
          const l = JSON.parse(localStorage.getItem('7media_liked') || '[]')
          localStorage.setItem('7media_liked', JSON.stringify(l.filter((x: number) => x !== titleId)))
        }
      } catch {}
    }

    if (session?.user) {
      await toggleUserReaction(titleId, type, reaction)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">
          <TitleDetailsSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  if (!data || (!data.title && !data.name)) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-card p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Film size={28} />
            </div>
            <h1 className="text-2xl font-black font-display uppercase tracking-tight text-foreground mb-2">
              Title Not Found
            </h1>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              We couldn&apos;t load details for this {isMovie ? 'movie' : 'series'}. It may have been removed or the ID is invalid.
            </p>
            <Link
              href={isMovie ? '/movies' : '/series'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition shadow-md active:scale-95"
            >
              Browse {isMovie ? 'Movies' : 'Series'}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const backdropUrl = data.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null
  const posterUrl = data.poster_path
    ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
    : null
  const title = isMovie ? data.title : data.name
  const year = isMovie
    ? data.release_date?.slice(0, 4)
    : data.first_air_date?.slice(0, 4)
  const recommendations =
    data.recommendations?.results && data.recommendations.results.length > 0
      ? data.recommendations.results
      : data.similar?.results && data.similar.results.length > 0
      ? data.similar.results
      : []

  // Extract Trailer key
  const trailerVideo =
    data.videos?.results?.find(
      (v: any) =>
        v.site === 'YouTube' &&
        (v.type === 'Trailer' || v.type === 'Teaser' || v.official)
    ) || data.videos?.results?.[0]
  const trailerKey = trailerVideo?.key || null

  // Extract Directors / Creators
  const directors = data.credits?.crew?.filter((c: any) => c.job === 'Director') || []
  const createdBy = data.created_by || []

  // Format currency
  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* 1. FUTURISTIC AMBIENT HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative min-h-[85vh] flex items-end">
          {/* Ambient Cyber Grid & Glow Lights */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {backdropUrl && (
              <Image
                src={backdropUrl}
                alt=""
                fill
                priority
                className="object-cover object-top opacity-40 scale-105 transition-transform duration-1000 ease-out"
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent w-full md:w-3/4" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
          </div>

          {/* Hero Content Box */}
          <div className="relative z-10 mx-auto w-full max-w-[1880px] px-4 md:px-8 lg:px-12 pt-36 pb-14">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 lg:gap-12">
              {/* Cyber Poster with Hologram Ring */}
              {posterUrl && (
                <div className="relative group shrink-0 w-48 sm:w-60 md:w-68 lg:w-76 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] ring-1 ring-white/20 transition-all duration-500 hover:scale-[1.02] hover:ring-primary/60 hover:shadow-[0_0_50px_rgba(229,9,20,0.35)]">
                  <Image
                    src={posterUrl}
                    alt={`${title} poster`}
                    width={320}
                    height={480}
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                  {/* 4K UHD Cyber Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[10px] font-black tracking-widest text-white shadow-lg">
                    <Sparkles size={11} className="text-primary" />
                    <span>4K ULTRA HD</span>
                  </div>

                  {/* Dolby Atmos / 5.1 Badge */}
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[10px] font-black tracking-widest text-cyan-300 shadow-lg">
                    DOLBY ATMOS
                  </div>
                </div>
              )}

              {/* Title & Metadata HUD */}
              <div className="flex flex-1 flex-col gap-4 text-center md:text-left">
                {/* Format Tag & Score Pill */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary shadow-[0_0_15px_rgba(229,9,20,0.25)]">
                    {isMovie ? <Film size={12} /> : <Tv size={12} />}
                    <span>{isMovie ? 'Feature Movie' : 'Television Series'}</span>
                  </span>

                  {data.vote_average > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Star size={13} className="fill-amber-400" />
                      <span>{data.vote_average.toFixed(1)} / 10</span>
                      <span className="text-[10px] text-amber-300/60 font-mono font-normal">
                        ({data.vote_count?.toLocaleString()} votes)
                      </span>
                    </span>
                  )}

                  {year && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
                      <Calendar size={12} className="text-zinc-400" />
                      <span>{year}</span>
                    </span>
                  )}

                  {isMovie && data.runtime ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
                      <Clock size={12} className="text-zinc-400" />
                      <span>
                        {Math.floor(data.runtime / 60)}h {data.runtime % 60}m
                      </span>
                    </span>
                  ) : null}

                  {!isMovie && data.number_of_seasons ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
                      <Tv size={12} className="text-zinc-400" />
                      <span>
                        {data.number_of_seasons} Season{data.number_of_seasons > 1 ? 's' : ''}
                      </span>
                    </span>
                  ) : null}

                  {data.status && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{data.status}</span>
                    </span>
                  )}
                </div>

                {/* Main Cyber Title */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display uppercase tracking-tight text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] leading-[1.08]">
                  {title}
                </h1>

                {/* Tagline */}
                {data.tagline && (
                  <p className="text-xs sm:text-sm font-medium italic text-zinc-300/90 tracking-wide border-l-2 border-primary pl-3">
                    &quot;{data.tagline}&quot;
                  </p>
                )}

                {/* Genres Pills */}
                {data.genres && data.genres.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    {data.genres.map((g: { id: number; name: string }) => (
                      <Link
                        key={g.id}
                        href={isMovie ? `/movies/genre/${g.id}` : `/series/genre/${g.id}`}
                        className="rounded-xl border border-white/15 bg-zinc-900/80 hover:border-primary/60 hover:bg-primary/20 px-3.5 py-1 text-xs font-bold text-zinc-300 hover:text-white transition-all backdrop-blur-md active:scale-95 shadow-sm"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Overview Synopsis */}
                <p className="max-w-3xl text-xs sm:text-sm md:text-base leading-relaxed text-zinc-300 line-clamp-4 mt-1">
                  {data.overview || 'Experience the official cinematic storyline, comprehensive cast guide, full episodes, and soundtracks.'}
                </p>

                {/* ========================================================================= */}
                {/* ACTION BUTTONS HUD */}
                {/* ========================================================================= */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                  {/* Primary Watch / Stream Button */}
                  <Link
                    href={`/watch/${type}/${titleId}`}
                    className="flex items-center gap-2.5 rounded-2xl bg-primary hover:bg-primary/90 px-7 py-3.5 font-black uppercase text-xs sm:text-sm tracking-wider text-primary-foreground transition-all duration-300 shadow-[0_0_30px_rgba(229,9,20,0.4)] hover:shadow-[0_0_40px_rgba(229,9,20,0.6)] active:scale-95 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Watch Player</span>
                  </Link>

                  {/* Trailer Modal Button */}
                  {trailerKey && (
                    <button
                      type="button"
                      onClick={() => setTrailerModalOpen(true)}
                      className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3.5 font-bold uppercase text-xs sm:text-sm tracking-wider text-white transition-all backdrop-blur-xl active:scale-95 shadow-md cursor-pointer"
                    >
                      <Video size={16} className="text-primary" />
                      <span>Trailer</span>
                    </button>
                  )}

                  {/* Watch Party Virtual Cinema */}
                  <Link
                    href={`/party/7M-${titleId}`}
                    className="flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/30 px-5 py-3.5 font-bold uppercase text-xs sm:text-sm tracking-wider text-purple-300 transition-all backdrop-blur-xl active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer"
                  >
                    <Users size={16} />
                    <span>Watch Party</span>
                  </Link>

                  {/* Watchlist Toggle */}
                  <WatchlistButton
                    item={{
                      id: titleId,
                      type,
                      title,
                      posterPath: data.poster_path,
                      voteAverage: data.vote_average,
                    }}
                  />

                  {/* Watched Action */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction('watched')}
                    className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3.5 font-bold text-xs uppercase tracking-wider transition-all backdrop-blur-xl active:scale-95 cursor-pointer ${
                      isWatched
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={isWatched ? 'Marked as Watched' : 'Mark as Watched'}
                  >
                    <Eye size={15} />
                    <span>{isWatched ? 'Watched' : 'Watch'}</span>
                  </button>

                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction('liked')}
                    className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3.5 font-bold text-xs uppercase tracking-wider transition-all backdrop-blur-xl active:scale-95 cursor-pointer ${
                      isLiked
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Like this title"
                  >
                    <ThumbsUp size={15} />
                    <span>Like</span>
                  </button>

                  {/* Dislike Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction('disliked')}
                    className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3.5 font-bold text-xs uppercase tracking-wider transition-all backdrop-blur-xl active:scale-95 cursor-pointer ${
                      isDisliked
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                        : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Dislike this title"
                  >
                    <ThumbsDown size={15} />
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 hover:bg-zinc-800 px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-zinc-300 hover:text-white transition-all backdrop-blur-xl active:scale-95 cursor-pointer"
                  >
                    <Share2 size={15} />
                  </button>

                  {/* Write Review Button */}
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 px-5 py-3.5 font-bold text-xs uppercase tracking-wider text-amber-400 transition-all backdrop-blur-xl active:scale-95 shadow-md cursor-pointer"
                  >
                    <MessageSquarePlus size={15} />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CINEPHILE HUD STATS & BOX OFFICE METRICS */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-[1880px] px-4 md:px-8 lg:px-12 py-8 border-b border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Director / Creator */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                <Users size={14} />
                <span>{isMovie ? 'Director' : 'Creator'}</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {isMovie
                  ? directors.map((d: any) => d.name).join(', ') || 'N/A'
                  : createdBy.map((c: any) => c.name).join(', ') || 'Various Creators'}
              </p>
            </div>

            {/* Original Audio */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                <Globe2 size={14} />
                <span>Audio Master</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white uppercase">
                {data.original_language || 'English'} (Stereo/Atmos)
              </p>
            </div>

            {/* Budget (if movie) */}
            {isMovie && data.budget > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  <DollarSign size={14} />
                  <span>Production Budget</span>
                </div>
                <p className="text-xs sm:text-sm font-black text-white">
                  {formatCurrency(data.budget)}
                </p>
              </div>
            ) : null}

            {/* Box Office Revenue (if movie) */}
            {isMovie && data.revenue > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-amber-500/40 transition-colors">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <Award size={14} />
                  <span>Worldwide Gross</span>
                </div>
                <p className="text-xs sm:text-sm font-black text-white">
                  {formatCurrency(data.revenue)}
                </p>
              </div>
            ) : null}

            {/* Total Episodes (if TV) */}
            {!isMovie && data.number_of_episodes ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-pink-500/40 transition-colors">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-pink-400 mb-1">
                  <Tv size={14} />
                  <span>Episode Count</span>
                </div>
                <p className="text-xs sm:text-sm font-black text-white">
                  {data.number_of_episodes} Total Episodes
                </p>
              </div>
            ) : null}

            {/* Studio / Production Company */}
            {data.production_companies && data.production_companies.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                  <Building2 size={14} />
                  <span>Production House</span>
                </div>
                <p className="text-xs sm:text-sm font-black text-white truncate">
                  {data.production_companies[0]?.name}
                </p>
              </div>
            )}

            {/* Status / Broadcast */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                <Radio size={14} />
                <span>Stream Status</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {data.status || 'Released / Streaming'}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. OFFICIAL SOUNDTRACKS (OST) SECTION */}
        {/* ========================================================================= */}
        <SoundtrackSection mediaTitle={title} mediaType={type} />

        {/* ========================================================================= */}
        {/* 4. TV EPISODE SELECTOR & EPISODE GUIDE */}
        {/* ========================================================================= */}
        {!isMovie && data.seasons && (
          <section className="mx-auto max-w-[1880px] px-4 md:px-8 lg:px-12 py-10">
            <EpisodeList
              showId={titleId}
              seasons={data.seasons.filter((s: { season_number: number }) => s.season_number > 0)}
            />
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. TOP CAST & CHARACTER GALLERY */}
        {/* ========================================================================= */}
        {data.credits?.cast && data.credits.cast.length > 0 && (
          <section className="mx-auto max-w-[1880px] border-t border-white/5 px-4 md:px-8 lg:px-12 py-12">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/25">
                  <Users size={18} />
                </span>
                <div>
                  <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white">
                    Starring Cast &amp; Characters
                  </h2>
                  <p className="text-xs text-zinc-400">Official TMDB credited performers</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.credits.cast
                .slice(0, 12)
                .map((actor: { id: number; name: string; character: string; profile_path: string | null }) => (
                  <div
                    key={actor.id}
                    className="group rounded-2xl border border-white/10 bg-zinc-950/80 p-3 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-md"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-900 mb-2.5">
                      {actor.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w342${actor.profile_path}`}
                          alt={actor.name}
                          fill
                          sizes="(max-width: 640px) 140px, 200px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-black text-zinc-700">
                          {actor.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                      {actor.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {actor.character || 'Cast Member'}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. COMMUNITY REVIEWS & RATINGS */}
        {/* ========================================================================= */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-[1880px] border-t border-white/5 px-4 md:px-8 lg:px-12 py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Star size={18} />
                </span>
                <div>
                  <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white">
                    Verified Cinephile Reviews
                  </h2>
                  <p className="text-xs text-zinc-400">Community impressions &amp; commentary</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider transition cursor-pointer"
              >
                + Write a Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs border border-amber-500/30">
                        {rev.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{rev.userName}</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 text-xs font-black bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                      <Star size={12} className="fill-amber-400" />
                      <span>{rev.score} / 10</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1.5">{rev.title}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{rev.content}</p>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
                      {rev.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-900 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 7. RECOMMENDATIONS & SIMILAR UNIVERSE */}
        {/* ========================================================================= */}
        {recommendations.length > 0 && (
          <section className="mx-auto max-w-[1880px] border-t border-white/5 px-4 md:px-8 lg:px-12 py-12">
            <MovieCarousel
              title="You May Also Like"
              movies={recommendations.slice(0, 18)}
              mediaType={type}
            />
          </section>
        )}
      </main>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        youtubeId={trailerKey}
        title={title}
      />

      {/* Interactive Multi-Platform Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={title}
        overview={data?.overview}
        posterUrl={posterUrl}
      />

      {/* User Review Modal */}
      <UserReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        tmdbId={titleId}
        mediaType={type}
        mediaTitle={title}
        onReviewSubmitted={(newRev) => setReviews((prev) => [newRev, ...prev])}
      />

      <Footer />
    </div>
  )
}
