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
  Trash2
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

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Airing Alert: Demon Slayer',
    message: 'Episode 8 (Hashira Training Arc) broadcast is now scheduled!',
    timestamp: '10m ago',
    type: 'airing',
    link: '/anime',
    read: false,
  },
  {
    id: 'notif_2',
    title: 'Trending Worldwide',
    message: 'Inception and Interstellar are trending in the Top 10 today.',
    timestamp: '2h ago',
    type: 'trending',
    link: '/movies?category=trending',
    read: false,
  },
  {
    id: 'notif_3',
    title: 'Watchlist Reminder',
    message: 'You have unwatched movies saved in your "Watchlist" catalog.',
    timestamp: '1d ago',
    type: 'watchlist',
    link: '/my-list',
    read: true,
  },
]

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [list, setList] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('7media_notifications')
      if (stored) setList(JSON.parse(stored))
    } catch {
      // ignore
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-primary/15 text-primary border border-primary/20">
              <Bell size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-white">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">Airing schedules and catalog alerts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action controls */}
        {list.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1 text-xs">
            <button
              type="button"
              onClick={markAllRead}
              className="text-primary hover:underline font-semibold"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-zinc-400 hover:text-rose-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-72 overflow-y-auto scrollbar-hide space-y-2.5">
          {list.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-zinc-600" />
              <p>You&apos;re all caught up! No new notifications.</p>
            </div>
          ) : (
            list.map((item) => (
              <Link
                key={item.id}
                href={item.link || '#'}
                onClick={onClose}
                className={`block rounded-2xl border p-3.5 transition-all ${
                  item.read
                    ? 'border-white/5 bg-zinc-900/40 opacity-75 hover:opacity-100 hover:bg-zinc-900/80'
                    : 'border-primary/30 bg-primary/10 hover:border-primary/60 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'airing' ? (
                      <Tv size={14} className="text-primary shrink-0" />
                    ) : item.type === 'trending' ? (
                      <Flame size={14} className="text-amber-400 shrink-0" />
                    ) : (
                      <Sparkles size={14} className="text-emerald-400 shrink-0" />
                    )}
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                  </div>
                  <span className="text-[10px] text-zinc-500 shrink-0">{item.timestamp}</span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{item.message}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
