'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Folder, Share2, Star, Play, Check, BookmarkPlus, Clapperboard } from 'lucide-react'
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

  // Catalog info
  const catalogName = decodeURIComponent(id.replace(/-/g, ' ')).replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
  const items = (trendingMovies?.results || []).slice(0, 12)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleCloneList = () => {
    setCloned(true)
    setTimeout(() => setCloned(false), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-28 pb-20 max-w-[1880px] mx-auto w-full">
        {/* Header Hero */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-950/40 via-zinc-900/90 to-zinc-950 p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                <Folder size={32} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                  Shared Public Catalog
                </span>
                <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white mt-1">
                  {catalogName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Curated custom catalog • {items.length} titles available
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 active:scale-95 shadow-md"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                <span>{copied ? 'Link Copied' : 'Share Catalog'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloneList}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition active:scale-95 shadow-lg shadow-emerald-500/25"
              >
                {cloned ? <Check size={16} /> : <BookmarkPlus size={16} />}
                <span>{cloned ? 'Saved to My List!' : 'Save to My List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Titles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <Link
                href={`/title/movie/${item.id}`}
                className="block aspect-[2/3] overflow-hidden rounded-2xl bg-secondary relative ring-1 ring-border/70 group-hover:ring-emerald-500/50 transition-all duration-300"
              >
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                    {item.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play size={20} fill="currentColor" />
                  </span>
                </div>
              </Link>

              <div className="mt-2.5 px-0.5">
                <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>Movie</span>
                  {item.vote_average ? (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
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
