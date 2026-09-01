'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import {
  Folder,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
  Clapperboard,
  Search,
  Star,
  X,
  Play,
  Film,
  Tv,
  Sparkles,
  Flame,
  Heart,
  ChevronDown,
  Check
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SearchModal } from '@/components/search-modal'
import { useSession } from '@/lib/auth-client'
import { getWatchlist, removeFromWatchlist, syncGuestWatchlist } from '@/app/actions/watchlist'
import {
  getUserCatalogs,
  saveUserCatalog,
  deleteUserCatalog,
  getUserReactions,
  toggleUserReaction,
} from '@/app/actions/catalogs'
import {
  type CatalogData,
  DEFAULT_USER_CATALOGS,
  mergeWithDefaultCatalogs,
  CATALOGS_CHANGED_EVENT,
  WATCHLIST_CHANGED_EVENT,
  dispatchCatalogsUpdated,
  dispatchWatchlistUpdated,
} from '@/lib/catalogs-shared'
import { getGuestStorageExpiry, checkAndCleanGuestStorage } from '@/lib/guest-storage'

export type CatalogColor = 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'pink'
export type CatalogThumbnail = 'Folder' | 'Clapperboard' | 'Film' | 'Tv' | 'Sparkles' | 'Flame' | 'Star' | 'Heart'

const PRESET_LIST: Array<{ name: string; color: CatalogColor; thumbnail: CatalogThumbnail }> = [
  { name: 'Favorite Movies', color: 'emerald', thumbnail: 'Film' },
  { name: 'TV Series Binge', color: 'cyan', thumbnail: 'Tv' },
  { name: 'Anime Vault', color: 'purple', thumbnail: 'Sparkles' },
  { name: 'Must Watch & Top Rated', color: 'amber', thumbnail: 'Star' },
  { name: 'Late Night Thrills', color: 'rose', thumbnail: 'Flame' },
  { name: "Critics' Masterpieces", color: 'pink', thumbnail: 'Clapperboard' },
]

const THUMBNAIL_ICONS: Record<CatalogThumbnail, any> = {
  Folder,
  Clapperboard,
  Film,
  Tv,
  Sparkles,
  Flame,
  Star,
  Heart,
}

export default function MyListPage() {
  const { data: session } = useSession()

  const [activeCatalog, setActiveCatalog] = useState<string>('watchlist')
  const [catalogs, setCatalogs] = useState<CatalogData[]>(() => mergeWithDefaultCatalogs())
  const [localWatchlistItems, setLocalWatchlistItems] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingCatalog, setEditingCatalog] = useState<CatalogData | null>(null)

  // Edit Catalog Form State
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<CatalogColor>('amber')
  const [editThumbnail, setEditThumbnail] = useState<CatalogThumbnail>('Folder')
  const [thumbnailDropdownOpen, setThumbnailDropdownOpen] = useState(false)

  const [searchModalOpen, setSearchModalOpen] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [sortFilter, setSortFilter] = useState<'latest' | 'top_imdb' | 'not_watched'>('latest')

  // Watched / Liked / Disliked state
  const [watchedIds, setWatchedIds] = useState<number[]>([])
  const [likedIds, setLikedIds] = useState<number[]>([])
  const [dislikedIds, setDislikedIds] = useState<number[]>([])
  const [guestExpiry, setGuestExpiry] = useState<{ daysRemaining: number; isExpiringSoon: boolean } | null>(null)

  // 1. SWR Data from Database
  const { data: watchlistData, mutate: mutateWatchlist } = useSWR(
    session?.user ? 'watchlist' : null,
    () => getWatchlist()
  )

  const { data: dbCatalogsData, mutate: mutateCatalogs } = useSWR(
    session?.user ? 'user_catalogs' : null,
    () => getUserCatalogs()
  )

  const { data: dbReactionsData, mutate: mutateReactions } = useSWR(
    session?.user ? 'user_reactions' : null,
    () => getUserReactions()
  )

  // Reload local storage helper
  const reloadLocalStorage = useCallback(() => {
    try {
      checkAndCleanGuestStorage()
      setGuestExpiry(getGuestStorageExpiry())

      const savedCats = localStorage.getItem('7media_catalogs')
      if (savedCats) {
        setCatalogs(mergeWithDefaultCatalogs(JSON.parse(savedCats)))
      } else {
        setCatalogs(mergeWithDefaultCatalogs())
      }

      const savedWatchlist = localStorage.getItem('7media_watchlist')
      if (savedWatchlist) {
        setLocalWatchlistItems(JSON.parse(savedWatchlist))
      } else {
        setLocalWatchlistItems([])
      }

      const savedWatched = localStorage.getItem('7media_watched')
      if (savedWatched) setWatchedIds(JSON.parse(savedWatched))
      const savedLiked = localStorage.getItem('7media_liked')
      if (savedLiked) setLikedIds(JSON.parse(savedLiked))
      const savedDisliked = localStorage.getItem('7media_disliked')
      if (savedDisliked) setDislikedIds(JSON.parse(savedDisliked))
    } catch {}
  }, [])

  // Sync DB catalogs to local state when authenticated
  useEffect(() => {
    if (dbCatalogsData?.catalogs && dbCatalogsData.catalogs.length > 0) {
      const merged = mergeWithDefaultCatalogs(dbCatalogsData.catalogs)
      setCatalogs(merged)
      try {
        localStorage.setItem('7media_catalogs', JSON.stringify(merged))
      } catch {}
    } else {
      reloadLocalStorage()
    }
  }, [dbCatalogsData, reloadLocalStorage])

  // Auto-sync guest watchlist items to DB when authenticated
  useEffect(() => {
    if (session?.user) {
      try {
        const local = localStorage.getItem('7media_watchlist')
        if (local) {
          const list = JSON.parse(local)
          if (Array.isArray(list) && list.length > 0) {
            syncGuestWatchlist(list).then((res) => {
              if (res?.success) {
                mutateWatchlist()
              }
            })
          }
        }
      } catch {}
    }
  }, [session?.user, mutateWatchlist])

  // Sync DB reactions
  useEffect(() => {
    if (dbReactionsData?.authenticated) {
      setWatchedIds(dbReactionsData.watchedIds)
      setLikedIds(dbReactionsData.likedIds)
      setDislikedIds(dbReactionsData.dislikedIds)
    } else {
      reloadLocalStorage()
    }
  }, [dbReactionsData, reloadLocalStorage])

  // Listen to real-time events across the app
  useEffect(() => {
    const handleCatalogsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCatalogs(mergeWithDefaultCatalogs(e.detail))
      } else {
        reloadLocalStorage()
      }
      if (session?.user) mutateCatalogs()
    }

    const handleWatchlistChanged = () => {
      reloadLocalStorage()
      if (session?.user) mutateWatchlist()
    }

    window.addEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged)
    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged)

    return () => {
      window.removeEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged)
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged)
    }
  }, [session?.user, mutateCatalogs, mutateWatchlist, reloadLocalStorage])

  // Compute Active Items
  const rawItems = session?.user ? (watchlistData?.items ?? []) : localWatchlistItems

  // Filter items according to active catalog
  const currentCatalogObj = catalogs.find((c) => c.id === activeCatalog) || catalogs[0]

  let catalogItems = rawItems
  if (currentCatalogObj.id !== 'watchlist') {
    catalogItems = rawItems.filter((item) => {
      const id = item.tmdbId || item.id
      return currentCatalogObj.itemIds?.includes(id)
    })
  }

  // Apply secondary filters (type + sort)
  if (typeFilter !== 'all') {
    catalogItems = catalogItems.filter((i) => i.mediaType === typeFilter)
  }

  if (sortFilter === 'not_watched') {
    catalogItems = catalogItems.filter((i) => !watchedIds.includes(i.tmdbId || i.id))
  } else if (sortFilter === 'top_imdb') {
    catalogItems = [...catalogItems].sort(
      (a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0')
    )
  }

  // Remove item handler
  const handleRemove = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
    if (activeCatalog === 'watchlist') {
      // Remove from main watchlist
      if (session?.user) {
        await removeFromWatchlist(tmdbId, mediaType)
        mutateWatchlist()
      } else {
        const nextList = localWatchlistItems.filter((i) => (i.tmdbId || i.id) !== tmdbId)
        setLocalWatchlistItems(nextList)
        try {
          localStorage.setItem('7media_watchlist', JSON.stringify(nextList))
        } catch {}
      }
      dispatchWatchlistUpdated()
    } else {
      // Remove from this specific catalog only
      const updatedIds = (currentCatalogObj.itemIds || []).filter((id) => id !== tmdbId)
      const updatedCat: CatalogData = { ...currentCatalogObj, itemIds: updatedIds }
      const nextList = catalogs.map((c) => (c.id === currentCatalogObj.id ? updatedCat : c))
      setCatalogs(nextList)
      dispatchCatalogsUpdated(nextList)

      if (session?.user) {
        await saveUserCatalog(updatedCat)
        mutateCatalogs()
      }
    }
  }

  const openEditModal = (cat: CatalogData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingCatalog(cat)
    setEditName(cat.name)
    setEditColor(cat.color)
    setEditThumbnail(cat.thumbnail || 'Folder')
    setThumbnailDropdownOpen(false)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCatalog || !editName.trim()) return

    const updatedCatalog: CatalogData = {
      ...editingCatalog,
      name: editName.trim(),
      color: editColor,
      thumbnail: editThumbnail,
    }

    const updatedList = catalogs.map((c) => (c.id === editingCatalog.id ? updatedCatalog : c))
    if (!catalogs.some((c) => c.id === editingCatalog.id)) {
      updatedList.push(updatedCatalog)
    }

    setCatalogs(updatedList)
    setEditingCatalog(null)
    dispatchCatalogsUpdated(updatedList)

    // Save to Database if logged in
    if (session?.user) {
      await saveUserCatalog(updatedCatalog)
      mutateCatalogs()
    }
  }

  const handleApplyPreset = (preset: (typeof PRESET_LIST)[number]) => {
    setEditName(preset.name)
    setEditColor(preset.color)
    setEditThumbnail(preset.thumbnail)
  }

  const handleDeleteCatalog = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (id === 'watchlist') return
    const updated = catalogs.filter((c) => c.id !== id)
    setCatalogs(updated)
    if (activeCatalog === id) {
      setActiveCatalog('watchlist')
    }
    dispatchCatalogsUpdated(updated)

    // Delete from Database if logged in
    if (session?.user) {
      await deleteUserCatalog(id)
      mutateCatalogs()
    }
  }

  const colorStyles: Record<
    CatalogColor,
    { border: string; bg: string; iconBg: string; text: string; glow: string; dot: string }
  > = {
    emerald: {
      border: 'border-emerald-500/30 group-hover:border-emerald-500/60',
      bg: 'from-emerald-950/40 via-zinc-900/90 to-zinc-950',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
      dot: 'bg-emerald-500',
    },
    rose: {
      border: 'border-rose-500/30 group-hover:border-rose-500/60',
      bg: 'from-rose-950/40 via-zinc-900/90 to-zinc-950',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
      dot: 'bg-rose-500',
    },
    amber: {
      border: 'border-amber-500/30 group-hover:border-amber-500/60',
      bg: 'from-amber-950/40 via-zinc-900/90 to-zinc-950',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-500',
    },
    cyan: {
      border: 'border-cyan-500/30 group-hover:border-cyan-500/60',
      bg: 'from-cyan-950/40 via-zinc-900/90 to-zinc-950',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.2)]',
      dot: 'bg-cyan-500',
    },
    purple: {
      border: 'border-purple-500/30 group-hover:border-purple-500/60',
      bg: 'from-purple-950/40 via-zinc-900/90 to-zinc-950',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.2)]',
      dot: 'bg-purple-500',
    },
    pink: {
      border: 'border-pink-500/30 group-hover:border-pink-500/60',
      bg: 'from-pink-950/40 via-zinc-900/90 to-zinc-950',
      iconBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      text: 'text-pink-400',
      glow: 'shadow-[0_0_25px_rgba(236,72,153,0.2)]',
      dot: 'bg-pink-500',
    },
  }

  const renderIcon = (thumbName?: CatalogThumbnail, size = 24) => {
    const IconComponent = THUMBNAIL_ICONS[thumbName || 'Folder'] || Folder
    return <IconComponent size={size} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground select-none">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-28 pb-20 max-w-[1880px] mx-auto w-full">
        {/* Page Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-foreground text-glow">
              My List
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1.5">
              Organize your saved titles into custom catalogs and folders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Search size={15} />
              <span>Search &amp; Add</span>
            </button>
          </div>
        </header>

        {/* Guest 7-Day Storage Notification Banner */}
        {!session?.user && guestExpiry && (
          <div className="mb-8 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Guest Mode · Temporary Local Storage
                </p>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Your watchlist is stored locally on this device and will auto-clean in{' '}
                  <strong className="text-white font-mono">{guestExpiry.daysRemaining} days</strong>. Sign in to save permanently in the cloud!
                </p>
              </div>
            </div>
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 active:scale-95"
            >
              Sign In to Save
            </Link>
          </div>
        )}

        {/* 1. COLLECTIONS METRICS */}
        <section className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3.5">
            Overview &amp; Reactions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
            {/* Watched */}
            <div className="group relative rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 via-zinc-900/90 to-zinc-950 p-5 shadow-lg transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <Eye size={16} />
                </span>
              </div>
              <p className="text-3xl font-black text-white font-display leading-none mb-2">
                {watchedIds.length}
              </p>
              <h3 className="text-sm font-bold text-white">Watched</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Completed titles</p>
            </div>

            {/* Liked */}
            <div className="group relative rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/40 via-zinc-900/90 to-zinc-950 p-5 shadow-lg transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  <ThumbsUp size={16} />
                </span>
              </div>
              <p className="text-3xl font-black text-white font-display leading-none mb-2">
                {likedIds.length}
              </p>
              <h3 className="text-sm font-bold text-white">Liked</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Loved &amp; Recommended</p>
            </div>

            {/* Total Saved */}
            <div className="group relative rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/40 via-zinc-900/90 to-zinc-950 p-5 shadow-lg transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  <Folder size={16} />
                </span>
              </div>
              <p className="text-3xl font-black text-white font-display leading-none mb-2">
                {rawItems.length}
              </p>
              <h3 className="text-sm font-bold text-white">Total Saved</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Across {catalogs.length} Folders</p>
            </div>
          </div>
        </section>

        {/* 2. FOLDERS / CATALOGS CARDS SECTION */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                Catalogs &amp; Folders
              </p>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-white/5">
                {catalogs.length} Folders
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-full border border-white/10 bg-zinc-800/90 px-4 py-1 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white active:scale-95 cursor-pointer"
            >
              {isEditing ? 'Done Managing' : 'Manage Folders'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3.5">
            {catalogs.map((cat) => {
              const isSelected = activeCatalog === cat.id
              const count =
                cat.id === 'watchlist'
                  ? rawItems.length
                  : rawItems.filter((i) => cat.itemIds?.includes(i.tmdbId || i.id)).length
              const style = colorStyles[cat.color] || colorStyles.emerald

              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveCatalog(cat.id)}
                  className={`group relative cursor-pointer rounded-2xl border p-4 flex flex-col justify-between min-h-[210px] transition-all duration-200 bg-gradient-to-b ${style.bg} ${
                    isSelected
                      ? `border-white shadow-[0_0_25px_rgba(255,255,255,0.25)] scale-[1.02] ring-2 ring-white/60`
                      : `${style.border} hover:scale-[1.01]`
                  }`}
                >
                  {/* Top Buttons: Edit & Delete */}
                  <div className="flex items-center justify-between h-6">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(cat, e)}
                      className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      title={`Edit ${cat.name}`}
                    >
                      <Pencil size={11} className="text-black" />
                    </button>

                    {cat.id !== 'watchlist' && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCatalog(cat.id, e)}
                        className={`w-6 h-6 rounded-full bg-black/50 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all cursor-pointer ${
                          isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Delete folder"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Center Thumbnail Icon */}
                  <div className="flex items-center justify-center my-3">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${style.iconBg} transition-transform group-hover:scale-110 shadow-sm`}
                    >
                      {renderIcon(cat.thumbnail as CatalogThumbnail, 20)}
                    </div>
                  </div>

                  {/* Bottom Folder Title & Count */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{count} titles saved</p>
                  </div>
                </div>
              )
            })}

            {/* Create New Folder Button */}
            <div
              onClick={() => {
                setEditingCatalog({
                  id: `catalog_${Date.now()}`,
                  name: '',
                  color: 'purple',
                  thumbnail: 'Folder',
                  itemIds: [],
                  custom: true,
                })
                setEditName('')
                setEditColor('purple')
                setEditThumbnail('Folder')
              }}
              className="group relative cursor-pointer rounded-2xl border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/40 p-4 flex flex-col justify-center min-h-[210px] transition-all duration-200 items-center text-center shadow-sm hover:scale-[1.01]"
            >
              <div className="w-12 h-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Plus size={20} />
              </div>
              <h3 className="text-xs font-bold text-white">New Folder</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Create custom</p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDIT / CREATE CATALOG MODAL                                               */}
        {/* ========================================================================= */}
        {editingCatalog && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setEditingCatalog(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white">
                    {editingCatalog.name ? 'Edit Folder' : 'Create New Folder'}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Choose a custom tint, icon, and name for this collection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCatalog(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Weekend Anime Picks..."
                    className="w-full rounded-2xl border border-emerald-500/50 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2.5">
                        {(['emerald', 'purple', 'rose', 'amber', 'cyan', 'pink'] as const).map(
                          (col) => {
                            const isChosen = editColor === col
                            const style = colorStyles[col]
                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setEditColor(col)}
                                className={`w-8 h-8 rounded-full ${style.dot} transition-all duration-200 cursor-pointer ${
                                  isChosen
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-lg'
                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                              />
                            )
                          }
                        )}
                      </div>
                    </div>

                    <div className="relative min-w-[150px]">
                      <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
                        Icon
                      </label>
                      <button
                        type="button"
                        onClick={() => setThumbnailDropdownOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:border-emerald-500/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {renderIcon(editThumbnail, 15)}
                          <span>{editThumbnail}</span>
                        </div>
                        <ChevronDown size={14} className="text-zinc-400" />
                      </button>

                      {thumbnailDropdownOpen && (
                        <div className="absolute right-0 z-30 mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900/95 p-1 shadow-2xl backdrop-blur-xl">
                          {(
                            [
                              'Folder',
                              'Film',
                              'Tv',
                              'Sparkles',
                              'Flame',
                              'Star',
                              'Clapperboard',
                              'Heart',
                            ] as const
                          ).map((tName) => (
                            <button
                              key={tName}
                              type="button"
                              onClick={() => {
                                setEditThumbnail(tName)
                                setThumbnailDropdownOpen(false)
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                editThumbnail === tName
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                              }`}
                            >
                              {renderIcon(tName, 14)}
                              <span>{tName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">
                    Fast Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LIST.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation active:scale-95 cursor-pointer ${
                          editName === preset.name
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                            : 'border-white/10 bg-zinc-900/90 text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingCatalog(null)}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-500 hover:bg-emerald-400 px-7 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
                  >
                    Save Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. FILTERS BAR */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 border border-white/10 rounded-2xl p-1.5 w-fit">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('movie')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                  typeFilter === 'movie'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('tv')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                  typeFilter === 'tv'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Series
              </button>

              <div className="h-4 w-px bg-white/15 mx-1" />

              <button
                type="button"
                onClick={() => setSortFilter('latest')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                  sortFilter === 'latest'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setSortFilter('top_imdb')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                  sortFilter === 'top_imdb'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Top Rated
              </button>
              <button
                type="button"
                onClick={() => setSortFilter('not_watched')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                  sortFilter === 'not_watched'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Unwatched
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-semibold px-1">
              Showing <strong className="text-emerald-400">{catalogItems.length}</strong> titles in{' '}
              <strong className="text-white">{currentCatalogObj.name}</strong>
            </p>
          </div>
        </section>

        {/* 4. ITEMS GRID OR EMPTY STATE */}
        {catalogItems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950/80 p-10 sm:p-14 md:p-20 text-center shadow-2xl max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-[0_0_35px_rgba(16,185,129,0.18)] text-emerald-400">
              {renderIcon(currentCatalogObj.thumbnail as CatalogThumbnail, 36)}
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 mb-2">
              Empty Folder
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display mb-2">
              {currentCatalogObj.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
              No titles added to this folder yet. Browse movies or search to add items here.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/movies"
                className="flex items-center gap-2 rounded-full border border-white/15 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-md uppercase tracking-wider"
              >
                <Clapperboard size={14} />
                <span>Explore Movies</span>
              </Link>
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-black transition-all active:scale-95 shadow-lg shadow-emerald-500/25 uppercase tracking-wider cursor-pointer"
              >
                <Search size={14} />
                <span>Search &amp; Add</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {catalogItems.map((item) => {
              const tmdbId = item.tmdbId || item.id
              const isItemWatched = watchedIds.includes(tmdbId)

              return (
                <div key={`${item.mediaType}-${tmdbId}`} className="group relative">
                  <Link
                    href={`/title/${item.mediaType}/${tmdbId}`}
                    className="block aspect-[2/3] overflow-hidden rounded-2xl bg-secondary relative ring-1 ring-border/70 group-hover:ring-emerald-500/50 transition-all duration-300 shadow-md"
                  >
                    {item.posterPath ? (
                      <Image
                        src={
                          item.posterPath.startsWith('http')
                            ? item.posterPath
                            : `https://image.tmdb.org/t/p/w342${item.posterPath}`
                        }
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

                    {/* Watched Badge */}
                    {isItemWatched && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-emerald-500/90 text-black px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <Check size={10} />
                        <span>Watched</span>
                      </div>
                    )}

                    {/* Play Center Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="w-11 h-11 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play size={18} fill="currentColor" />
                      </span>
                    </div>
                  </Link>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(tmdbId, item.mediaType as 'movie' | 'tv')}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-xl bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 shadow-md cursor-pointer"
                    title={
                      activeCatalog === 'watchlist'
                        ? 'Remove from watchlist'
                        : `Remove from ${currentCatalogObj.name}`
                    }
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="mt-2 px-0.5">
                    <p className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                      <span className="capitalize">{item.mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                      {item.rating && (
                        <span className="flex items-center gap-0.5 text-yellow-400 font-semibold">
                          <Star className="h-3 w-3 fill-yellow-400" />
                          {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <Footer />
    </div>
  )
}
