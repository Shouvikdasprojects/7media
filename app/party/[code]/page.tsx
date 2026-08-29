'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Copy,
  Check,
  Smile,
  Shield,
  Film,
  Sparkles,
  Flame,
  Heart,
  Popcorn,
  Share2,
  Radio,
  Tv
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useSession } from '@/lib/auth-client'

interface ChatMessage {
  id: string
  user: string
  text: string
  time: string
  isHost?: boolean
}

export default function PartyRoomPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const userName = session?.user?.name || searchParams.get('host') || 'You'
  const titleParam = searchParams.get('title')

  const [mediaInfo, setMediaInfo] = useState<{
    title: string
    backdrop: string | null
    poster: string | null
    type: string
    trailerKey: string | null
  }>({
    title: titleParam || 'Cinema Live Stream',
    backdrop: null,
    poster: null,
    type: 'Movie',
    trailerKey: null,
  })

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      user: '7Media Bot',
      text: `🍿 Virtual Cinema Room ${code} is active! Share the room link to invite friends.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [copied, setCopied] = useState(false)
  const [reactions, setReactions] = useState<Array<{ id: number; emoji: string; left: number }>>([])
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  // 1. Fetch Real Title Info if Code contains TMDB or AniList ID
  useEffect(() => {
    let active = true

    // Parse code (e.g., 7M-550, 7M-ANIME-1, 7M-tv-1399)
    const upper = code.toUpperCase()
    if (upper.includes('ANIME-')) {
      const animeId = upper.replace('7M-ANIME-', '').replace('ANIME-', '')
      fetch(`https://graphql.anilist.co`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query ($id: Int) { Media(id: $id) { title { english romaji native } bannerImage coverImage { extraLarge large } trailer { site id } } }`,
          variables: { id: parseInt(animeId) || 1 },
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!active) return
          const media = data?.data?.Media
          if (media) {
            setMediaInfo({
              title: media.title.english || media.title.romaji || 'Anime Watch Party',
              backdrop: media.bannerImage || media.coverImage?.extraLarge,
              poster: media.coverImage?.extraLarge || media.coverImage?.large,
              type: 'Anime',
              trailerKey: media.trailer?.site === 'youtube' ? media.trailer.id : null,
            })
          }
        })
        .catch(() => {})
    } else {
      const numMatch = code.match(/\d+/)
      if (numMatch) {
        const id = parseInt(numMatch[0])
        fetch(`/api/tmdb/movie/${id}`)
          .then((r) => r.json())
          .then((data) => {
            if (!active) return
            if (data && data.title) {
              const trailer = data.videos?.results?.find((v: any) => v.site === 'YouTube')?.key || null
              setMediaInfo({
                title: data.title,
                backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
                poster: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
                type: 'Movie',
                trailerKey: trailer,
              })
            }
          })
          .catch(() => {})
      }
    }

    return () => {
      active = false
    }
  }, [code])

  // 2. Real multi-tab live sync via BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`7media_party_${code}`)
      channelRef.current = channel

      channel.onmessage = (event) => {
        const data = event.data
        if (data.type === 'CHAT_MESSAGE') {
          setMessages((prev) => [...prev, data.message])
        } else if (data.type === 'REACTION') {
          triggerReaction(data.emoji, false)
        } else if (data.type === 'PLAY_STATE') {
          setIsPlaying(data.isPlaying)
        }
      }

      return () => {
        channel.close()
      }
    }
  }, [code])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: userName,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: true,
    }

    setMessages((prev) => [...prev, newMsg])
    channelRef.current?.postMessage({ type: 'CHAT_MESSAGE', message: newMsg })
    setInputText('')
  }

  const triggerReaction = (emoji: string, broadcast = true) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(Math.random() * 80) + 10,
    }
    setReactions((prev) => [...prev, newReaction])
    if (broadcast) {
      channelRef.current?.postMessage({ type: 'REACTION', emoji })
    }
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id))
    }, 2000)
  }

  const togglePlay = () => {
    const next = !isPlaying
    setIsPlaying(next)
    channelRef.current?.postMessage({ type: 'PLAY_STATE', isPlaying: next })
  }

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-3 md:px-8 pb-16 pt-24 max-w-7xl mx-auto w-full">
        {/* Top Room Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-zinc-950/80 mb-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold font-display uppercase tracking-tight text-white">
                  {mediaInfo.title}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                  {mediaInfo.type} Room
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">Room Code: {code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={copyRoomLink}
              className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Cinema Player + Real-Time Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cinema Screen (Left 2 Columns) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center group">
              {/* If YouTube trailer exists, embed real video stream */}
              {mediaInfo.trailerKey ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${mediaInfo.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0`}
                  title={mediaInfo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : mediaInfo.backdrop ? (
                <Image
                  src={mediaInfo.backdrop}
                  alt={mediaInfo.title}
                  fill
                  priority
                  className="object-cover opacity-60 group-hover:scale-102 transition-transform duration-700"
                />
              ) : (
                <div className="text-center p-6">
                  <Film size={48} className="mx-auto text-primary mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-white uppercase tracking-wider">Synchronized Virtual Stream</p>
                </div>
              )}

              {/* Floating Emojis */}
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-16 pointer-events-none text-3xl md:text-4xl animate-bounce transition-all duration-1000 z-30"
                  style={{ left: `${r.left}%` }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Quick Floating Reaction Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-900/90 shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-1 hidden sm:inline">
                  Reactions:
                </span>
                {['🔥', '🍿', '❤️', '😱', '👏', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerReaction(emoji)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 hover:scale-125 transition-all text-base active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all text-xs font-bold"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Live Chat Feed (Right 1 Column) */}
          <div className="flex flex-col h-[520px] rounded-3xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Live Room Chat</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-white">{msg.user}</span>
                    <span className="text-[10px] text-zinc-500">{msg.time}</span>
                  </div>
                  <p className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-300 leading-relaxed break-words">
                    {msg.text}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Send a message to the room..."
                  className="flex-1 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all shadow-md active:scale-95"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
