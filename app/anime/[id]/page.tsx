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
import { useAnimeDetails } from '@/lib/anilist/hooks'
import { useSession } from '@/lib/auth-client'
import { getUserReactions, toggleUserReaction } from '@/app/actions/catalogs'
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
  BookOpen,
  Building2,
  Award,
  Video
} from 'lucide-react'

export default function AnimeDetailPage({
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
          localStorage.setItem('7media_disliked', JSON.stringify(d.filter((x: number) => x !== animeId)))
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
          localStorage.setItem('7media_liked', JSON.stringify(l.filter((x: number) => x !== animeId)))
        }
      } catch {}
    }

    if (session?.user) {
      await toggleUserReaction(animeId, 'tv', reaction)
    }
  }

  if (isLoading || !anime) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading anime details from AniList...</p>
        </main>
        <Footer />
      </div>
    )
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native || 'Untitled Anime'
  const romajiTitle = anime.title.romaji
  const nativeTitle = anime.title.native
  const bannerUrl = anime.bannerImage || anime.coverImage?.extraLarge || null
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large || '/placeholder.svg'
  const score = anime.averageScore
  const studio = anime.studios?.nodes?.[0]?.name
  const trailerId = anime.trailer?.site === 'youtube' ? anime.trailer.id : null
  const characters = anime.characters?.edges || []
  const relations = anime.relations?.edges || []
  const recommendations = anime.recommendations?.nodes?.map((n) => n.mediaRecommendation).filter(Boolean) || []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Banner Hero */}
        <div className="relative min-h-[70vh] overflow-hidden bg-black md:min-h-[80vh]">
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt=""
              fill
              priority
              className="object-cover opacity-35"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

          <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-28 md:flex-row md:items-end md:px-8">
            {/* Poster */}
            <div className="hidden w-60 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border md:block">
              <Image
                src={posterUrl}
                alt={title}
                width={240}
                height={360}
                className="h-auto w-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-primary/20 border border-primary/40 px-3 py-0.5 text-xs font-bold text-primary">
                  {anime.format || 'ANIME'}
                </span>
                {anime.status === 'RELEASING' && (
                  <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-400">
                    <Radio size={13} className="animate-pulse" />
                    AIRING
                  </span>
                )}
                {anime.status === 'FINISHED' && (
                  <span className="rounded-xl bg-secondary border border-white/10 px-3 py-0.5 text-xs font-bold text-muted-foreground">
                    COMPLETED
                  </span>
                )}
                {studio && (
                  <span className="rounded-xl bg-white/10 border border-white/15 px-3 py-0.5 text-xs font-bold text-white">
                    Studio: {studio}
                  </span>
                )}
              </div>

              {/* Native / Romaji Subtitles */}
              {nativeTitle && nativeTitle !== title && (
                <p className="text-sm font-semibold tracking-widest text-primary/90">
                  {nativeTitle} {romajiTitle && romajiTitle !== title ? `• ${romajiTitle}` : ''}
                </p>
              )}

              {/* Title */}
              <h1 className="text-balance text-3xl font-black font-display uppercase tracking-tight text-foreground md:text-5xl">
                {title}
              </h1>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground font-semibold">
                {score ? (
                  <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{score}%</span>
                    <span className="text-xs text-amber-400/70">AniList Score</span>
                  </span>
                ) : null}
                {anime.season && anime.seasonYear ? (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {anime.season} {anime.seasonYear}
                  </span>
                ) : null}
                {anime.episodes ? (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Tv className="h-4 w-4 text-muted-foreground" />
                    {anime.episodes} Episodes
                  </span>
                ) : null}
                {anime.duration ? (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {anime.duration} min/ep
                  </span>
                ) : null}
              </div>

              {/* Next Airing Countdown Card */}
              {anime.status === 'RELEASING' && anime.nextAiringEpisode ? (
                <div className="flex max-w-md items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-emerald-300 backdrop-blur-md">
                  <Radio className="h-5 w-5 animate-pulse shrink-0 text-emerald-400" />
                  <div className="text-xs">
                    <p className="font-bold text-sm text-emerald-200">
                      Episode {anime.nextAiringEpisode.episode} Airing Soon
                    </p>
                    <p className="text-emerald-400/90 mt-0.5">
                      Scheduled in {Math.floor(anime.nextAiringEpisode.timeUntilAiring / 86400)} days, {Math.floor((anime.nextAiringEpisode.timeUntilAiring % 86400) / 3600)} hours
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {anime.genres?.map((g) => (
                  <Link
                    key={g}
                    href={`/anime/genre/${encodeURIComponent(g.toLowerCase())}`}
                    className="rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95"
                  >
                    {g}
                  </Link>
                ))}
              </div>

              {/* Synopsis */}
              {anime.description && (
                <p
                  className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base"
                  dangerouslySetInnerHTML={{
                    __html: anime.description.replace(/<[^>]*>?/gm, ''),
                  }}
                />
              )}

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {trailerId && (
                  <button
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-black uppercase text-xs tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Trailer
                  </button>
                )}

                {/* Watch Party Virtual Cinema Launcher */}
                <Link
                  href={`/party/7M-ANIME-${animeId}`}
                  className="flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-5 py-3 font-bold text-xs uppercase tracking-wider text-purple-300 transition-all hover:bg-purple-500/25 active:scale-95 shadow-md"
                >
                  <Users size={16} />
                  Watch Party
                </Link>

                {/* Watchlist Button */}
                <WatchlistButton
                  item={{
                    id: animeId,
                    type: 'tv',
                    title,
                    posterPath: anime.coverImage?.large || null,
                    voteAverage: score ? score / 10 : 0,
                  }}
                />

                {/* Watched Button */}
                <button
                  type="button"
                  onClick={() => handleToggleReaction('watched')}
                  className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                    isWatched
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'border-white/15 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                  className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                    isLiked
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'border-white/15 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                  className={`flex items-center gap-1.5 rounded-2xl border px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                    isDisliked
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'border-white/15 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title="Dislike this anime"
                >
                  <ThumbsDown size={15} />
                  <span>Dislike</span>
                </button>

                {/* Multi-Platform Share Button */}
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/90 px-5 py-3 font-bold text-xs uppercase tracking-wider text-foreground transition-all hover:bg-zinc-800 hover:border-white/30 active:scale-95"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share
                </button>

                {/* Rate & Review Button */}
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 font-bold text-xs uppercase tracking-wider text-amber-400 transition-all hover:bg-amber-500/20 active:scale-95"
                >
                  <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                  Rate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Facts Grid */}
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 border-b border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Studio */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Building2 size={14} />
                <span>Animation Studio</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {studio || 'Main Anime Studio'}
              </p>
            </div>

            {/* Source Material */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <BookOpen size={14} />
                <span>Source</span>
              </div>
              <p className="text-sm font-bold text-foreground capitalize">
                {anime.source ? anime.source.replace(/_/g, ' ').toLowerCase() : 'Original / Manga'}
              </p>
            </div>

            {/* Format & Length */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                <Tv size={14} />
                <span>Format</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {anime.format || 'TV'} · {anime.episodes || '?'} Ep ({anime.duration || 24}m)
              </p>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Award size={14} />
                <span>Airing Status</span>
              </div>
              <p className="text-sm font-bold text-foreground capitalize">
                {anime.status ? anime.status.replace(/_/g, ' ').toLowerCase() : 'Finished'}
              </p>
            </div>

            {/* Season Year */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                <Calendar size={14} />
                <span>Season Premiered</span>
              </div>
              <p className="text-sm font-bold text-foreground capitalize">
                {anime.season ? anime.season.toLowerCase() : ''} {anime.seasonYear || '2026'}
              </p>
            </div>
          </div>
        </section>

        {/* Official Soundtracks (OST) Section */}
        <SoundtrackSection mediaTitle={title} mediaType="anime" />

        {/* Seasons & Episode Guide (TMDB + AniList) */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 border-t border-border">
          <AnimeEpisodeList anime={anime} />
        </section>

        {/* Streaming Providers & Official Links */}
        {anime.externalLinks && anime.externalLinks.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-8 md:px-8">
            <h2 className="mb-4 text-xl font-bold font-display uppercase tracking-tight text-foreground">
              Official Streaming &amp; Links
            </h2>
            <div className="flex flex-wrap gap-3">
              {anime.externalLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95 shadow-sm"
                >
                  <span>{link.site}</span>
                  <ExternalLink size={13} className="text-muted-foreground" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Characters & Voice Actors (Seiyuu) */}
        {characters.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
                  Characters &amp; Voice Actors (Seiyuu)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {characters.slice(0, 9).map((char) => {
                const va = char.voiceActors?.[0]
                return (
                  <div
                    key={char.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-card p-3.5 shadow-sm"
                  >
                    {/* Character */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-secondary ring-1 ring-white/10">
                        {char.node.image?.medium ? (
                          <Image
                            src={char.node.image.medium}
                            alt={char.node.name.full}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="line-clamp-1 text-sm font-bold text-foreground">{char.node.name.full}</p>
                        <p className="text-xs text-muted-foreground capitalize">{char.role.toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Voice Actor */}
                    {va && (
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="line-clamp-1 text-sm font-semibold text-primary">{va.name.full}</p>
                          <p className="text-xs text-muted-foreground">Japanese</p>
                        </div>
                        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-secondary ring-1 ring-white/10">
                          {va.image?.medium ? (
                            <Image
                              src={va.image.medium}
                              alt={va.name.full}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Community Reviews Section */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
                Otaku &amp; Fan Reviews ({reviews.length})
              </h2>
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="text-xs font-bold text-amber-400 hover:underline uppercase tracking-wider"
              >
                + Write a Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-3xl border border-white/10 bg-card p-6 shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                        {rev.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{rev.userName}</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
                      <Star size={13} fill="currentColor" />
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
                          className="rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400"
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

        {/* Franchise Relations (Prequels, Sequels) */}
        {relations.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <div className="mb-6 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
                Franchise Relations &amp; Chronology
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {relations.map((rel) => {
                const relTitle = rel.node.title.english || rel.node.title.romaji || 'Related Anime'
                const cover = rel.node.coverImage?.large || rel.node.coverImage?.medium || '/placeholder.svg'
                return (
                  <Link
                    key={rel.id}
                    href={`/anime/${rel.node.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-secondary">
                      <Image
                        src={cover}
                        alt={relTitle}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 rounded-xl bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase text-primary backdrop-blur-md border border-primary/20">
                        {rel.relationType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary">
                        {relTitle}
                      </h4>
                      <p className="text-[11px] text-muted-foreground uppercase mt-0.5">{rel.node.format}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Recommended Anime */}
        {recommendations.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
                You May Also Like
              </h2>
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
