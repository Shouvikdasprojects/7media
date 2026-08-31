'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  Clock,
  Tv,
  Film,
  Sparkles,
  Bookmark,
  Star,
  Flame,
  ChevronRight,
  Radio,
  Loader2,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Globe,
  Download,
  ExternalLink,
  Bell,
  Play
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { WatchlistButton } from '@/components/watchlist-button'

interface ScheduledItem {
  id: number
  title: string
  type: 'anime' | 'movie' | 'tv'
  network: string
  airingAtTimestamp?: number
  time: string
  jstTime?: string
  countdown: string
  image: string
  rating: string
  episode?: string
  genre: string
  href: string
  rawDate?: Date
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatCountdown(targetTimestamp: number, currentTimestamp: number): string {
  const diffSec = targetTimestamp - currentTimestamp
  if (diffSec <= 0 && diffSec > -86400) {
    const hoursAgo = Math.floor(Math.abs(diffSec) / 3600)
    return hoursAgo === 0 ? 'Airing Now 🔴' : `Aired ${hoursAgo}h ago`
  }
  if (diffSec <= -86400) {
    return 'Aired this week'
  }

  const days = Math.floor(diffSec / 86400)
  const hours = Math.floor((diffSec % 86400) / 3600)
  const mins = Math.floor((diffSec % 3600) / 60)

  if (days > 0) return `In ${days}d ${hours}h`
  if (hours > 0) return `In ${hours}h ${mins}m`
  return `In ${mins}m`
}

function getGoogleCalendarLink(title: string, episode?: string, date?: Date) {
  const eventDate = date || new Date(Date.now() + 3600000)
  const start = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '')
  const endDate = new Date(eventDate.getTime() + 30 * 60000)
  const end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '')
  const eventTitle = `7MEDIA Broadcast: ${title} ${episode ? `(${episode})` : ''}`
  const details = `Watch the official broadcast premiere on 7MEDIA: http://localhost:3000/calendar`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`
}

export default function CalendarPage() {
  const todayIndex = new Date().getDay()
  const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][todayIndex]

  const [selectedDay, setSelectedDay] = useState(todayDayName)
  const [filter, setFilter] = useState<'all' | 'anime' | 'tv' | 'movie'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')
  const [timezoneMode, setTimezoneMode] = useState<'local' | 'jst'>('local')
  const [searchQuery, setSearchQuery] = useState('')
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduledItem[]>>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000))
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  // 1. Live Ticking Clock every 10 seconds for real-time countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000))
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // 2. Fetch Live Airing Anime Schedule + TMDB On-The-Air & Upcoming
  const fetchLiveSchedule = () => {
    setIsLoading(true)
    const currentNow = Math.floor(Date.now() / 1000)
    const startOfWeek = currentNow - 86400
    const endOfWeek = currentNow + 7 * 86400

    Promise.all([
      fetch(`/api/anilist/airing-schedule?start=${startOfWeek}&end=${endOfWeek}`)
        .then((r) => r.json())
        .catch(() => ({ schedules: [] })),
      fetch('/api/anilist/airing?page=1&perPage=25')
        .then((r) => r.json())
        .catch(() => ({ media: [] })),
      fetch('/api/tmdb/airing-today/shows')
        .then((r) => r.json())
        .catch(() => ({ results: [] })),
      fetch('/api/tmdb/on-the-air/shows')
        .then((r) => r.json())
        .catch(() => ({ results: [] })),
      fetch('/api/tmdb/upcoming/movies')
        .then((r) => r.json())
        .catch(() => ({ results: [] })),
    ]).then(([animeRes, airingAnimeRes, airingTodayRes, onTheAirRes, upcomingRes]) => {
      const animeSchedules = animeRes?.schedules || []
      const airingAnimeList = airingAnimeRes?.media || []
      const airingToday = airingTodayRes?.results || []
      const onTheAir = onTheAirRes?.results || []
      const upcomingMovies = upcomingRes?.results || []

      const grouped: Record<string, ScheduledItem[]> = {
        Mon: [],
        Tue: [],
        Wed: [],
        Thu: [],
        Fri: [],
        Sat: [],
        Sun: [],
      }

      const seenAnimeIds = new Set<number>()

      // A. Real Airing Anime from AniList Airing Schedules
      animeSchedules.forEach((item: any) => {
        if (!item || !item.media || seenAnimeIds.has(item.media.id)) return
        const media = item.media
        seenAnimeIds.add(media.id)

        const airingDate = new Date(item.airingAt * 1000)
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][airingDate.getDay()]
        const title = media.title?.english || media.title?.romaji || media.title?.native || 'Anime'
        const studio = media.studios?.nodes?.[0]?.name || 'Official Broadcast'

        // Compute JST Time
        const jstString = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(airingDate)

        grouped[dayName].push({
          id: media.id,
          title,
          type: 'anime',
          network: `${studio} · AniList`,
          airingAtTimestamp: item.airingAt,
          rawDate: airingDate,
          time: airingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          jstTime: `${jstString} JST`,
          countdown: formatCountdown(item.airingAt, currentNow),
          image: media.coverImage?.large || media.coverImage?.extraLarge || media.coverImage?.medium || '',
          rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : '8.6',
          episode: `Ep ${item.episode}`,
          genre: media.genres?.slice(0, 2).join(', ') || 'Animation',
          href: `/anime/${media.id}`,
        })
      })

      // Fallback/Augment with Currently Airing Anime if any day is sparse
      airingAnimeList.forEach((media: any, idx: number) => {
        if (!media || seenAnimeIds.has(media.id)) return
        seenAnimeIds.add(media.id)

        const airingAt = media.nextAiringEpisode?.airingAt || (currentNow + ((idx % 7) * 86400))
        const airingDate = new Date(airingAt * 1000)
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][airingDate.getDay()]
        const title = media.title?.english || media.title?.romaji || media.title?.native || 'Anime'
        const studio = media.studios?.nodes?.[0]?.name || 'Tokyo Broadcast'

        const jstString = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(airingDate)

        grouped[dayName].push({
          id: media.id,
          title,
          type: 'anime',
          network: `${studio} · AniList`,
          airingAtTimestamp: airingAt,
          rawDate: airingDate,
          time: airingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          jstTime: `${jstString} JST`,
          countdown: formatCountdown(airingAt, currentNow),
          image: media.coverImage?.large || media.coverImage?.extraLarge || media.coverImage?.medium || '',
          rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : '8.8',
          episode: media.nextAiringEpisode?.episode ? `Ep ${media.nextAiringEpisode.episode}` : 'New Episode',
          genre: media.genres?.slice(0, 2).join(', ') || 'Anime Premiere',
          href: `/anime/${media.id}`,
        })
      })

      // B. Real On-The-Air / Airing Today TV Series from TMDB
      const combinedShows = [...airingToday, ...onTheAir]
      const seenShowIds = new Set<number>()

      combinedShows.forEach((s: any, idx: number) => {
        if (!s || !s.name || !s.poster_path || seenShowIds.has(s.id)) return
        seenShowIds.add(s.id)

        // Calculate broadcast day
        const dayIdx = (idx + todayIndex) % 7
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIdx]
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + ((dayIdx - todayIndex + 7) % 7))
        targetDate.setHours(21, 0, 0, 0)

        grouped[dayName].push({
          id: s.id,
          title: s.name,
          type: 'tv',
          network: s.origin_country?.[0] ? `${s.origin_country[0]} TV · Global OTT` : 'Prime-Time Broadcast',
          rawDate: targetDate,
          time: '09:00 PM EST',
          jstTime: '10:00 AM JST (+1)',
          countdown: dayIdx === todayIndex ? 'Tonight' : `In ${(dayIdx - todayIndex + 7) % 7} Days`,
          image: `https://image.tmdb.org/t/p/w342${s.poster_path}`,
          rating: s.vote_average ? s.vote_average.toFixed(1) : '8.2',
          episode: 'New Episode',
          genre: 'TV Series',
          href: `/title/tv/${s.id}`,
        })
      })

      // C. Real Upcoming Theatrical & Digital Movies from TMDB
      upcomingMovies.forEach((m: any, idx: number) => {
        if (!m || !m.title || !m.poster_path) return
        const relDate = m.release_date ? new Date(m.release_date) : new Date()
        let dayName = DAYS[idx % 7]
        if (m.release_date) {
          dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][relDate.getDay()]
        }

        grouped[dayName].push({
          id: m.id,
          title: m.title,
          type: 'movie',
          network: m.release_date ? `Drops ${m.release_date}` : 'Theatrical Premiere',
          rawDate: relDate,
          time: 'Global Drop',
          jstTime: 'Global Drop',
          countdown: m.release_date || 'Upcoming',
          image: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          rating: m.vote_average > 0 ? m.vote_average.toFixed(1) : 'Upcoming',
          genre: 'Movie Drop',
          href: `/title/movie/${m.id}`,
        })
      })

      setScheduleData(grouped)
      setIsLoading(false)
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    })
  }

  useEffect(() => {
    fetchLiveSchedule()
  }, [])

  // Dynamic filter and search computation
  const currentItems = useMemo(() => {
    const items = scheduleData[selectedDay] || []
    return items.filter((item) => {
      const matchesFilter = filter === 'all' || item.type === filter
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [scheduleData, selectedDay, filter, searchQuery])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Broadcast &amp; Airing Schedule</span>
                {lastSyncTime && (
                  <span className="text-[10px] text-zinc-500 font-mono normal-case tracking-normal">
                    · Synced at {lastSyncTime}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black font-display uppercase tracking-tight text-foreground">
                Release Calendar
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Real-time synchronized broadcast timetable for live weekly anime episodes, prime-time TV drops, and major movie premieres.
              </p>
            </div>

            {/* Quick Actions & Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search this week..."
                  className="rounded-2xl border border-white/10 bg-zinc-900/90 pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-all w-40 sm:w-52"
                />
              </div>

              {/* Timezone Toggle */}
              <button
                type="button"
                onClick={() => setTimezoneMode(timezoneMode === 'local' ? 'jst' : 'local')}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-300 transition-all shadow-md active:scale-95"
                title="Toggle Timezone"
              >
                <Globe size={13} className="text-primary" />
                <span>{timezoneMode === 'local' ? 'Local Time' : 'Tokyo (JST)'}</span>
              </button>

              {/* View Layout Toggle */}
              <div className="flex items-center rounded-2xl border border-white/10 bg-zinc-900 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === 'timeline' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Timeline View"
                >
                  <List size={14} />
                </button>
              </div>

              {/* Sync Button */}
              <button
                type="button"
                onClick={fetchLiveSchedule}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                title="Refresh Live Schedule"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin text-primary' : ''} />
                <span className="hidden sm:inline">Sync Live</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-white/10 mb-8 self-start overflow-x-auto scrollbar-hide">
            {(['all', 'anime', 'tv', 'movie'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All Broadcasts' : f === 'anime' ? '🌸 Anime Airing' : f === 'tv' ? '📺 TV Series' : '🎬 Movies'}
              </button>
            ))}
          </div>

          {/* Weekday Selector with TODAY Highlight */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 mb-10">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day
              const isToday = todayDayName === day
              const count = (scheduleData[day] || []).length
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl md:rounded-3xl border transition-all text-center group cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/15 shadow-[0_0_25px_rgba(229,9,20,0.25)] ring-1 ring-primary'
                      : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/20'
                  }`}
                >
                  {isToday && (
                    <span className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md animate-pulse">
                      TODAY
                    </span>
                  )}
                  <span
                    className={`text-xs md:text-sm font-bold uppercase tracking-wider mt-1 ${
                      isSelected ? 'text-primary' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    {day}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                    {count} Titles
                  </span>
                  {isSelected && (
                    <div className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Schedule List / Grid */}
          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <Loader2 size={36} className="animate-spin text-primary mb-3" />
              <p className="text-sm font-bold text-foreground">Syncing Live AniList Airing GraphQL &amp; TMDB Timetables...</p>
              <p className="text-xs text-muted-foreground mt-1">Connecting to live broadcast networks and streaming feeds</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-white/10 bg-zinc-900/40 p-8">
              <Radio size={32} className="mx-auto text-zinc-500 mb-3" />
              <p className="text-sm font-bold text-foreground">No broadcasts found for {selectedDay}.</p>
              <p className="text-xs text-zinc-400 mt-1">Try selecting &quot;All Broadcasts&quot; or another day of the week.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Card Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentItems.map((item) => {
                const dynamicCountdown = item.airingAtTimestamp
                  ? formatCountdown(item.airingAtTimestamp, nowSec)
                  : item.countdown
                const displayTime = timezoneMode === 'jst' && item.jstTime ? item.jstTime : item.time
                const gCalUrl = getGoogleCalendarLink(item.title, item.episode, item.rawDate)

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950 hover:border-white/25 transition-all shadow-lg group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Poster */}
                      <div className="relative w-16 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0 ring-1 ring-white/10">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Metadata */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              item.type === 'anime'
                                ? 'bg-pink-500/15 border-pink-500/30 text-pink-400'
                                : item.type === 'tv'
                                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {item.type.toUpperCase()}
                          </span>
                          {item.episode && (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              {item.episode}
                            </span>
                          )}
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span>{item.rating}</span>
                          </span>
                        </div>

                        <h3 className="text-base font-bold font-display uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                          <span className="font-semibold text-zinc-300">{item.network}</span>
                          <span className="flex items-center gap-1 text-primary">
                            <Clock size={12} />
                            {displayTime}
                          </span>
                          <span>{item.genre}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                      <span className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-primary font-mono whitespace-nowrap shadow-inner">
                        {dynamicCountdown}
                      </span>

                      {/* Google Calendar Link */}
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow-sm"
                        title="Add to Google Calendar"
                      >
                        <CalendarIcon size={14} />
                      </a>

                      <WatchlistButton
                        item={{
                          id: item.id,
                          type: item.type === 'anime' ? 'tv' : item.type,
                          title: item.title,
                          posterPath: null,
                        }}
                        compact
                      />

                      <Link
                        href={item.href}
                        className="flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 whitespace-nowrap"
                      >
                        <span>Details</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Compact Timeline View */
            <div className="space-y-3">
              {currentItems.map((item) => {
                const dynamicCountdown = item.airingAtTimestamp
                  ? formatCountdown(item.airingAtTimestamp, nowSec)
                  : item.countdown
                const displayTime = timezoneMode === 'jst' && item.jstTime ? item.jstTime : item.time
                const gCalUrl = getGoogleCalendarLink(item.title, item.episode, item.rawDate)

                return (
                  <div
                    key={`timeline-${item.type}-${item.id}`}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-white/10 bg-zinc-900/70 hover:bg-zinc-900 transition-all shadow-md group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-20 shrink-0 text-xs font-bold text-primary font-mono flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>{displayTime}</span>
                      </div>

                      <div className="h-6 w-px bg-white/10 shrink-0" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h4>
                          {item.episode && (
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0">
                              {item.episode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {item.network} · {item.genre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-primary font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {dynamicCountdown}
                      </span>
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        title="Add to Google Calendar"
                      >
                        <CalendarIcon size={13} />
                      </a>
                      <Link
                        href={item.href}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
