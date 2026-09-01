'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  Folder,
  Share2,
  Star,
  Play,
  Check,
  BookmarkPlus,
  Clapperboard,
  Film,
  Sparkles,
  Tv,
  Flame,
  Copy,
  MessageCircle,
  Send,
  Globe2,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { useTrendingMovies } from '@/lib/tmdb/hooks'

export default function PublicListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: trendingMovies } = useTrendingMovies('week')
  const [copied, setCopied] = useState(false)
  const [cloned, setCloned] = useState(false)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)

  // Catalog info
  const rawTitle = decodeURIComponent(id.replace(/-/g, ' '))
  const catalogName = rawTitle.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
  const items = (trendingMovies?.results || []).slice(0, 18)

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://7media.pages.dev/list/${id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  const handleCloneList = () => {
    try {
      // Save items to local watchlist/custom catalogs
      const currentSaved = JSON.parse(localStorage.getItem('7media_watchlist') || '[]')
      const newItems = items.map((m: any) => ({
        id: m.id,
        tmdbId: m.id,
        mediaType: 'movie',
        title: m.title,
        posterPath: m.poster_path,
        backdropPath: m.backdrop_path,
        rating: String(m.vote_average || '8.0'),
        year: (m.release_date || '').split('-')[0] || '2026',
      }))
      const combined = [...currentSaved, ...newItems.filter((n) => !currentSaved.some((c: any) => c.tmdbId === n.tmdbId))]
      localStorage.setItem('7media_watchlist', JSON.stringify(combined))
      setCloned(true)
      setTimeout(() => setCloned(false), 3500)
    } catch {
      setCloned(true)
    }
  }

  const shareText = `Check out this curated playlist "${catalogName}" on 7MEDIA: ${currentUrl}`

  const shareSocials = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Globe2,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-600 hover:bg-sky-500 text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`Watch "${catalogName}" on 7MEDIA`)}`,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-28 pb-20 max-w-[1880px] mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="mb-10 rounded-3xl border border-white/15 bg-gradient-to-br from-emerald-950/40 via-zinc-950/90 to-black p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                <Folder size={36} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Shared Community Playlist
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    • 4K UHD Discovery
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-white mt-1.5 leading-tight">
                  {catalogName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                  Curated collection with {items.length} titles. Stream instantly or save to your 7MEDIA account.
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Social Share Group */}
              <div className="flex items-center gap-2">
                {shareSocials.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center w-11 h-11 rounded-2xl transition active:scale-95 shadow-md ${s.color}`}
                    title={`Share to ${s.name}`}
                  >
                    <s.icon size={18} />
                  </a>
                ))}
                
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 active:scale-95 shadow-md"
                  title="Copy Link"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* 1-Click Clone to My Watchlist */}
              <button
                type="button"
                onClick={handleCloneList}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition active:scale-95 shadow-lg shadow-emerald-500/30 cursor-pointer"
              >
                {cloned ? <Check size={17} /> : <BookmarkPlus size={17} />}
                <span>{cloned ? 'Saved to My 7MEDIA!' : 'Save to My Watchlist'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Titles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {items.map((item, idx) => (
            <div key={item.id} className="group relative flex flex-col">
              <Link
                href={`/title/movie/${item.id}`}
                className="block aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 relative ring-1 ring-white/10 group-hover:ring-emerald-500/60 transition-all duration-300 shadow-lg"
              >
                {/* Ranking Pill */}
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-black text-emerald-400 font-mono shadow-md">
                  #{idx + 1}
                </div>

                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs px-2 text-center">
                    {item.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-95 transition-opacity" />

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl shadow-emerald-500/40 transform group-hover:scale-110 transition-transform">
                    <Play size={20} fill="currentColor" />
                  </span>
                </div>
              </Link>

              <div className="mt-2.5 px-0.5">
                <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                  <span>{(item.release_date || '').split('-')[0] || 'Movie'}</span>
                  {item.vote_average ? (
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
