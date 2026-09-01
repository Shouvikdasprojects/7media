'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell,
  X,
  Sparkles,
  Tv,
  Film,
  Flame,
  CheckCircle2,
  Trash2,
  Radio,
  Clock,
  ArrowRight,
  Loader2,
  Megaphone,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/app/actions/notifications'
import { getWatchlist } from '@/app/actions/watchlist'

export interface AppNotification {
  id: string
  title: string
  message: string
  timestamp: string
  type: 'airing' | 'trending' | 'watchlist' | 'system' | 'info' | 'release'
  link?: string
  read: boolean
  airingAt?: number
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

export function NotificationsModal({ isOpen, onClose, onUnreadChange }: NotificationsModalProps) {
  const [list, setList] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'airing' | 'trending' | 'watchlist'>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)

  const playNotificationSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12) // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }

  const fetchAllNotifications = async () => {
    setLoading(true)

    // 1. Database notifications
    const dbRes = await getUserNotifications().catch(() => ({ success: false, notifications: [] }))
    const dbNotifs: AppNotification[] = (dbRes.notifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timestamp: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: n.type || 'system',
      link: n.link || undefined,
      read: n.isRead,
    }))

    // 2. Fetch live anime schedule, trending movies & shows, and user watchlist concurrently
    const [airingRes, trendingMoviesRes, trendingShowsRes, watchlistRes] = await Promise.all([
      fetch('/api/anilist/airing-schedule').then((r) => r.json()).catch(() => ({ schedules: [] })),
      fetch('/api/tmdb/trending/movies?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
      fetch('/api/tmdb/trending/shows?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
      getWatchlist().catch(() => ({ items: [], authenticated: false })),
    ])

    const dynamicNotifs: AppNotification[] = []
    const watchlistData = (watchlistRes as any)?.items || (watchlistRes as any)?.watchlist || []
    const watchlistTitles = new Set(
      watchlistData.map((w: any) => (w.title || '').toLowerCase())
    )

    // 3. Process Live Anime Airing Alerts
    const nowSec = Math.floor(Date.now() / 1000)
    const schedules: any[] = airingRes?.schedules || []
    
    // Sort schedules by closest to now
    schedules.slice(0, 8).forEach((item) => {
      if (!item?.media) return
      const title = item.media.title?.english || item.media.title?.romaji || 'Anime'
      const timeDiff = item.airingAt - nowSec
      const isPast = timeDiff <= 0
      const isVeryRecent = isPast && Math.abs(timeDiff) < 14400 // Aired in last 4 hours
      const isUpcomingToday = !isPast && timeDiff < 43200 // Airing in next 12 hours

      let tag = isVeryRecent ? '🔴 LIVE NOW' : isUpcomingToday ? '⏰ AIRING SOON' : '📺 TODAY'
      let message = isVeryRecent
        ? `Episode ${item.episode} just aired in Tokyo! Stream and join the live discussion.`
        : isUpcomingToday
        ? `Episode ${item.episode} premieres in ~${Math.round(timeDiff / 3600)}h on Tokyo TV.`
        : `Episode ${item.episode} is scheduled for today.`

      const isWatchlisted = watchlistTitles.has(title.toLowerCase())
      if (isWatchlisted) {
        tag = `⭐ WATCHLIST AIRING: ${tag}`
      }

      dynamicNotifs.push({
        id: `airing_${item.id}`,
        title: `${tag} — ${title}`,
        message,
        timestamp: new Date(item.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: isWatchlisted ? 'watchlist' : 'airing',
        link: `/anime/${item.media.id}`,
        read: false,
        airingAt: item.airingAt,
      })
    })

    // 4. Process Trending Movie Drops
    const topMovie = trendingMoviesRes?.results?.[0]
    if (topMovie) {
      dynamicNotifs.push({
        id: `trending_movie_${topMovie.id}`,
        title: `🔥 #1 Movie Drop: ${topMovie.title}`,
        message: `Over ${(topMovie.popularity || 150).toFixed(0)}k cinephiles are streaming this today in 4K UHD.`,
        timestamp: 'Today',
        type: 'trending',
        link: `/title/movie/${topMovie.id}`,
        read: false,
      })
    }

    // 5. Process Trending Series Drop
    const topShow = trendingShowsRes?.results?.[0]
    if (topShow) {
      dynamicNotifs.push({
        id: `trending_show_${topShow.id}`,
        title: `📺 Viral Series: ${topShow.name}`,
        message: `Trending globally with high rating (${(topShow.vote_average || 8.0).toFixed(1)}/10 IMDb).`,
        timestamp: 'Today',
        type: 'trending',
        link: `/title/tv/${topShow.id}`,
        read: false,
      })
    }

    // Combine all
    const combined = [...dbNotifs, ...dynamicNotifs]

    // Apply read states from localStorage
    try {
      const readMap = new Set(JSON.parse(localStorage.getItem('7media_read_notifs') || '[]'))
      combined.forEach((n) => {
        if (readMap.has(n.id)) n.read = true
      })
    } catch {}

    setList(combined)
    setLoading(false)

    const unread = combined.filter((n) => !n.read).length
    if (onUnreadChange) onUnreadChange(unread)

    if (unread > 0) {
      playNotificationSound()
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAllNotifications()
    }
  }, [isOpen])

  const markItemRead = async (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      const readMap = new Set(JSON.parse(localStorage.getItem('7media_read_notifs') || '[]'))
      readMap.add(id)
      localStorage.setItem('7media_read_notifs', JSON.stringify(Array.from(readMap)))
    } catch {}
    if (id.startsWith('broadcast_')) {
      await markNotificationAsRead(id)
    }
    const newUnread = list.filter((n) => (n.id === id ? false : !n.read)).length
    if (onUnreadChange) onUnreadChange(newUnread)
  }

  const markAllRead = async () => {
    const updated = list.map((n) => ({ ...n, read: true }))
    setList(updated)
    try {
      const allIds = updated.map((n) => n.id)
      localStorage.setItem('7media_read_notifs', JSON.stringify(allIds))
    } catch {}
    await markAllNotificationsAsRead()
    if (onUnreadChange) onUnreadChange(0)
  }

  const clearAll = () => {
    setList([])
    if (onUnreadChange) onUnreadChange(0)
  }

  const filteredList = useMemo(() => {
    if (activeTab === 'airing') return list.filter((n) => n.type === 'airing')
    if (activeTab === 'trending') return list.filter((n) => n.type === 'trending')
    if (activeTab === 'watchlist') return list.filter((n) => n.type === 'watchlist')
    return list
  }, [list, activeTab])

  const unreadCount = list.filter((n) => !n.read).length

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-zinc-950/95 p-6 md:p-7 shadow-2xl shadow-black/90 max-h-[88vh] flex flex-col justify-between backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                <Bell size={20} className="animate-wiggle" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black font-display uppercase tracking-tight text-white">
                    Smart Alerts &amp; Drops
                  </h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground animate-pulse">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">Tokyo anime broadcasts &amp; 4K movie drops</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
                title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'All Alerts', icon: Bell },
              { id: 'airing', label: '🔴 Live Anime', icon: Tv },
              { id: 'trending', label: '🔥 Top Drops', icon: Flame },
              { id: 'watchlist', label: '⭐ My Watchlist', icon: Star },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar my-3 max-h-[50vh]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span>Scanning Tokyo live broadcasts &amp; movie releases...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs space-y-1.5">
              <Bell size={36} className="mx-auto mb-2 opacity-30 text-primary" />
              <p className="font-bold text-white text-sm">No new alerts in this category</p>
              <p className="text-[11px] text-zinc-500">You are all caught up with latest broadcasts!</p>
            </div>
          ) : (
            filteredList.map((item) => (
              <Link
                key={item.id}
                href={item.link || '#'}
                onClick={() => {
                  markItemRead(item.id)
                  onClose()
                }}
                className={`block p-4 rounded-2xl border transition-all duration-200 group relative ${
                  item.read
                    ? 'border-white/5 bg-white/[0.02] text-zinc-400'
                    : 'border-primary/40 bg-gradient-to-r from-primary/15 via-rose-500/5 to-white/[0.03] text-white shadow-lg shadow-primary/10 hover:border-primary'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs group-hover:text-primary transition-colors min-w-0">
                    {item.type === 'watchlist' ? (
                      <Star size={14} className="text-amber-400 shrink-0 fill-amber-400" />
                    ) : item.type === 'airing' ? (
                      <Tv size={14} className="text-pink-400 shrink-0" />
                    ) : item.type === 'trending' ? (
                      <Flame size={14} className="text-amber-400 shrink-0" />
                    ) : (
                      <Megaphone size={14} className="text-primary shrink-0" />
                    )}
                    <span className="truncate font-display">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 pl-5">
                  {item.message}
                </p>
              </Link>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3.5 mt-1">
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Mark all read</span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear list</span>
          </button>
        </div>
      </div>
    </div>
  )
}
