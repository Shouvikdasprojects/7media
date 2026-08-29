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
import { useMovieDetails, useShowDetails, useWatchProviders } from '@/lib/tmdb/hooks'
import { useSession } from '@/lib/auth-client'
import { getUserReactions, toggleUserReaction } from '@/app/actions/catalogs'
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
  Info
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

  const { data: movieData } = useMovieDetails(isMovie ? titleId : null)
  const { data: showData } = useShowDetails(isMovie ? null : titleId)
  const { data: providersData } = useWatchProviders(type, 'US')

  const data: any = isMovie ? movieData : showData

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

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading title information...</p>
        </main>
        <Footer />
      </div>
    )
  }

  const backdropUrl = data.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null
  const posterUrl = data.poster_path
    ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
    : null
  const title = isMovie ? data.title : data.name
  const year = isMovie
    ? data.release_date?.slice(0, 4)
    : data.first_air_date?.slice(0, 4)
  const recommendations = data.recommendations?.results || []

  // Extract Trailer key
  const trailerVideo = data.videos?.results?.find(
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Backdrop hero */}
        <div className="relative min-h-[78vh] overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-background/80 to-transparent" />
          {backdropUrl && (
            <Image
              src={backdropUrl}
              alt=""
              fill
              priority
              className="object-cover opacity-60"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />

          <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-32 md:flex-row md:items-end md:px-8">
            {/* Poster */}
            {posterUrl && (
              <div className="hidden w-56 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border/80 md:block">
                <Image
                  src={posterUrl}
                  alt={`${title} poster`}
                  width={224}
                  height={336}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex flex-1 flex-col gap-4">
              <h1 className="text-balance text-3xl font-black font-display uppercase tracking-tight text-foreground md:text-5xl text-glow">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
                <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="font-bold">{data.vote_average?.toFixed(1)}</span>
                  <span className="text-xs text-amber-400/70">/ 10</span>
                </span>
                {year && (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {year}
                  </span>
                )}
                {isMovie && data.runtime ? (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {Math.floor(data.runtime / 60)}h {data.runtime % 60}m
                  </span>
                ) : null}
                {!isMovie && data.number_of_seasons ? (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Tv className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {data.number_of_seasons} Season{data.number_of_seasons > 1 ? 's' : ''}
                  </span>
                ) : null}
                {data.status && (
                  <span className="rounded-xl bg-white/10 border border-white/15 px-3 py-1 text-xs uppercase font-bold text-zinc-300">
                    {data.status}
                  </span>
                )}
              </div>

              {/* Genres with Direct Hub Links */}
              {data.genres && data.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.genres.map((g: { id: number; name: string }) => (
                    <Link
                      key={g.id}
                      href={isMovie ? `/movies/genre/${g.id}` : `/series/genre/${g.id}`}
                      className="rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all shadow-sm active:scale-95"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              <p className="max-w-2xl text-pretty text-sm md:text-base leading-relaxed text-muted-foreground">
                {data.overview || 'Explore the story, cast, seasons, and more.'}
              </p>

              {data.tagline && (
                <p className="border-l-2 border-primary pl-3 text-xs md:text-sm italic text-foreground/80">
                  &quot;{data.tagline}&quot;
                </p>
              )}

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/watch/${type}/${titleId}`}
                  className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 font-black uppercase text-xs tracking-wider text-accent-foreground transition-all hover:bg-accent/90 shadow-lg shadow-accent/25 active:scale-95"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Watch Player
                </Link>

                {/* Trailer Button */}
                {trailerKey && (
                  <button
                    type="button"
                    onClick={() => setTrailerModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-3 font-black uppercase text-xs tracking-wider text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 shadow-md"
                  >
                    <Video size={16} />
                    Trailer
                  </button>
                )}

                {/* Watch Party Virtual Cinema Launcher */}
                <Link
                  href={`/party/7M-${titleId}`}
                  className="flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-5 py-3 font-bold text-xs uppercase tracking-wider text-purple-300 transition-all hover:bg-purple-500/25 active:scale-95 shadow-md"
                >
                  <Users size={16} />
                  Watch Party
                </Link>

                {/* Upgraded Watchlist Button */}
                <WatchlistButton
                  item={{
                    id: titleId,
                    type,
                    title,
                    posterPath: data.poster_path,
                    voteAverage: data.vote_average,
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
                  title="Like this title"
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
                  title="Dislike this title"
                >
                  <ThumbsDown size={15} />
                  <span>Dislike</span>
                </button>

                {/* Share Button */}
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

        {/* Quick Facts & Production Highlights Grid */}
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 border-b border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Director / Creator */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Users size={14} />
                <span>{isMovie ? 'Director' : 'Creator'}</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {isMovie
                  ? directors.map((d: any) => d.name).join(', ') || 'N/A'
                  : createdBy.map((c: any) => c.name).join(', ') || 'Various Creators'}
              </p>
            </div>

            {/* Original Language */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Globe2 size={14} />
                <span>Original Audio</span>
              </div>
              <p className="text-sm font-bold text-foreground uppercase">
                {data.original_language || 'English'}
              </p>
            </div>

            {/* Budget (if movie) */}
            {isMovie && data.budget > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  <DollarSign size={14} />
                  <span>Budget</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(data.budget)}
                </p>
              </div>
            )}

            {/* Box Office Revenue (if movie) */}
            {isMovie && data.revenue > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <Award size={14} />
                  <span>Box Office</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(data.revenue)}
                </p>
              </div>
            )}

            {/* Total Episodes (if show) */}
            {!isMovie && data.number_of_episodes && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  <Tv size={14} />
                  <span>Total Episodes</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {data.number_of_episodes} Episodes
                </p>
              </div>
            )}

            {/* Studio / Production */}
            {data.production_companies && data.production_companies.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                  <Building2 size={14} />
                  <span>Studio</span>
                </div>
                <p className="text-sm font-bold text-foreground truncate">
                  {data.production_companies[0]?.name}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Streaming Providers Notice */}
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 border-b border-border">
          <div className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Official Streaming Availability
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stream &quot;{title}&quot; legally on authorized global networks like Netflix, Prime Video, Disney+, Max, or Apple TV+.
                </p>
              </div>
            </div>
            <Link
              href={`/watch/${type}/${titleId}`}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-accent hover:underline uppercase tracking-wider"
            >
              <span>View Player &amp; Rights Notice</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </section>

        {/* Official Soundtracks (OST) Section */}
        <SoundtrackSection mediaTitle={title} mediaType={type} />

        {/* TV Episodes (if series) */}
        {!isMovie && data.seasons && (
          <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
            <EpisodeList
              showId={titleId}
              seasons={data.seasons.filter((s: { season_number: number }) => s.season_number > 0)}
            />
          </section>
        )}

        {/* Cast Grid */}
        {data.credits?.cast && data.credits.cast.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <h2 className="mb-6 text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
              Cast &amp; Characters
            </h2>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {data.credits.cast
                .slice(0, 12)
                .map((actor: { id: number; name: string; character: string; profile_path: string | null }) => (
                  <div key={actor.id} className="text-center group">
                    <div className="mb-2 aspect-square overflow-hidden rounded-2xl bg-secondary ring-1 ring-border/50 group-hover:ring-primary/50 transition-all">
                      {actor.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                          alt={actor.name}
                          width={160}
                          height={160}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                          {actor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs md:text-sm font-bold text-foreground">
                      {actor.name}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{actor.character}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Community Reviews Section */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl">
                User Reviews ({reviews.length})
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

        {/* Recommendations Carousel */}
        {recommendations.length > 0 && (
          <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
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
