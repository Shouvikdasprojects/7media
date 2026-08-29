'use client'

import { useState } from 'react'
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
  Film
} from 'lucide-react'
import { WatchlistButton } from './watchlist-button'

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
    label: 'Action & Adventure',
    icon: Zap,
    genreId: 28,
    color: 'text-amber-400',
    bg: 'from-amber-950/40 via-zinc-900 to-zinc-950',
    border: 'border-amber-500/30 hover:border-amber-500',
    desc: 'High-octane explosions, thrilling chases, and martial arts.',
  },
  {
    id: 'scifi',
    name: 'Mind-Bending',
    label: 'Sci-Fi & Mystery',
    icon: Sparkles,
    genreId: 878,
    color: 'text-cyan-400',
    bg: 'from-cyan-950/40 via-zinc-900 to-zinc-950',
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
    bg: 'from-emerald-950/40 via-zinc-900 to-zinc-950',
    border: 'border-emerald-500/30 hover:border-emerald-500',
    desc: 'Hilarious comedy, lighthearted fun, and heartwarming vibes.',
  },
  {
    id: 'drama',
    name: 'Tearjerker & Drama',
    label: 'Deep Emotions',
    icon: HeartCrack,
    genreId: 18,
    color: 'text-purple-400',
    bg: 'from-purple-950/40 via-zinc-900 to-zinc-950',
    border: 'border-purple-500/30 hover:border-purple-500',
    desc: 'Powerful storytelling, emotional moments, and masterpiece drama.',
  },
  {
    id: 'horror',
    name: 'Late-Night Spooky',
    label: 'Horror & Thriller',
    icon: Ghost,
    genreId: 27,
    color: 'text-rose-400',
    bg: 'from-rose-950/40 via-zinc-900 to-zinc-950',
    border: 'border-rose-500/30 hover:border-rose-500',
    desc: 'Dark shadows, psychological tension, and jump scares.',
  },
  {
    id: 'anime',
    name: 'Anime Fever',
    label: 'Animation & Fantasy',
    icon: Flame,
    genreId: 16,
    color: 'text-pink-400',
    bg: 'from-pink-950/40 via-zinc-900 to-zinc-950',
    border: 'border-pink-500/30 hover:border-pink-500',
    desc: 'Stunning animation, epic superpowers, and anime worlds.',
  },
]

interface MoodRouletteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MoodRouletteModal({ isOpen, onClose }: MoodRouletteModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodCategory | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [pickedResult, setPickedResult] = useState<any>(null)

  if (!isOpen) return null

  const handlePickMood = async (mood: MoodCategory) => {
    setSelectedMood(mood)
    setIsSpinning(true)
    setPickedResult(null)

    try {
      // Fetch high-rated movies matching this genre from TMDB via internal API route
      const page = Math.floor(Math.random() * 3) + 1
      const res = await fetch(`/api/tmdb/discover/movie?with_genres=${mood.genreId}&page=${page}`).then((r) => r.json())
      const valid = (res?.results || []).filter((m: any) => m.poster_path && m.vote_average >= 6.0)
      
      // Simulate roulette rolling delay
      setTimeout(() => {
        if (valid.length > 0) {
          const randomIndex = Math.floor(Math.random() * valid.length)
          setPickedResult(valid[randomIndex])
        }
        setIsSpinning(false)
      }, 800)
    } catch {
      setIsSpinning(false)
    }
  }

  const handleReroll = () => {
    if (selectedMood) {
      handlePickMood(selectedMood)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/95 max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-accent/20 text-accent border border-accent/30 shadow-[0_0_20px_rgba(229,9,20,0.3)]">
              <Sparkles size={22} />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">
                Cinema Roulette
              </span>
              <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white">
                Surprise Me · Mood Picker
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
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
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-300 bg-gradient-to-b ${mood.bg} ${mood.border} hover:scale-[1.02] active:scale-95 shadow-md`}
                  >
                    <span className={`p-2 rounded-xl bg-white/5 border border-white/10 ${mood.color}`}>
                      <Icon size={20} />
                    </span>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white font-display">
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

        {/* State 2: Spinning Animation */}
        {selectedMood && isSpinning && (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-accent">
                <Sparkles size={28} className="animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-white font-display">
              Spinning the Cinema Roulette...
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Curating the best {selectedMood.name} title from global ratings
            </p>
          </div>
        )}

        {/* State 3: Result Card */}
        {selectedMood && !isSpinning && pickedResult && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${selectedMood.color}`}>
                Selected: {selectedMood.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="text-xs font-bold text-zinc-400 hover:text-white underline"
              >
                Change Mood
              </button>
            </div>

            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-5 md:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                {/* Poster */}
                <div className="relative w-40 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${pickedResult.poster_path}`}
                    alt={pickedResult.title || 'Movie'}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                      <Star size={13} fill="currentColor" />
                      <span>{pickedResult.vote_average?.toFixed(1)}</span>
                    </span>
                    {pickedResult.release_date && (
                      <span className="text-xs text-zinc-400">
                        {pickedResult.release_date.slice(0, 4)}
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/15 px-2 py-0.5 rounded-md border border-accent/25">
                      Matched Choice
                    </span>
                  </div>

                  <h4 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white mt-1">
                    {pickedResult.title}
                  </h4>

                  <p className="text-xs text-zinc-300 line-clamp-4 leading-relaxed mt-2.5">
                    {pickedResult.overview || 'Experience this exceptional story curated specially for your mood.'}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                    <Link
                      href={`/title/movie/${pickedResult.id}`}
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-2xl bg-accent hover:bg-accent/90 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition active:scale-95 shadow-lg shadow-accent/25"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Explore Title</span>
                    </Link>

                    <WatchlistButton
                      item={{
                        id: pickedResult.id,
                        type: 'movie',
                        title: pickedResult.title,
                        posterPath: pickedResult.poster_path,
                        voteAverage: pickedResult.vote_average,
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleReroll}
                      className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-zinc-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95"
                    >
                      <RefreshCw size={13} />
                      <span>Spin Again</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
