'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Film,
  Search,
  Home,
  Tv,
  Sparkles,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  Clapperboard,
  RotateCcw
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function NotFound() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const QUICK_LINKS = [
    {
      title: 'Trending Movies',
      desc: 'Top box office & blockbusters',
      href: '/movies',
      icon: Film,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 hover:border-rose-500',
    },
    {
      title: 'TV Series',
      desc: 'Binge-worthy seasonal shows',
      href: '/series',
      icon: Tv,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500',
    },
    {
      title: 'Anime Universe',
      desc: 'Weekly seasonal broadcasts',
      href: '/anime',
      icon: Sparkles,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30 hover:border-pink-500',
    },
    {
      title: 'Release Calendar',
      desc: 'Live airing countdowns',
      href: '/calendar',
      icon: Calendar,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500',
    },
    {
      title: 'Watch Party',
      desc: 'Stream with friends in sync',
      href: '/party',
      icon: Users,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30 hover:border-purple-500',
    },
    {
      title: 'Explore Library',
      desc: 'Curated cinephile catalogs',
      href: '/my-list',
      icon: Compass,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:border-amber-500',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-20 md:px-8 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-3xl w-full text-center relative z-10">
          {/* Animated 404 Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.25em] shadow-[0_0_25px_rgba(229,9,20,0.25)] mb-6 animate-pulse">
            <Clapperboard size={14} />
            <span>Scene Missing in Final Cut</span>
          </div>

          {/* Large Glowing 404 Heading */}
          <div className="relative mb-2 select-none">
            <h1 className="text-8xl md:text-[160px] font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-800 leading-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-6xl md:text-8xl opacity-15 font-black text-primary blur-sm">
                404
              </span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-display uppercase tracking-tight text-white mb-3">
            Lost in the 7MEDIA Cinema Universe
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed mb-8">
            The reel you are looking for has been moved, deleted, or was never filmed. Search our entire library or jump into one of the popular hubs below.
          </p>

          {/* Direct Search Form */}
          <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-10">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, anime, series, directors..."
                className="w-full rounded-2xl border border-white/15 bg-zinc-900/90 pl-11 pr-28 py-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xl transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Hub Navigator Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto text-left">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={`p-4 rounded-2xl border transition-all duration-300 group hover:-translate-y-0.5 shadow-lg bg-zinc-950/80 backdrop-blur-xl ${link.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={20} />
                    <ArrowRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-white" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    {link.desc}
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Primary Home Button */}
          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-xl active:scale-95"
            >
              <Home size={15} />
              <span>Back to Home Lobby</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
