'use client'

import { useI18n } from '@/lib/i18n/context'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  X,
  Film,
  Tv,
  Sparkles,
  Star,
  TrendingUp,
  Clock,
  Trash2,
  ArrowRight,
  Loader2,
  Mic,
  MicOff
} from 'lucide-react'
import { AniListMedia } from '@/lib/anilist/types'
import { TMDBMovie, TMDBShow } from '@/lib/tmdb/types'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TrendingItem {
  id: number | string
  title: string
  year: string
  rating: number
  mediaType: 'MOVIE' | 'TV' | 'ANIME'
  posterUrl: string | null
  href: string
}

const RECENT_SEARCHES_KEY = '7media_recent_searches'

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'anime'>('all')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [shows, setShows] = useState<TMDBShow[]>([])
  const [anime, setAnime] = useState<AniListMedia[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const recog = new SpeechRecognition()
        recog.continuous = false
        recog.interimResults = false
        recog.lang = 'en-US'

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          if (transcript) {
            setQuery(transcript)
          }
          setIsListening(false)
        }

        recog.onerror = () => {
          setIsListening(false)
        }

        recog.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recog
      }
    }
  }, [])

  const toggleVoiceSearch = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Voice search is not supported in this browser. Please try Google Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Voice search error:', err)
      }
    }
  }

  // 1. Manage modal open, body lock, focus & load recent searches
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60)
      document.body.style.overflow = 'hidden'

      // Load recent searches from localStorage
      try {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (saved) {
          setRecentSearches(JSON.parse(saved))
        }
      } catch (e) {
        console.error('Failed to load recent searches', e)
      }

      // Fetch Trending if not loaded yet
      if (trendingList.length === 0) {
        fetchTrendingItems()
      }
    } else {
      document.body.style.overflow = 'auto'
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop()
        setIsListening(false)
      }
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Helper to fetch live trending movies, tv shows, and anime
  const fetchTrendingItems = async () => {
    setTrendingLoading(true)
    try {
      const [moviesRes, showsRes, animeRes] = await Promise.all([
        fetch('/api/tmdb/trending/movies?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
        fetch('/api/tmdb/trending/shows?timeWindow=day').then((r) => r.json()).catch(() => ({ results: [] })),
        fetch('/api/anilist/trending?perPage=6').then((r) => r.json()).catch(() => ({ media: [] })),
      ])

      const rawMovies: TMDBMovie[] = moviesRes?.results || []
      const rawShows: TMDBShow[] = showsRes?.results || []
      const rawAnime: AniListMedia[] = animeRes?.media || []

      const items: TrendingItem[] = []

      // Interleave movies & shows
      const maxLen = Math.max(rawMovies.length, rawShows.length, rawAnime.length)
      for (let i = 0; i < maxLen; i++) {
        if (rawMovies[i] && items.length < 15) {
          const m = rawMovies[i]
          items.push({
            id: m.id,
            title: m.title,
            year: m.release_date ? m.release_date.slice(0, 4) : '2026',
            rating: m.vote_average || 0,
            mediaType: 'MOVIE',
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : null,
            href: `/title/movie/${m.id}`,
          })
        }
        if (rawShows[i] && items.length < 15) {
          const s = rawShows[i]
          items.push({
            id: s.id,
            title: s.name,
            year: s.first_air_date ? s.first_air_date.slice(0, 4) : '2026',
            rating: s.vote_average || 0,
            mediaType: 'TV',
            posterUrl: s.poster_path ? `https://image.tmdb.org/t/p/w200${s.poster_path}` : null,
            href: `/title/tv/${s.id}`,
          })
        }
        if (rawAnime[i] && items.length < 15) {
          const a = rawAnime[i]
          const title = a.title.english || a.title.romaji || a.title.native || 'Anime'
          items.push({
            id: a.id,
            title,
            year: a.seasonYear ? String(a.seasonYear) : (a.startDate?.year ? String(a.startDate.year) : '2026'),
            rating: a.averageScore ? Number((a.averageScore / 10).toFixed(1)) : 8.5,
            mediaType: 'ANIME',
            posterUrl: a.coverImage?.large || a.coverImage?.medium || null,
            href: `/anime/${a.id}`,
          })
        }
      }

      setTrendingList(items.slice(0, 10))
    } catch (e) {
      console.error('Error fetching trending list:', e)
    } finally {
      setTrendingLoading(false)
    }
  }

  // 2. Save search term to localStorage
  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8)
      setRecentSearches(updated)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save recent search', e)
    }
  }

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = recentSearches.filter((s) => s !== termToRemove)
    setRecentSearches(updated)
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }
  }

  const clearAllRecent = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch (err) {
      console.error(err)
    }
  }

  // 3. Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setMovies([])
      setShows([])
      setAnime([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [tmdbRes, animeRes] = await Promise.all([
          fetch('/api/tmdb/search?query=' + encodeURIComponent(query) + '&page=1').then((r) => r.json()),
          fetch('/api/anilist/search?q=' + encodeURIComponent(query) + '&perPage=8').then((r) => r.json()),
        ])

        const tmdbResults = tmdbRes?.results || []
        setMovies(tmdbResults.filter((item: any) => item.media_type === 'movie' || (!item.media_type && item.title)).slice(0, 8))
        setShows(tmdbResults.filter((item: any) => item.media_type === 'tv' || (!item.media_type && item.name)).slice(0, 8))
        setAnime(animeRes?.media || [])
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const handleFullSearch = (searchTerm?: string) => {
    const term = searchTerm || query
    if (term.trim()) {
      saveSearchTerm(term.trim())
      onClose()
      router.push('/search?q=' + encodeURIComponent(term.trim()) + '&type=' + activeTab)
    }
  }

  const handleItemClick = (title: string) => {
    saveSearchTerm(title)
    onClose()
  }

  const totalResults = movies.length + shows.length + anime.length

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 p-3 pt-12 md:p-4 md:pt-20 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="relative border-b border-border/70 p-4 md:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleFullSearch()
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? "Listening... Speak title now" : t("searchPlaceholder")}
              className={`h-13 w-full rounded-2xl border bg-secondary/60 pl-12 pr-24 text-base md:text-lg text-foreground outline-none transition ${
                isListening
                  ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10 placeholder:text-rose-400'
                  : 'border-border/80 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20'
              }`}
            />

            {/* Right Action Icons: Voice Search + Clear/Loading */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {/* Microphone Voice Search Button */}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Search by Voice'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-1" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </form>

          {/* Category Filter Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: t('all'), icon: null },
              { id: 'movie', label: t('movies'), icon: Film },
              { id: 'tv', label: t('series'), icon: Tv },
              { id: 'anime', label: t('anime'), icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation active:scale-95 ' +
                    (activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground')}
                >
                  {Icon && <Icon size={12} />}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide space-y-6">
          {query.trim() === '' ? (
            <>
              {/* 1. RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <div className="animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Clock size={14} className="text-primary" />
                      <span>{t('recentSearches')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {t('clearAll')}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => {
                          setQuery(term)
                          handleFullSearch(term)
                        }}
                        className="group flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary cursor-pointer active:scale-95"
                      >
                        <Clock size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="rounded-full p-0.5 text-muted-foreground/60 hover:bg-card hover:text-foreground transition-colors"
                          aria-label={'Remove ' + term}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TRENDING SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
                    Trending
                  </h3>
                </div>

                {trendingLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3.5 p-2 rounded-2xl animate-pulse">
                        <div className="h-14 w-10 rounded-lg bg-secondary/80 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/5 rounded bg-secondary/80" />
                          <div className="h-3 w-2/5 rounded bg-secondary/60" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {trendingList.map((item) => (
                      <Link
                        key={item.href + '-' + item.id}
                        href={item.href}
                        onClick={() => handleItemClick(item.title)}
                        className="flex items-center gap-3.5 rounded-2xl p-2 transition-all hover:bg-secondary/70 active:scale-[0.99] group"
                      >
                        <div className="relative aspect-[2/3] w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm group-hover:shadow-md transition-shadow">
                          {item.posterUrl ? (
                            <Image
                              src={item.posterUrl}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary text-[10px] text-muted-foreground font-bold">
                              {item.mediaType}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{item.year}</span>
                            {item.rating > 0 && (
                              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                <Star size={11} className="fill-yellow-400" />
                                {item.rating.toFixed(1)}
                              </span>
                            )}
                            <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                              {item.mediaType}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : totalResults === 0 && !loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold text-foreground">No matches found for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-xs text-muted-foreground">Try checking the spelling or search another title.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Anime Results */}
              {(activeTab === 'all' || activeTab === 'anime') && anime.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Anime ({anime.length})</h4>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {anime.slice(0, 5).map((item) => {
                      const title = item.title.english || item.title.romaji || item.title.native || 'Anime'
                      const image = item.coverImage?.large || item.coverImage?.medium
                      const year = item.seasonYear ? String(item.seasonYear) : (item.startDate?.year ? String(item.startDate.year) : '2026')
                      const rating = item.averageScore ? (item.averageScore / 10).toFixed(1) : '8.5'

                      return (
                        <Link
                          key={item.id}
                          href={'/anime/' + item.id}
                          onClick={() => handleItemClick(title)}
                          className="flex items-center gap-3.5 rounded-2xl p-2 transition-all hover:bg-secondary/70 active:scale-[0.99] group"
                        >
                          <div className="relative aspect-[2/3] w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
                            {image && <Image src={image} alt={title} fill sizes="40px" className="object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{year}</span>
                              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                <Star size={11} className="fill-yellow-400" />
                                {rating}
                              </span>
                              <span className="font-bold text-[10px] uppercase tracking-wider text-primary">
                                {item.format || 'ANIME'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Movies Results */}
              {(activeTab === 'all' || activeTab === 'movie') && movies.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Film size={14} className="text-accent" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Movies ({movies.length})</h4>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {movies.slice(0, 5).map((item) => {
                      const image = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null
                      const year = item.release_date ? item.release_date.slice(0, 4) : '2026'

                      return (
                        <Link
                          key={item.id}
                          href={'/title/movie/' + item.id}
                          onClick={() => handleItemClick(item.title)}
                          className="flex items-center gap-3.5 rounded-2xl p-2 transition-all hover:bg-secondary/70 active:scale-[0.99] group"
                        >
                          <div className="relative aspect-[2/3] w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
                            {image && <Image src={image} alt={item.title} fill sizes="40px" className="object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{year}</span>
                              {item.vote_average > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                  <Star size={11} className="fill-yellow-400" />
                                  {item.vote_average.toFixed(1)}
                                </span>
                              )}
                              <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                                MOVIE
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Series Results */}
              {(activeTab === 'all' || activeTab === 'tv') && shows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Tv size={14} className="text-accent" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">TV Series ({shows.length})</h4>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {shows.slice(0, 5).map((item) => {
                      const image = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null
                      const year = item.first_air_date ? item.first_air_date.slice(0, 4) : '2026'

                      return (
                        <Link
                          key={item.id}
                          href={'/title/tv/' + item.id}
                          onClick={() => handleItemClick(item.name)}
                          className="flex items-center gap-3.5 rounded-2xl p-2 transition-all hover:bg-secondary/70 active:scale-[0.99] group"
                        >
                          <div className="relative aspect-[2/3] w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
                            {image && <Image src={image} alt={item.name} fill sizes="40px" className="object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{year}</span>
                              {item.vote_average > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                  <Star size={11} className="fill-yellow-400" />
                                  {item.vote_average.toFixed(1)}
                                </span>
                              )}
                              <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                                TV
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {query.trim() && totalResults > 0 && (
          <div className="border-t border-border/70 bg-secondary/30 p-3.5 px-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing top live matches
            </span>
            <button
              type="button"
              onClick={() => handleFullSearch()}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
            >
              <span>{t('viewAll')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
