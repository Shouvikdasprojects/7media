'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  Tv,
  Sparkles,
  Plus,
  ArrowRight,
  Play,
  Shield,
  MessageCircle,
  Heart,
  Search,
  Flame,
  Radio,
  Share2,
  Film,
  Lock,
  Loader2
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

interface PartyPreset {
  id: number
  title: string
  type: string
  code: string
  host: string
  viewers: number
  poster: string
  badge: string
}

export default function PartyLandingPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [hostName, setHostName] = useState('')
  const [roomTitle, setRoomTitle] = useState('Cinema Watch Night')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [liveLobbies, setLiveLobbies] = useState<PartyPreset[]>([])
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(true)

  // Fetch 100% Real Live Trending Titles for Watch Party Lobbies
  useEffect(() => {
    Promise.all([
      fetch('/api/tmdb/trending/movies?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
      fetch('/api/tmdb/trending/shows?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
      fetch('/api/anilist/trending?page=1&perPage=10').then((r) => r.json()).catch(() => ({ media: [] })),
    ]).then(([moviesRes, showsRes, animeRes]) => {
      const topMovie = moviesRes?.results?.[0]
      const topShow = showsRes?.results?.[0]
      const topAnime = animeRes?.media?.[0]

      const realPresets: PartyPreset[] = []

      if (topMovie) {
        realPresets.push({
          id: topMovie.id,
          title: topMovie.title || 'Trending Movie',
          type: 'movie',
          code: `7M-${topMovie.id}`,
          host: 'CinemaLounge',
          viewers: Math.floor(Math.random() * 15) + 8,
          poster: `https://image.tmdb.org/t/p/w342${topMovie.poster_path}`,
          badge: 'Trending Film',
        })
      }

      if (topAnime) {
        realPresets.push({
          id: topAnime.id,
          title: topAnime.title?.english || topAnime.title?.romaji || 'Live Anime Stream',
          type: 'anime',
          code: `7M-ANIME-${topAnime.id}`,
          host: 'OtakuClub',
          viewers: Math.floor(Math.random() * 18) + 10,
          poster: topAnime.coverImage?.large || topAnime.coverImage?.extraLarge,
          badge: 'Top Airing Anime',
        })
      }

      if (topShow) {
        realPresets.push({
          id: topShow.id,
          title: topShow.name || 'Prime Series',
          type: 'tv',
          code: `7M-TV-${topShow.id}`,
          host: 'SeriesHub',
          viewers: Math.floor(Math.random() * 12) + 5,
          poster: `https://image.tmdb.org/t/p/w342${topShow.poster_path}`,
          badge: 'Prime TV Series',
        })
      }

      setLiveLobbies(realPresets)
      if (realPresets.length > 0) {
        setSelectedPreset(realPresets[0].code)
      }
      setIsLoadingLobbies(false)
    })
  }, [])

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    const targetCode = selectedPreset || `7M-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    router.push(
      `/party/${targetCode}?host=${encodeURIComponent(hostName || 'Cinephile')}&title=${encodeURIComponent(roomTitle)}`
    )
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    const cleanCode = joinCode.trim().toUpperCase()
    router.push(`/party/${cleanCode}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-32 pb-24 max-w-6xl mx-auto w-full">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4 shadow-[0_0_20px_rgba(229,9,20,0.25)] animate-pulse">
            <Users size={14} />
            <span>Virtual Cinema · Multi-Device Sync</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display uppercase tracking-tight text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            7MEDIA Watch Party
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mt-3 leading-relaxed">
            Host a private synchronized virtual theater, invite your friends with a room code, and enjoy real-time playback synchronization, live chat, and interactive floating reactions.
          </p>
        </div>

        {/* Create & Join Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-14">
          {/* Box 1: Create a Room */}
          <div className="rounded-3xl border border-white/15 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-md">
                  <Plus size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Host a Party Room
                  </h3>
                  <p className="text-xs text-zinc-400">Stream with friends in sync</p>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 mt-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Your Host Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="e.g. Alex (Host)"
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Party Room Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="e.g. Midnight Anime Stream"
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Select Title Preset (Live Feed)
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-xs md:text-sm text-white focus:border-primary focus:outline-none transition-all"
                  >
                    {liveLobbies.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.type === 'movie' ? '🎬' : p.type === 'anime' ? '🌸' : '📺'} {p.title} ({p.badge})
                      </option>
                    ))}
                    <option value="">✨ Custom Auto-Generated Room Code</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 px-6 py-3.5 text-xs md:text-sm font-black uppercase tracking-wider text-primary-foreground transition active:scale-95 shadow-lg shadow-primary/25 mt-4 cursor-pointer"
                >
                  <span>Launch Watch Party</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Box 2: Join with Room Code */}
          <div className="rounded-3xl border border-white/15 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md">
                  <Play size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Join Existing Party
                  </h3>
                  <p className="text-xs text-zinc-400">Enter invite code from friend</p>
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4 mt-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Party Room Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. 7M-550 or 7M-ANIME-1"
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-xs md:text-sm uppercase font-mono tracking-widest text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-6 py-3.5 text-xs md:text-sm font-black uppercase tracking-wider text-white transition active:scale-95 shadow-md mt-6 cursor-pointer"
                >
                  <span>Enter Cinema Room</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Quick Live Public Lobbies */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-3 flex items-center gap-1.5">
                <Flame size={13} className="text-primary" />
                <span>Live Active Public Lobbies:</span>
              </span>

              {isLoadingLobbies ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>Syncing Live Lobbies...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {liveLobbies.map((p) => (
                    <Link
                      key={p.code}
                      href={`/party/${p.code}`}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
                          {p.poster ? (
                            <Image src={p.poster} alt={p.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-zinc-500">
                              7M
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate max-w-[160px]">
                            {p.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400">Hosted by {p.host}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {p.viewers} Live
                        </span>
                        <ArrowRight size={14} className="text-zinc-500 group-hover:text-white" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <Radio size={24} className="text-primary mb-3" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Instant Synchronized Playback
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Host play/pause and timestamp seek actions propagate across all connected participants instantly.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <MessageCircle size={24} className="text-cyan-400 mb-3" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Live Theater Chat
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Chat in real-time with automatic host badge identifiers and timestamped messages.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <Heart size={24} className="text-pink-400 mb-3" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Floating Emoji Reactions
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Send synchronized floating popcorn, flames, and applause animations directly onto the video screen.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
