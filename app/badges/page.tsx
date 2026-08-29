'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  Eye,
  Star,
  Folder,
  Moon,
  Crown,
  Film
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useSession } from '@/lib/auth-client'
import { getUserReactions, getUserCatalogs } from '@/app/actions/catalogs'

interface Badge {
  id: string
  title: string
  subtitle: string
  category: string
  icon: any
  color: string
  bg: string
  border: string
  glow: string
  required: number
  current: number
  unlocked: boolean
  desc: string
}

export default function BadgesPage() {
  const { data: session } = useSession()
  const [watchedCount, setWatchedCount] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [catalogsCount, setCatalogsCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)

  useEffect(() => {
    // 1. Calculate reviews from localStorage
    let revCount = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('7media_reviews_')) {
          const items = JSON.parse(localStorage.getItem(key) || '[]')
          revCount += Array.isArray(items) ? items.length : 0
        }
      }
    } catch {}
    setReviewsCount(revCount)

    // 2. Calculate watched & liked
    if (session?.user) {
      getUserReactions().then((res) => {
        if (res.authenticated) {
          setWatchedCount(res.watchedIds.length)
          setLikedCount(res.likedIds.length)
        }
      })
      getUserCatalogs().then((res) => {
        if (res.authenticated) {
          setCatalogsCount(res.catalogs.length)
        }
      })
    } else {
      try {
        const watched = JSON.parse(localStorage.getItem('7media_watched') || '[]')
        setWatchedCount(Array.isArray(watched) ? watched.length : 0)
        const liked = JSON.parse(localStorage.getItem('7media_liked') || '[]')
        setLikedCount(Array.isArray(liked) ? liked.length : 0)
        const catalogs = JSON.parse(localStorage.getItem('7media_catalogs') || '[]')
        setCatalogsCount(Array.isArray(catalogs) ? catalogs.length : 0)
      } catch {}
    }
  }, [session?.user])

  const BADGES: Badge[] = [
    {
      id: 'pioneer',
      title: 'Cinema Pioneer',
      subtitle: 'Joined 7MEDIA',
      category: 'Community',
      icon: Film,
      color: 'text-emerald-400',
      bg: 'from-emerald-950/50 via-zinc-900 to-zinc-950',
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
      required: 1,
      current: 1,
      unlocked: true,
      desc: 'Became an active cinephile exploring the 7MEDIA cinema universe.',
    },
    {
      id: 'marathon',
      title: 'Marathon Legend',
      subtitle: 'Watch 5+ Titles',
      category: 'Watching',
      icon: Eye,
      color: 'text-cyan-400',
      bg: 'from-cyan-950/50 via-zinc-900 to-zinc-950',
      border: 'border-cyan-500/40',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      required: 5,
      current: Math.min(watchedCount, 5),
      unlocked: watchedCount >= 5,
      desc: 'Marked at least 5 movies, series, or anime as watched.',
    },
    {
      id: 'critic',
      title: 'Critical Eye',
      subtitle: 'Write a Review',
      category: 'Community',
      icon: Star,
      color: 'text-amber-400',
      bg: 'from-amber-950/50 via-zinc-900 to-zinc-950',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
      required: 1,
      current: Math.min(reviewsCount, 1),
      unlocked: reviewsCount >= 1,
      desc: 'Shared an honest star rating and written review with the community.',
    },
    {
      id: 'curator',
      title: 'Master Curator',
      subtitle: 'Create 2+ Folders',
      category: 'Collections',
      icon: Folder,
      color: 'text-pink-400',
      bg: 'from-pink-950/50 via-zinc-900 to-zinc-950',
      border: 'border-pink-500/40',
      glow: 'shadow-[0_0_30px_rgba(236,72,153,0.25)]',
      required: 2,
      current: Math.min(catalogsCount, 2),
      unlocked: catalogsCount >= 2,
      desc: 'Built custom catalog folders with color palettes and custom icons.',
    },
    {
      id: 'superfan',
      title: 'Superfan',
      subtitle: 'Like 3+ Titles',
      category: 'Engagement',
      icon: Flame,
      color: 'text-rose-400',
      bg: 'from-rose-950/50 via-zinc-900 to-zinc-950',
      border: 'border-rose-500/40',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
      required: 3,
      current: Math.min(likedCount, 3),
      unlocked: likedCount >= 3,
      desc: 'Showed appreciation by liking 3 or more movies, series, or anime.',
    },
    {
      id: 'vip',
      title: '7MEDIA VIP',
      subtitle: 'Unlock 4 Badges',
      category: 'Prestige',
      icon: Crown,
      color: 'text-amber-300',
      bg: 'from-amber-950/60 via-zinc-900 to-zinc-950',
      border: 'border-amber-400/50',
      glow: 'shadow-[0_0_35px_rgba(251,191,36,0.3)]',
      required: 4,
      current: 0, // Computed dynamically below
      unlocked: false,
      desc: 'Achieved elite VIP cinephile status by unlocking 4 achievements.',
    },
  ]

  // Calculate unlocked count dynamically
  const unlockedExceptVip = BADGES.filter((b) => b.id !== 'vip' && b.unlocked).length
  const vipIndex = BADGES.findIndex((b) => b.id === 'vip')
  if (vipIndex !== -1) {
    BADGES[vipIndex].current = Math.min(unlockedExceptVip, 4)
    BADGES[vipIndex].unlocked = unlockedExceptVip >= 4
  }

  const unlockedCount = BADGES.filter((b) => b.unlocked).length
  const totalCount = BADGES.length
  const progressPercent = Math.round((unlockedCount / totalCount) * 100)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header & Overview Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-6 md:p-10 shadow-2xl mb-12 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
                  <Trophy size={16} />
                  <span>Gamification &amp; Milestones</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black font-display uppercase tracking-tight text-foreground">
                  Cinephile Badges
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                  Unlock exclusive neon badges by watching titles, writing honest reviews, and curating your custom cinema folders.
                </p>
              </div>

              {/* Live Level Badge */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-inner self-start md:self-auto">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(229,9,20,0.3)]">
                  <Award size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Level</p>
                  <h3 className="text-lg font-black text-white">
                    {unlockedCount >= 5 ? 'Master Cinephile' : unlockedCount >= 3 ? 'Pro Curator' : 'Film Explorer'}
                  </h3>
                  <p className="text-xs text-primary font-bold">{unlockedCount} / {totalCount} Badges Unlocked</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
                <span>Overall Completion</span>
                <span className="text-white">{progressPercent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-zinc-800/80 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-rose-500 to-amber-500 transition-all duration-1000 shadow-[0_0_15px_rgba(229,9,20,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BADGES.map((badge) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.id}
                  className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all ${
                    badge.unlocked
                      ? `bg-gradient-to-b ${badge.bg} ${badge.border} ${badge.glow}`
                      : 'bg-zinc-950/60 border-white/5 opacity-75 grayscale hover:grayscale-0'
                  }`}
                >
                  <div>
                    {/* Header: Icon & Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                          badge.unlocked
                            ? `bg-white/10 ${badge.border} ${badge.color}`
                            : 'bg-zinc-900 border-white/10 text-zinc-600'
                        }`}
                      >
                        <Icon size={24} />
                      </div>

                      {badge.unlocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 size={13} />
                          Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2.5 py-0.5 rounded-full">
                          <Lock size={12} />
                          Locked
                        </span>
                      )}
                    </div>

                    <p className={`text-[10px] font-bold uppercase tracking-wider ${badge.color}`}>
                      {badge.category}
                    </p>
                    <h3 className="text-lg font-bold font-display uppercase tracking-tight text-white mt-0.5">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{badge.desc}</p>
                  </div>

                  {/* Progress info */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1.5">
                      <span>Requirement: {badge.subtitle}</span>
                      <span className="text-white">
                        {badge.current} / {badge.required}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          badge.unlocked ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, (badge.current / badge.required) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
