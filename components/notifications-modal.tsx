'use client'

import { useState, useEffect } from 'react'
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
  Loader2
} from 'lucide-react'

export interface AppNotification {
  id: string
  title: string
  message: string
  timestamp: string
  type: 'airing' | 'trending' | 'watchlist'
  link?: string
  read: boolean
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [list, setList] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Fetch live airing anime & trending movies to populate real-time notifications
    Promise.all([
      fetch('/api/anilist/airing-schedule').then((r) => r.json()).catch(() => ({ schedules: [] })),
      fetch('/api/tmdb/trending/movies?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
    ]).then(([airingRes, trendingRes]) => {
      const liveNotifications: AppNotification[] = []

      // Top Airing Anime Drop
      const airingItem = airingRes?.schedules?.[0]
      if (airingItem && airingItem.media) {
        const title = airingItem.media.title?.english || airingItem.media.title?.romaji || 'Anime'
        liveNotifications.push({
          id: `airing_${airingItem.id}`,
          title: `🔴 Airing Today: ${title}`,
          message: `Episode ${airingItem.episode} is broadcasting today on Tokyo networks!`,
          timestamp: 'Just now',
          type: 'airing',
          link: `/anime/${airingItem.media.id}`,
          read: false,
        })
      }

      // Top Trending Movie
      const topMovie = trendingRes?.results?.[0]
      if (topMovie) {
        liveNotifications.push({
          id: `trending_${topMovie.id}`,
          title: `🔥 #1 Trending Today: ${topMovie.title}`,
          message: `Over ${(topMovie.popularity || 150).toFixed(0)}k cinephiles are streaming this today.`,
          timestamp: '1h ago',
          type: 'trending',
          link: `/title/movie/${topMovie.id}`,
          read: false,
        })
      }

      // User Watchlist notification
      try {
        const watchlist = JSON.parse(localStorage.getItem('7media_watchlist') || '[]')
        if (watchlist.length > 0) {
          liveNotifications.push({
            id: 'watchlist_reminder',
            title: `🍿 Watchlist Reminder (${watchlist.length} Saved)`,
            message: `You have unwatched titles waiting in your 7MEDIA catalog.`,
            timestamp: 'Today',
            type: 'watchlist',
            link: '/my-list',
            read: false,
          })
        }
      } catch {}

      // Combine with local read status
      try {
        const stored = localStorage.getItem('7media_notifications')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const readMap = new Set(parsed.filter((p: any) => p.read).map((p: any) => p.id))
            liveNotifications.forEach((n) => {
              if (readMap.has(n.id)) n.read = true
            })
          }
        }
      } catch {}

      setList(liveNotifications)
      setLoading(false)
    })
  }, [])

  if (!isOpen) return null

  const markAllRead = () => {
    const updated = list.map((n) => ({ ...n, read: true }))
    setList(updated)
    try {
      localStorage.setItem('7media_notifications', JSON.stringify(updated))
    } catch {}
  }

  const clearAll = () => {
    setList([])
    try {
      localStorage.setItem('7media_notifications', JSON.stringify([]))
    } catch {}
  }

  const unreadCount = list.filter((n) => !n.read).length

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90 max-h-[85vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(229,9,20,0.25)]">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-display uppercase tracking-tight text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">Live airing updates &amp; trending alerts</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-hide my-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span>Fetching live alerts...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p>No new notifications right now.</p>
            </div>
          ) : (
            list.map((item) => (
              <Link
                key={item.id}
                href={item.link || '#'}
                onClick={onClose}
                className={`block p-3.5 rounded-2xl border transition-all duration-200 group ${
                  item.read
                    ? 'border-white/5 bg-zinc-900/40 text-zinc-400'
                    : 'border-white/15 bg-zinc-900/90 text-white shadow-md hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                  {item.message}
                </p>
              </Link>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 size={13} />
            <span>Mark all read</span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold text-red-400/80 hover:text-red-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear all</span>
          </button>
        </div>
      </div>
    </div>
  )
}
