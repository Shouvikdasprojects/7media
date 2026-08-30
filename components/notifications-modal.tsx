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
  Loader2,
  Megaphone,
} from 'lucide-react'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/app/actions/notifications'

export interface AppNotification {
  id: string
  title: string
  message: string
  timestamp: string
  type: 'airing' | 'trending' | 'watchlist' | 'system' | 'info' | 'release'
  link?: string
  read: boolean
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

export function NotificationsModal({ isOpen, onClose, onUnreadChange }: NotificationsModalProps) {
  const [list, setList] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllNotifications = async () => {
    setLoading(true)

    // 1. Fetch system & database notifications
    const dbRes = await getUserNotifications().catch(() => ({ success: false, notifications: [] }))
    const dbNotifs: AppNotification[] = (dbRes.notifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timestamp: new Date(n.createdAt).toLocaleDateString(),
      type: n.type || 'system',
      link: n.link || undefined,
      read: n.isRead,
    }))

    // 2. Fetch live anime & trending movies
    const [airingRes, trendingRes] = await Promise.all([
      fetch('/api/anilist/airing-schedule').then((r) => r.json()).catch(() => ({ schedules: [] })),
      fetch('/api/tmdb/trending/movies?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
    ])

    const dynamicNotifs: AppNotification[] = []

    // Airing Anime
    const airingItem = airingRes?.schedules?.[0]
    if (airingItem?.media) {
      const animeTitle = airingItem.media.title?.english || airingItem.media.title?.romaji || 'Anime'
      dynamicNotifs.push({
        id: `airing_${airingItem.id}`,
        title: `🔴 Airing Today: ${animeTitle}`,
        message: `Episode ${airingItem.episode} is broadcasting today on Japanese TV!`,
        timestamp: 'Live',
        type: 'airing',
        link: `/anime/${airingItem.media.id}`,
        read: false,
      })
    }

    // Trending Movie
    const topMovie = trendingRes?.results?.[0]
    if (topMovie) {
      dynamicNotifs.push({
        id: `trending_${topMovie.id}`,
        title: `🔥 #1 Trending: ${topMovie.title}`,
        message: `Over ${(topMovie.popularity || 150).toFixed(0)}k cinephiles are streaming this today.`,
        timestamp: 'Today',
        type: 'trending',
        link: `/title/movie/${topMovie.id}`,
        read: false,
      })
    }

    // Combine
    const combined = [...dbNotifs, ...dynamicNotifs]

    // Apply local storage read state for dynamic notifications
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
  }

  useEffect(() => {
    if (isOpen) {
      fetchAllNotifications()
    }
  }, [isOpen])

  if (!isOpen) return null

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

  const unreadCount = list.filter((n) => !n.read).length

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xl shadow-black/90 max-h-[85vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(225,29,72,0.25)]">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-display uppercase tracking-tight text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Broadcast alerts &amp; trending drops</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar my-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span>Fetching live alerts...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-1">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold text-foreground">No new notifications</p>
              <p className="text-[11px]">You are all caught up!</p>
            </div>
          ) : (
            list.map((item) => (
              <Link
                key={item.id}
                href={item.link || '#'}
                onClick={() => {
                  markItemRead(item.id)
                  onClose()
                }}
                className={`block p-4 rounded-2xl border transition-all duration-200 group ${
                  item.read
                    ? 'border-border/40 bg-secondary/20 text-muted-foreground'
                    : 'border-primary/40 bg-secondary/50 text-foreground shadow-md hover:border-primary'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs group-hover:text-primary transition-colors">
                    {item.type === 'system' ? (
                      <Megaphone size={13} className="text-primary shrink-0" />
                    ) : item.type === 'airing' ? (
                      <Tv size={13} className="text-pink-400 shrink-0" />
                    ) : (
                      <Flame size={13} className="text-amber-400 shrink-0" />
                    )}
                    <span className="line-clamp-1">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {item.message}
                </p>
              </Link>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 size={13} />
            <span>Mark all read</span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold text-destructive hover:opacity-80 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear list</span>
          </button>
        </div>
      </div>
    </div>
  )
}
