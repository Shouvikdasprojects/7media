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
  Tv,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  ThumbsUp,
  Wifi
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

const REACTION_EMOJIS = ['🍿', '🔥', '👏', '❤️', '🤣', '😱', '🤯', '🎉']

export default function PartyRoomPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const userName = session?.user?.name || searchParams.get('host') || 'Cinephile'
  const titleParam = searchParams.get('title')

  const [mediaInfo, setMediaInfo] = useState<{
    title: string
    backdrop: string | null
    poster: string | null
    type: string
    trailerKey: string | null
    overview?: string
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
      id: 'welcome_init',
      user: '7MEDIA Cinema Bot',
      text: `🍿 Room ${code.toUpperCase()} is active! Multi-device sync is live.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [copied, setCopied] = useState(false)
  const [reactions, setReactions] = useState<Array<{ id: number; emoji: string; left: number }>>([])
  const [participantCount, setParticipantCount] = useState(1)
  const [participants, setParticipants] = useState<string[]>([userName])
  const [isSynced, setIsSynced] = useState(true)
  const [invalidRoom, setInvalidRoom] = useState(false)
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastSyncTimeRef = useRef<number>(0)

  // 1. Fetch Real Title Info if Code contains TMDB or AniList ID
  useEffect(() => {
    let active = true
    const upper = code.toUpperCase()

    if (upper.includes('ANIME-') || upper.includes('ANIME')) {
      const animeId = upper.replace('7M-ANIME-', '').replace('ANIME-', '').replace('7M-ANIME', '1') || '1'
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query ($id: Int) { Media(id: $id) { title { english romaji native } bannerImage coverImage { extraLarge large } trailer { site id } description } }`,
          variables: { id: parseInt(animeId) || 1 },
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!active) return
          const m = data?.data?.Media
          if (m) {
            setMediaInfo({
              title: m.title.english || m.title.romaji || titleParam || 'Anime Stream',
              backdrop: m.bannerImage || m.coverImage?.extraLarge,
              poster: m.coverImage?.large || m.coverImage?.extraLarge,
              type: 'Anime',
              trailerKey: m.trailer?.site === 'youtube' ? m.trailer.id : 'dQw4w9WgXcQ',
              overview: m.description?.replace(/<[^>]*>?/gm, ''),
            })
          }
        })
        .catch(() => {})
    } else {
      const cleanId = upper.replace('7M-TV-', '').replace('7M-', '').replace('TV-', '') || '550'
      const isTv = upper.includes('TV-')
      const ep = isTv ? `/api/tmdb/show/${cleanId}` : `/api/tmdb/movie/${cleanId}`

      fetch(ep)
        .then((r) => r.json())
        .then((data) => {
          if (!active) return
          if (data && (data.title || data.name)) {
            const vidKey = data.videos?.results?.find((v: any) => v.type === 'Trailer' || v.site === 'YouTube')?.key || 'L3pk_TBkihU'
            setMediaInfo({
              title: data.title || data.name || titleParam || 'Watch Party',
              backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
              poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
              type: isTv ? 'TV Series' : 'Movie',
              trailerKey: vidKey,
              overview: data.overview,
            })
          }
        })
        .catch(() => {})
    }

    return () => {
      active = false
    }
  }, [code, titleParam])

  // 2. Real-Time Server Signaling & Heartbeat Engine (/api/party/sync)
  useEffect(() => {
    let timer: NodeJS.Timeout

    const syncWithServer = async () => {
      try {
        const res = await fetch(
          `/api/party/sync?code=${encodeURIComponent(code)}&user=${encodeURIComponent(userName)}&since=${lastSyncTimeRef.current}`
        )
        if (res.status === 400) {
          setInvalidRoom(true)
          return
        }
        if (res.ok) {
          const data = await res.json()
          setIsSynced(true)
          if (data.serverTime) lastSyncTimeRef.current = data.serverTime
          if (typeof data.participantCount === 'number') setParticipantCount(data.participantCount)
          if (Array.isArray(data.participants)) setParticipants(data.participants)

          // Synced Play/Pause state from remote peer
          if (typeof data.isPlaying === 'boolean') {
            setIsPlaying(data.isPlaying)
          }

          // New chat messages from remote peers
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id))
              const uniqueNew = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id))
              if (uniqueNew.length === 0) return prev
              return [...prev, ...uniqueNew]
            })
          }

          // New reactions from remote peers
          if (Array.isArray(data.reactions) && data.reactions.length > 0) {
            data.reactions.forEach((r: any) => {
              if (r.user !== userName) {
                spawnReaction(r.emoji)
              }
            })
          }
        }
      } catch {
        setIsSynced(false)
      }
    }

    // Initial sync
    syncWithServer()

    // Poll every 1.5s for real-time room updates across devices
    timer = setInterval(syncWithServer, 1500)

    return () => {
      clearInterval(timer)
    }
  }, [code, userName])

  // 3. Instant BroadcastChannel (0ms sync for same-device tabs)
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(`7media_party_${code}`)
      channelRef.current = channel

      channel.onmessage = (event) => {
        const data = event.data
        if (data.type === 'CHAT') {
          setMessages((prev) => [...prev, data.message])
        } else if (data.type === 'PLAY_STATE') {
          setIsPlaying(data.isPlaying)
        } else if (data.type === 'REACTION') {
          spawnReaction(data.emoji)
        }
      }

      return () => {
        channel.close()
      }
    } catch {}
  }, [code])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const spawnReaction = (emoji: string) => {
    const id = Date.now() + Math.random()
    const left = Math.floor(Math.random() * 80) + 10 // 10% to 90%
    setReactions((prev) => [...prev, { id, emoji, left }])
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 2800)
  }

  const handleSendReaction = (emoji: string) => {
    spawnReaction(emoji)

    // Broadcast locally to other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'REACTION', emoji })
    }

    // Broadcast globally to server for all devices
    fetch('/api/party/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        type: 'REACTION',
        user: userName,
        payload: { emoji },
      }),
    })
      .then((res) => {
        if (res.status === 429) {
          setRateLimitWarning('⚡ Please slow down reactions!')
          setTimeout(() => setRateLimitWarning(null), 3000)
        }
      })
      .catch(() => {})
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user: userName,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: userName.toLowerCase().includes('host') || userName === 'You',
    }

    setMessages((prev) => [...prev, newMsg])
    const sentText = inputText.trim()
    setInputText('')

    // Broadcast locally
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'CHAT', message: newMsg })
    }

    // Broadcast globally to server
    fetch('/api/party/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        type: 'CHAT',
        user: userName,
        payload: { text: sentText, isHost: newMsg.isHost },
      }),
    })
      .then((res) => {
        if (res.status === 429) {
          setRateLimitWarning('⚡ Message rate limit reached. Please slow down!')
          setTimeout(() => setRateLimitWarning(null), 3500)
        }
      })
      .catch(() => {})
  }

  const handleTogglePlay = () => {
    const nextState = !isPlaying
    setIsPlaying(nextState)

    // Broadcast locally
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'PLAY_STATE', isPlaying: nextState })
    }

    // Broadcast globally to server
    fetch('/api/party/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        type: 'PLAY_STATE',
        user: userName,
        payload: { isPlaying: nextState },
      }),
    }).catch(() => {})
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Join my 7MEDIA Watch Party: ${mediaInfo.title}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  if (invalidRoom) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground select-none">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full rounded-3xl border border-white/15 bg-zinc-950/90 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto mb-4">
              <Users size={28} />
            </div>
            <h1 className="text-2xl font-black font-display uppercase tracking-tight text-white mb-2">
              Room Not Found
            </h1>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Room code <span className="font-mono text-primary font-bold">{code}</span> is invalid, malformed, or has expired after inactivity.
            </p>
            <Link
              href="/party"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition active:scale-95"
            >
              <ArrowLeft size={16} /> Return to Watch Party Lobby
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground select-none">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-28 pb-16 max-w-[1880px] mx-auto w-full flex flex-col gap-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href="/party"
              className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-md active:scale-95"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Real-Time Sync Theater · Room {code.toUpperCase()}</span>
                {isSynced && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    <Wifi size={10} /> Live
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-3xl font-black font-display uppercase tracking-tight text-white truncate max-w-xl">
                {mediaInfo.title}
              </h1>
            </div>
          </div>

          {/* Quick Actions & Participants */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <Users size={13} />
              <span>{participantCount} In Room</span>
            </span>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-white transition shadow-sm active:scale-95 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Link Copied!' : `Code: ${code.toUpperCase()}`}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground transition shadow-md active:scale-95 cursor-pointer"
              title="Share Room Link"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>

        {/* Video Player + Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Cinema Screen (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Screen Container */}
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/15 bg-black shadow-2xl group">
              {/* Floating Emoji Reactions Overlay */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {reactions.map((r) => (
                  <span
                    key={r.id}
                    className="absolute bottom-6 text-3xl md:text-4xl animate-float-up pointer-events-none filter drop-shadow-lg"
                    style={{ left: `${r.left}%` }}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>

              {/* Video Stream Embed */}
              {mediaInfo.trailerKey && isPlaying ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${mediaInfo.trailerKey}?autoplay=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
                  title={`${mediaInfo.title} Watch Party Video Player`}
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-6 backdrop-blur-sm">
                  {mediaInfo.backdrop && (
                    <Image
                      src={mediaInfo.backdrop}
                      alt={mediaInfo.title}
                      fill
                      priority
                      className="object-cover opacity-25 filter blur-xs"
                    />
                  )}
                  <div className="relative z-20 flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_40px_rgba(229,9,20,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play size={36} fill="currentColor" className="ml-1" />
                    </button>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">
                      Broadcast Paused by Room Host
                    </p>
                    <p className="text-xs text-zinc-400">Click play to resume synchronized stream</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cinema Playback Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                  <span>{isPlaying ? 'Sync Pause' : 'Sync Play'}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-zinc-300">Room Status: Synced</span>
                </div>
              </div>

              {/* Quick Floating Emoji Reaction Bar */}
              <div className="flex items-center gap-1.5">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 hover:scale-115 active:scale-90 transition-all text-base cursor-pointer"
                    title={`Send ${emoji} reaction`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Overview & Metadata Card */}
            {mediaInfo.overview && (
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Synopsis &amp; Details
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">{mediaInfo.overview}</p>
              </div>
            )}
          </div>

          {/* Live Party Chat Box (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-[640px] rounded-3xl border border-white/15 bg-zinc-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Live Party Chat
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {messages.length} messages
              </span>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {messages.map((m) => {
                const isMe = m.user === userName
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold text-zinc-300">
                        {isMe ? 'You' : m.user}
                      </span>
                      {m.isHost && (
                        <span className="rounded bg-accent/20 px-1 py-0.2 text-[9px] font-black text-accent">
                          HOST
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-zinc-500">{m.time}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-xs shadow-md'
                          : 'bg-zinc-900 text-zinc-200 border border-white/10 rounded-tl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Rate Limit Warning Toast */}
            {rateLimitWarning && (
              <div className="px-3.5 py-1.5 bg-amber-500/20 border-t border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                <span>⚡</span>
                <span>{rateLimitWarning}</span>
              </div>
            )}

            {/* Chat Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/10 bg-zinc-900/60 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Say something to the room..."
                className="flex-1 h-10 rounded-xl bg-zinc-900 border border-white/10 px-3.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition disabled:opacity-40 active:scale-95 cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
