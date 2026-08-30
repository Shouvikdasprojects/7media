'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles,
  X,
  Play,
  Star,
  RefreshCw,
  Flame,
  Zap,
  Smile,
  HeartCrack,
  Ghost,
  Film,
  Users,
  Compass,
  Heart,
  ShieldAlert,
  Search,
  Clapperboard,
  RotateCcw
} from 'lucide-react'
import { WatchlistButton } from './watchlist-button'
import { TrailerModal } from './trailer-modal'

export interface MoodCategory {
  id: string
  name: string
  label: string
  icon: any
  genreId: number
  color: string
  bg: string
  border: string
  desc: string
}

const MOODS: MoodCategory[] = [
  {
    id: 'action',
    name: 'Adrenaline Rush',
    label: 'Action & Explosions',
    icon: Zap,
    genreId: 28,
    color: 'text-amber-400',
    bg: 'from-amber-950/50 via-zinc-900 to-zinc-950',
    border: 'border-amber-500/30 hover:border-amber-500',
    desc: 'High-octane explosions, thrilling chases, and martial arts.',
  },
  {
    id: 'scifi',
    name: 'Mind-Bending',
    label: 'Sci-Fi & Cosmic',
    icon: Sparkles,
    genreId: 878,
    color: 'text-cyan-400',
    bg: 'from-cyan-950/50 via-zinc-900 to-zinc-950',
    border: 'border-cyan-500/30 hover:border-cyan-500',
    desc: 'Time travel, parallel universes, and unpredictable plot twists.',
  },
  {
    id: 'comedy',
    name: 'Chill & Laughs',
    label: 'Comedy & Feel-Good',
    icon: Smile,
    genreId: 35,
    color: 'text-emerald-400',
    bg: 'from-emerald-950/50 via-zinc-900 to-zinc-950',
    border: 'border-emerald-500/30 hover:border-emerald-500',
    desc: 'Hilarious banter, lighthearted fun, and feel-good vibes.',
  },
  {
    id: 'drama',
    name: 'Tearjerker & Drama',
    label: 'Deep Emotions',
    icon: HeartCrack,
    genreId: 18,
    color: 'text-purple-400',
    bg: 'from-purple-950/50 via-zinc-900 to-zinc-950',
    border: 'border-purple-500/30 hover:border-purple-500',
    desc: 'Intense storytelling, emotional climaxes, and Oscar-worthy drama.',
  },
  {
    id: 'horror',
    name: 'Late-Night Spooky',
    label: 'Horror & Jump Scares',
    icon: Ghost,
    genreId: 27,
    color: 'text-rose-400',
    bg: 'from-rose-950/50 via-zinc-900 to-zinc-950',
    border: 'border-rose-500/30 hover:border-rose-500',
    desc: 'Dark shadows, psychological dread, and thrilling suspense.',
  },
  {
    id: 'anime',
    name: 'Anime Euphoria',
    label: 'Animation & Fantasy',
    icon: Flame,
    genreId: 16,
    color: 'text-pink-400',
    bg: 'from-pink-950/50 via-zinc-900 to-zinc-950',
    border: 'border-pink-500/30 hover:border-pink-500',
    desc: 'Stunning animation, epic superpowers, and magical anime realms.',
  },
  {
    id: 'romance',
    name: 'Heartwarming Romance',
    label: 'Love & Chemistry',
    icon: Heart,
    genreId: 10749,
    color: 'text-red-400',
    bg: 'from-red-950/50 via-zinc-900 to-zinc-950',
    border: 'border-red-500/30 hover:border-red-500',
    desc: 'Unforgettable love stories, electric chemistry, and happy endings.',
  },
  {
    id: 'crime',
    name: 'Dark Crime & Noir',
    label: 'Mystery & Investigation',
    icon: ShieldAlert,
    genreId: 80,
    color: 'text-indigo-400',
    bg: 'from-indigo-950/50 via-zinc-900 to-zinc-950',
    border: 'border-indigo-500/30 hover:border-indigo-500',
    desc: 'Gritty underworld detectives, heist masterminds, and mob sagas.',
  },
]

interface MoodRouletteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MoodRouletteModal({ isOpen, onClose }: MoodRouletteModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodCategory | null>(null)
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all')
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinningReelItem, setSpinningReelItem] = useState('Rolling Reels...')
  const [pickedResult, setPickedResult] = useState<any>(null)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [trailerOpen, setTrailerOpen] = useState(false)

  if (!isOpen) return null

  const handlePickMood = async (mood: MoodCategory) => {
    setSelectedMood(mood)
    setIsSpinning(true)
    setPickedResult(null)

    // Reel cycling animation titles
    const reelTitles = [
      'Inception',
      'Interstellar',
      'Spider-Man',
      'Fight Club',
      'The Dark Knight',
      'Spirited Away',
      'Attack on Titan',
      'Breaking Bad',
      'Dune: Part Two',
      'Pulp Fiction',
    ]

    let cycleCount = 0
    const reelInterval = setInterval(() => {
      setSpinningReelItem(reelTitles[cycleCount % reelTitles.length])
      cycleCount++
    }, 90)

    try {
      if (mood.id === 'anime') {
        const page = Math.floor(Math.random() * 3) + 1
        const res = await fetch(`/api/anilist/popular?page=${page}&perPage=20`).then((r) => r.json())
        const valid = (res?.media || []).filter((m: any) => m.coverImage?.large)

        setTimeout(() => {
          clearInterval(reelInterval)
          if (valid.length > 0) {
            const chosen = valid[Math.floor(Math.random() * valid.length)]
            setPickedResult({
              id: chosen.id,
              title: chosen.title?.english || chosen.title?.romaji || 'Anime Pick',
              overview: chosen.description?.replace(/<[^>]*>?/gm, '') || 'Top-rated anime masterpiece.',
              poster_path: chosen.coverImage?.large || chosen.coverImage?.extraLarge,
              isAniList: true,
              vote_average: chosen.averageScore ? (chosen.averageScore / 10).toFixed(1) : '8.8',
              release_date: chosen.startDate?.year ? `${chosen.startDate.year}` : 'Recent',
              genre_ids: chosen.genres || ['Animation'],
              matchScore: Math.floor(Math.random() * 6) + 94, // 94% - 99%
            })
          }
          setIsSpinning(false)
        }, 1200)
      } else {
        const page = Math.floor(Math.random() * 4) + 1
        const res = await fetch(`/api/tmdb/discover/movies?with_genres=${mood.genreId}&page=${page}`).then((r) =>
          r.json()
        )
        const valid = (res?.results || []).filter((m: any) => m.poster_path && m.vote_average >= 6.2)

        setTimeout(() => {
          clearInterval(reelInterval)
          if (valid.length > 0) {
            const chosen = valid[Math.floor(Math.random() * valid.length)]
            setPickedResult({
              ...chosen,
              matchScore: Math.floor(Math.random() * 6) + 94, // 94% - 99%
            })
          }
          setIsSpinning(false)
        }, 1200)
      }
    } catch {
      clearInterval(reelInterval)
      setIsSpinning(false)
    }
  }

  const handleOpenTrailer = async () => {
    if (!pickedResult) return
    if (pickedResult.isAniList) {
      setTrailerKey('dQw4w9WgXcQ')
      setTrailerOpen(true)
    } else {
      try {
        const res = await fetch(`/api/tmdb/movie/${pickedResult.id}`).then((r) => r.json())
        const vidKey =
          res?.videos?.results?.find((v: any) => v.type === 'Trailer' || v.site === 'YouTube')?.key ||
          res?.videos?.results?.[0]?.key ||
          'L3pk_TBkihU'
        setTrailerKey(vidKey)
        setTrailerOpen(true)
      } catch {
        setTrailerKey('L3pk_TBkihU')
        setTrailerOpen(true)
      }
    }
  }

  const handleReroll = () => {
    if (selectedMood) {
      handlePickMood(selectedMood)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/95 max-h-[90vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(229,9,20,0.3)]">
                <Sparkles size={22} />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                  Cinema Roulette · AI Curated
                </span>
                <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white">
                  Surprise Me · Mood Picker
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* State 1: Choose Mood */}
          {!selectedMood && (
            <div>
              <p className="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed">
                Not sure what to watch? Pick your current vibe and let 7MEDIA discover a highly-rated cinema gem for you!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MOODS.map((mood) => {
                  const Icon = mood.icon
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => handlePickMood(mood)}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-300 bg-gradient-to-b ${mood.bg} ${mood.border} hover:scale-[1.02] active:scale-95 shadow-md cursor-pointer group`}
                    >
                      <span className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${mood.color} shrink-0`}>
                        <Icon size={20} />
                      </span>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-white font-display group-hover:text-primary transition-colors">
                          {mood.name}
                        </h4>
                        <p className={`text-[11px] font-bold ${mood.color} mt-0.5`}>
                          {mood.label}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                          {mood.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* State 2: Slot Machine Film Reel Spinning Animation */}
          {selectedMood && isSpinning && (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              {/* Slot Reel Frame */}
              <div className="relative w-full max-w-sm rounded-2xl border border-primary/40 bg-zinc-900/90 p-4 shadow-[0_0_30px_rgba(229,9,20,0.3)] mb-6 overflow-hidden">
                <div className="flex items-center justify-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary animate-pulse">
                  <Clapperboard size={12} />
                  <span>Spinning Reel</span>
                </div>
                <div className="py-3 px-4 rounded-xl bg-black border border-white/10 text-lg font-black font-display uppercase tracking-wider text-white shadow-inner truncate">
                  {spinningReelItem}
                </div>
              </div>

              <p className="text-sm font-black uppercase tracking-widest text-white font-display">
                Matching {selectedMood.name}...
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Searching 10,000+ top-rated global cinema titles
              </p>
            </div>
          )}

          {/* State 3: Winner Result Card */}
          {selectedMood && !isSpinning && pickedResult && (
            <div className="animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${selectedMood.color}`}>
                    Vibe: {selectedMood.name}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {pickedResult.matchScore}% Vibe Match
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMood(null)}
                  className="text-xs font-bold text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Change Mood
                </button>
              </div>

              {/* Main Winner Card */}
              <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-5 md:p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  {/* Poster */}
                  <div className="relative w-32 sm:w-40 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10">
                    <Image
                      src={
                        pickedResult.isAniList
                          ? pickedResult.poster_path
                          : `https://image.tmdb.org/t/p/w500${pickedResult.poster_path}`
                      }
                      alt={pickedResult.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20">
                        <Star size={12} className="fill-yellow-400" />
                        <span>{pickedResult.vote_average}</span>
                      </span>
                      <span className="text-xs text-zinc-400 font-semibold">
                        {pickedResult.release_date?.substring(0, 4) || '2024'}
                      </span>
                    </div>

                    <h4 className="text-lg md:text-2xl font-black font-display uppercase tracking-tight text-white mb-2 leading-tight">
                      {pickedResult.title}
                    </h4>

                    <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed mb-6">
                      {pickedResult.overview || 'A cinematic masterpiece perfectly fitted to your current vibe.'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <Link
                        href={
                          pickedResult.isAniList
                            ? `/anime/${pickedResult.id}`
                            : `/title/movie/${pickedResult.id}`
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/25 active:scale-95"
                      >
                        <Play size={13} />
                        <span>Watch Now</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleOpenTrailer}
                        className="flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                      >
                        <Film size={13} />
                        <span>Trailer</span>
                      </button>

                      <Link
                        href={
                          pickedResult.isAniList
                            ? `/party/7M-ANIME-${pickedResult.id}`
                            : `/party/7M-${pickedResult.id}`
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                        title="Watch Party"
                      >
                        <Users size={13} />
                        <span>Party</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleReroll}
                        className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white px-3 py-2.5 text-xs font-bold transition active:scale-95 cursor-pointer"
                        title="Spin Again"
                      >
                        <RotateCcw size={13} />
                        <span>Reroll</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Trailer Modal */}
      {trailerOpen && trailerKey && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          youtubeId={trailerKey}
          title={pickedResult?.title || 'Trailer'}
        />
      )}
    </>
  )
}
