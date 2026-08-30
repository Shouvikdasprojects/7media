'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { TrailerModal } from '@/components/trailer-modal'
import { AnimeCard } from '@/components/anime-card'
import { AnimeEpisodeList } from '@/components/anime-episode-list'
import { WatchlistButton } from '@/components/watchlist-button'
import { ShareModal } from '@/components/share-modal'
import { UserReviewModal, type UserReview } from '@/components/user-review-modal'
import { SoundtrackSection } from '@/components/soundtrack-section'
import { TitleDetailsSkeleton } from '@/components/title-skeleton'
import { useAnimeDetails } from '@/lib/anilist/hooks'
import { useSession } from '@/lib/auth-client'
import { getUserReactions, toggleUserReaction } from '@/app/actions/catalogs'
import { addToRecentlyViewed } from '@/lib/recently-viewed'
import {
  Play,
  Star,
  Tv,
  Calendar,
  Clock,
  Radio,
  Share2,
  ExternalLink,
  Users,
  Film,
  Sparkles,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MessageSquarePlus,
  Building2,
  BookOpen,
  Volume2,
  Flame,
  CheckCircle2,
  Video
} from 'lucide-react'

export default function AnimeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const animeId = parseInt(id)
  const { data: session } = useSession()

  const [trailerOpen, setTrailerOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviews, setReviews] = useState<UserReview[]>([])

  // Reactions state
  const [isWatched, setIsWatched] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)

  const { data: anime, isLoading } = useAnimeDetails(animeId)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`7media_reviews_${animeId}`)
      if (stored) setReviews(JSON.parse(stored))
    } catch {}

    if (session?.user) {
      getUserReactions().then((res) => {
        if (res.authenticated) {
          setIsWatched(res.watchedIds.includes(animeId))
          setIsLiked(res.likedIds.includes(animeId))
          setIsDisliked(res.dislikedIds.includes(animeId))
        }
      })
    } else {
      try {
        const w = JSON.parse(localStorage.getItem('7media_watched') || '[]')
        const l = JSON.parse(localStorage.getItem('7media_liked') || '[]')
        const d = JSON.parse(localStorage.getItem('7media_disliked') || '[]')
        setIsWatched(w.includes(animeId))
        setIsLiked(l.includes(animeId))
        setIsDisliked(d.includes(animeId))
      } catch {}
    }
  }, [animeId, session?.user])

  useEffect(() => {
    if (anime && animeId) {
      const animeTitle =
        anime.title.english || anime.title.romaji || anime.title.native || 'Untitled Anime'
      const posterUrl =
        anime.coverImage?.extraLarge ||
        anime.coverImage?.large ||
        anime.coverImage?.medium ||
        ''
      addToRecentlyViewed({
        id: animeId,
        type: 'anime',
        title: animeTitle,
        poster_path: posterUrl,
        backdrop_path: anime.bannerImage || null,
        vote_average: anime.averageScore
          ? (anime.averageScore / 10).toFixed(1)
          : undefined,
        release_date: anime.startDate?.year
          ? String(anime.startDate.year)
          : undefined,
        genres: anime.genres || [],
      })
    }
  }, [anime, animeId])

  const handleToggleReaction = async (reaction: 'watched' | 'liked' | 'disliked') => {
    if (reaction === 'watched') {
      const next = !isWatched
      setIsWatched(next)
      try {
        const w = JSON.parse(localStorage.getItem('7media_watched') || '[]')
        const updated = next ? [...w, animeId] : w.filter((x: number) => x !== animeId)
        localStorage.setItem('7media_watched', JSON.stringify(updated))
      } catch {}
    } else if (reaction === 'liked') {
      const next = !isLiked
      setIsLiked(next)
      if (next) setIsDisliked(false)
      try {
        const l = JSON.parse(localStorage.getItem('7media_liked') || '[]')
        const updated = next ? [...l, animeId] : l.filter((x: number) => x !== animeId)
        localStorage.setItem('7media_liked', JSON.stringify(updated))
        if (next) {
          const d = JSON.parse(localStorage.getItem('7media_disliked') || '[]')
          localStorage.setItem(
            '7media_disliked',
            JSON.stringify(d.filter((x: number) => x !== animeId))
          )
        }
      } catch {}
    } else if (reaction === 'disliked') {
      const next = !isDisliked
      setIsDisliked(next)
      if (next) setIsLiked(false)
      try {
        const d = JSON.parse(localStorage.getItem('7media_disliked') || '[]')
        const updated = next ? [...d, animeId] : d.filter((x: number) => x !== animeId)
        localStorage.setItem('7media_disliked', JSON.stringify(updated))
        if (next) {
          const l = JSON.parse(localStorage.getItem('7media_liked') || '[]')
          localStorage.setItem(
            '7media_liked',
            JSON.stringify(l.filter((x: number) => x !== animeId))
          )
        }
      } catch {}
    }

    if (session?.user) {
      await toggleUserReaction(animeId, 'tv', reaction)
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

  if (!anime || !anime.title) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-card p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Sparkles size={28} />
            </div>
            <h1 className="text-2xl font-black font-display uppercase tracking-tight text-foreground mb-2">
              Anime Not Found
            </h1>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              We couldn&apos;t load details for this anime from AniList. It may have been removed or the ID is invalid.
            </p>
            <Link
              href="/anime"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition shadow-md active:scale-95"
            >
              Browse All Anime
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native || 'Untitled Anime'
  const romajiTitle = anime.title.romaji
  const nativeTitle = anime.title.native
  const bannerUrl = anime.bannerImage || anime.coverImage?.extraLarge || null
  const posterUrl =
    anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium || ''
  const score = anime.averageScore
  const studio = anime.studios?.nodes?.[0]?.name
  const trailerId = anime.trailer?.site === 'youtube' ? anime.trailer.id : null
  const characters = anime.characters?.edges || []
  const relations = anime.relations?.edges || []
  const rawRecs =
    anime.recommendations?.nodes?.map((n) => n.mediaRecommendation).filter(Boolean) || []
  const relationsAsRecs = anime.relations?.edges?.map((e) => e.node).filter(Boolean) || []
  const recommendations = rawRecs.length > 0 ? rawRecs : relationsAsRecs

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-pink-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* 1. FUTURISTIC CYBER-ANIME HERO BANNER */}
        {/* ========================================================================= */}
        <section className="relative min-h-[85vh] flex items-end">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {bannerUrl && (
              <Image
                src={bannerUrl}
                alt=""
                fill
                priority
                className="object-cover object-top opacity-35 scale-105 transition-transform duration-1000 ease-out"
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent w-full md:w-3/4" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-[140px] pointer-events-none" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1880px] px-4 md:px-8 lg:px-12 pt-36 pb-14">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 lg:gap-12">
              {/* Cyber Poster */}
              {posterUrl && (
                <div className="relative group shrink-0 w-48 sm:w-60 md:w-68 lg:w-76 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] ring-1 ring-white/20 transition-all duration-500 hover:scale-[1.02] hover:ring-pink-500/60 hover:shadow-[0_0_50px_rgba(236,72,153,0.35)]">
                  <Image
                    src={posterUrl}
                    alt={title}
                    width={320}
                    height={480}
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                  {/* Japanese Native Watermark on Poster */}
                  {nativeTitle && (
                    <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
                      <span className="text-[10px] font-black text-pink-300/80 tracking-widest uppercase bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-pink-500/20">
                        {nativeTitle}
                      </span>
                    </div>
                  )}

                  {/* Top Anime Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-pink-500/30 text-[10px] font-black tracking-widest text-pink-400 shadow-lg">
                    <Sparkles size={11} />
                    <span>{anime.format || 'ANIME'}</span>
                  </div>
                </div>
              )}

              {/* Title & Metadata */}
              <div className="flex flex-1 flex-col gap-4 text-center md:text-left">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                    <Tv size={12} />
                    <span>{anime.format || 'Anime Series'}</span>
                  </span>

                  {anime.status === 'RELEASING' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Radio size={12} className="animate-pulse" />
                      <span>AIRING NOW</span>
                    </span>
                  )}

                  {anime.status === 'FINISHED' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
                      <span>COMPLETED</span>
                    </span>
                  )}

                  {score ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Star size={13} className="fill-amber-400" />
                      <span>{score}% AniList Score</span>
                    </span>
                  ) : null}

                  {anime.seasonYear && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
                      <Calendar size={12} className="text-zinc-400" />
                      <span>
                        {anime.season ? `${anime.season} ` : ''}
                        {anime.seasonYear}
                      </span>
                    </span>
                  )}

                  {studio && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                      <Building2 size={12} />
                      <span>{studio}</span>
                    </span>
                  )}
                </div>

                {/* Subtitle / Romaji */}
                {nativeTitle && nativeTitle !== title && (
                  <p className="text-xs sm:text-sm font-bold tracking-widest text-pink-400/90 font-mono">
                    {nativeTitle} {romajiTitle && romajiTitle !== title ? `• ${romajiTitle}` : ''}
                  </p>
                )}

                {/* Main Title */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display uppercase tracking-tight text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] leading-[1.08]">
                  {title}
                </h1>

                {/* Genres */}
                {anime.genres && anime.genres.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    {anime.genres.map((g) => (
                      <Link
                        key={g}
                        href={`/anime/genre/${g}`}
                        className="rounded-xl border border-white/15 bg-zinc-900/80 hover:border-pink-500/60 hover:bg-pink-500/20 px-3.5 py-1 text-xs font-bold text-zinc-300 hover:text-white transition-all backdrop-blur-md active:scale-95 shadow-sm"
                      >
                        {g}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                <p className="max-w-3xl text-xs sm:text-sm md:text-base leading-relaxed text-zinc-300 line-clamp-4 mt-1">
                  {anime.description?.replace(/<[^>]*>?/gm, '') ||
                    'Explore episodes, characters, chronology, and official original soundtracks.'}
                </p>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                  {/* Stream Player */}
                  <Link
                    href={`/watch/tv/${animeId}?season=1&episode=1`}
                    className="flex items-center gap-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 px-7 py-3.5 font-black uppercase text-xs sm:text-sm tracking-wider text-white transition-all duration-300 shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] active:scale-95 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Watch Anime</span>
                  </Link>

                  {/* Trailer Button */}
                  {trailerId && (
                    <button
                      type="button"
                      onClick={() => setTrailerOpen(true)}
                      className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3.5 font-bold uppercase text-xs sm:text-sm tracking-wider text-white transition-all backdrop-blur-xl active:scale-95 shadow-md cursor-pointer"
                    >
                      <Video size={16} className="text-pink-400" />
                      <span>Trailer</span>
                    </button>
                  )}

                  {/* Watch Party Virtual Cinema */}
                  <Link
                    href={`/party/7M-ANIME-${animeId}`}
                    className="flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/30 px-5 py-3.5 font-bold uppercase text-xs sm:text-sm tracking-wider text-purple-300 transition-all backdrop-blur-xl active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer"
                  >
                    <Users size={16} />
                    <span>Watch Party</span>
                  </Link>

                  {/* Watchlist Toggle */}
                  <WatchlistButton
                    item={{
                      id: animeId,
                      type: 'tv',
                      title,
                      posterPath: posterUrl,
                      voteAverage: score ? score / 10 : 0,
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
                        ? 'border-pink-500 bg-pink-500/20 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                        : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Like this anime"
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
                    title="Dislike this anime"
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
        {/* 2. ANIME HUD STATS */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-[1880px] px-4 md:px-8 lg:px-12 py-8 border-b border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Format & Total Episodes */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-pink-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-pink-400 mb-1">
                <Tv size={14} />
                <span>Episodes</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white">
                {anime.episodes ? `${anime.episodes} Episodes` : 'Ongoing Broadcast'}
              </p>
            </div>

            {/* Episode Duration */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                <Clock size={14} />
                <span>Duration</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white">
                {anime.duration ? `${anime.duration} mins / ep` : 'Standard TV Length'}
              </p>
            </div>

            {/* Source Material */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                <BookOpen size={14} />
                <span>Source</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {anime.source ? anime.source.replace(/_/g, ' ') : 'Original Work'}
              </p>
            </div>

            {/* Animation Studio */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                <Building2 size={14} />
                <span>Lead Studio</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {studio || 'Tokyo Animation Studio'}
              </p>
            </div>

            {/* Audio Track */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                <Volume2 size={14} />
                <span>Original Audio</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white">
                Japanese (JST Master)
              </p>
            </div>

            {/* Airing Status */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                <Radio size={14} />
                <span>Broadcast State</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {anime.status || 'Finished Airing'}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. OFFICIAL SOUNDTRACKS (OST) */}
        {/* ========================================================================= */}
        <SoundtrackSection mediaTitle={title} mediaType="anime" />

        {/* ========================================================================= */}
        {/* 4. EPISODE GUIDE & CHRONOLOGY */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-[1880px] px-4 md:px-8 lg:px-12 py-10">
          <AnimeEpisodeList anime={anime} />
        </section>

        {/* ========================================================================= */}
        {/* 5. CHARACTERS & VOICE ACTORS */}
        {/* ========================================================================= */}
        {characters.length > 0 && (
          <section className="mx-auto max-w-[1880px] border-t border-white/5 px-4 md:px-8 lg:px-12 py-12">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/25">
                  <Users size={18} />
                </span>
                <div>
                  <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white">
                    Characters &amp; Voice Cast (Seiyuu)
                  </h2>
                  <p className="text-xs text-zinc-400">Official voice actors and lead protagonists</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {characters.slice(0, 12).map((char) => {
                const charName = char.node.name.full || char.node.name.native || 'Character'
                const va = char.voiceActors?.[0]
                const charImg = char.node.image?.large || char.node.image?.medium
                return (
                  <div
                    key={char.id}
                    className="group rounded-2xl border border-white/10 bg-zinc-950/80 p-3 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-900 mb-2.5">
                        {charImg ? (
                          <Image
                            src={charImg}
                            alt={charName}
                            fill
                            sizes="(max-width: 640px) 140px, 200px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-black text-zinc-700">
                            {charName.charAt(0)}
                          </div>
                        )}
                        <span className="absolute left-2 top-2 rounded-md bg-black/80 px-2 py-0.5 text-[9px] font-black uppercase text-pink-300 backdrop-blur-md border border-pink-500/20">
                          {char.role}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-400 transition-colors line-clamp-1">
                        {charName}
                      </h4>
                    </div>

                    {va && (
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1 pt-1 border-t border-white/5">
                        🎙️ {va.name.full}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. FRANCHISE RELATIONS & CHRONOLOGY */}
        {/* ========================================================================= */}
        {relations.length > 0 && (
          <section className="mx-auto max-w-[1880px] border-t border-white/5 px-4 md:px-8 lg:px-12 py-12">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                <Layers size={18} />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Franchise Universe &amp; Chronology
                </h2>
                <p className="text-xs text-zinc-400">Prequels, sequels, movies, and spin-offs</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relations.map((rel) => {
                const relTitle = rel.node.title.english || rel.node.title.romaji || 'Related Anime'
                const cover = rel.node.coverImage?.large || rel.node.coverImage?.medium || ''
                return (
                  <Link
                    key={rel.id}
                    href={`/anime/${rel.node.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 transition-all hover:border-pink-500/50 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={relTitle}
                          fill
                          sizes="(max-width: 640px) 140px, 200px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                          {relTitle}
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-xl bg-black/80 px-2 py-0.5 text-[9px] font-bold uppercase text-pink-300 backdrop-blur-md border border-pink-500/20">
                        {rel.relationType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="line-clamp-1 text-xs font-bold text-white group-hover:text-pink-400 transition-colors">
                        {relTitle}
                      </h4>
                      <p className="text-[10px] text-zinc-400 uppercase mt-0.5">{rel.node.format || 'TV'}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 7. COMMUNITY REVIEWS */}
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
                    Verified Anime Reviews
                  </h2>
                  <p className="text-xs text-zinc-400">Otaku impressions &amp; analysis</p>
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
        {/* 8. RECOMMENDATIONS CAROUSEL */}
        {/* ========================================================================= */}
        {recommendations.length > 0 && (
          <section className="mx-auto max-w-[1880px] border-t border-white/5 px-4 md:px-8 lg:px-12 py-12">
            <div className="mb-6 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/25">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white">
                  You May Also Like
                </h2>
                <p className="text-xs text-zinc-400">Curated AniList recommendations for this title</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recommendations.slice(0, 12).map((rec: any) => (
                <AnimeCard key={rec.id} anime={rec} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeId={trailerId || null}
        title={title}
      />

      {/* Multi-Platform Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={title}
        overview={anime.description?.replace(/<[^>]*>?/gm, '')}
        posterUrl={posterUrl}
      />

      {/* Anime User Review Modal */}
      <UserReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        tmdbId={animeId}
        mediaType="tv"
        mediaTitle={title}
        onReviewSubmitted={(newRev) => setReviews((prev) => [newRev, ...prev])}
      />

      <Footer />
    </div>
  )
}
