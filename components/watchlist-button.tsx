'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Plus,
  Folder,
  Trash2,
  X,
  Film,
  Tv,
  Sparkles,
  Flame,
  Star,
  Clapperboard,
  Heart,
  FolderPlus
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '@/app/actions/watchlist'
import {
  getUserCatalogs,
  saveUserCatalog,
  removeFromAllCatalogs,
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

interface WatchlistButtonProps {
  item: {
    id: number
    type: 'movie' | 'tv'
    title: string
    posterPath?: string | null
    voteAverage?: number
  }
  compact?: boolean
}

const ICON_MAP: Record<string, any> = {
  Folder,
  Film,
  Tv,
  Sparkles,
  Flame,
  Star,
  Clapperboard,
  Heart,
}

export function WatchlistButton({ item, compact = false }: WatchlistButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [saved, setSaved] = useState(false)
  const [catalogs, setCatalogs] = useState<CatalogData[]>(() => mergeWithDefaultCatalogs())
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState<CatalogData['color']>('purple')
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  // Load catalogs and check watchlist status
  useEffect(() => {
    let active = true

    const loadData = async () => {
      if (session?.user) {
        try {
          const inList = await isInWatchlist(item.id, item.type)
          if (active) setSaved(inList)

          const res = await getUserCatalogs()
          if (active && res && Array.isArray(res.catalogs)) {
            const merged = mergeWithDefaultCatalogs(res.catalogs)
            setCatalogs(merged)
            try {
              localStorage.setItem('7media_catalogs', JSON.stringify(merged))
            } catch {}
          }
        } catch {}
      } else {
        // Guest mode fallback
        try {
          const localSavedCats = localStorage.getItem('7media_catalogs')
          const parsed = localSavedCats ? JSON.parse(localSavedCats) : []
          const merged = mergeWithDefaultCatalogs(parsed)
          if (active) setCatalogs(merged)

          const localWatchlist = localStorage.getItem('7media_watchlist')
          if (localWatchlist) {
            const list = JSON.parse(localWatchlist)
            if (Array.isArray(list)) {
              const exists = list.some((i: any) => i.tmdbId === item.id || i.id === item.id)
              if (active) setSaved(exists)
            }
          }
        } catch {}
      }
    }

    loadData()

    // Listen for global catalog and watchlist updates
    const handleCatalogsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCatalogs(mergeWithDefaultCatalogs(e.detail))
      } else {
        loadData()
      }
    }

    const handleWatchlistChanged = () => {
      loadData()
    }

    window.addEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged)
    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged)

    return () => {
      active = false
      window.removeEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged)
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged)
    }
  }, [session?.user, item.id, item.type])

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false)
        setIsCreatingNew(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Quick toggle main watchlist
  const handleQuickToggle = () => {
    startTransition(async () => {
      if (saved) {
        // Remove from watchlist
        if (session?.user) {
          await removeFromWatchlist(item.id, item.type)
        } else {
          try {
            const local = localStorage.getItem('7media_watchlist')
            if (local) {
              const list = JSON.parse(local).filter((i: any) => (i.tmdbId || i.id) !== item.id)
              localStorage.setItem('7media_watchlist', JSON.stringify(list))
            }
          } catch {}
        }
        setSaved(false)
        dispatchWatchlistUpdated()
      } else {
        // Add to main watchlist
        const payload = {
          tmdbId: item.id,
          mediaType: item.type,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
        }

        if (session?.user) {
          await addToWatchlist(payload)
        } else {
          try {
            const local = localStorage.getItem('7media_watchlist')
            const list = local ? JSON.parse(local) : []
            if (!list.some((i: any) => (i.tmdbId || i.id) === item.id)) {
              list.unshift(payload)
              localStorage.setItem('7media_watchlist', JSON.stringify(list))
            }
          } catch {}
        }
        setSaved(true)

        // Also auto-add to type-specific default folder
        const typeFolderId = item.type === 'movie' ? 'movies' : 'series'
        const nextCats = catalogs.map((c) => {
          if (c.id === 'watchlist' || c.id === typeFolderId) {
            const itemIds = c.itemIds || []
            if (!itemIds.includes(item.id)) {
              return { ...c, itemIds: [...itemIds, item.id] }
            }
          }
          return c
        })
        setCatalogs(nextCats)
        dispatchCatalogsUpdated(nextCats)
        dispatchWatchlistUpdated()
      }
    })
  }

  // Toggle item in specific folder (Add or Remove)
  const handleToggleFolder = async (cat: CatalogData, e: React.MouseEvent) => {
    e.stopPropagation()
    const inThisFolder = cat.id === 'watchlist' ? saved : cat.itemIds?.includes(item.id)

    if (cat.id === 'watchlist') {
      handleQuickToggle()
      return
    }

    const currentIds = Array.isArray(cat.itemIds) ? cat.itemIds : []
    const updatedIds = inThisFolder
      ? currentIds.filter((id) => id !== item.id)
      : [...currentIds, item.id]

    const updatedCat: CatalogData = {
      ...cat,
      itemIds: updatedIds,
    }

    const nextList = catalogs.map((c) => (c.id === cat.id ? updatedCat : c))
    setCatalogs(nextList)
    dispatchCatalogsUpdated(nextList)

    if (session?.user) {
      await saveUserCatalog(updatedCat)
      if (!saved && !inThisFolder) {
        await addToWatchlist({
          tmdbId: item.id,
          mediaType: item.type,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
        })
        setSaved(true)
        dispatchWatchlistUpdated()
      }
    } else {
      if (!saved && !inThisFolder) {
        try {
          const local = localStorage.getItem('7media_watchlist')
          const list = local ? JSON.parse(local) : []
          if (!list.some((i: any) => (i.tmdbId || i.id) === item.id)) {
            list.unshift({
              tmdbId: item.id,
              mediaType: item.type,
              title: item.title,
              posterPath: item.posterPath,
              rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
            })
            localStorage.setItem('7media_watchlist', JSON.stringify(list))
          }
        } catch {}
        setSaved(true)
        dispatchWatchlistUpdated()
      }
    }
  }

  // Remove completely from all folders and main watchlist
  const handleRemoveFromAll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      if (session?.user) {
        await removeFromAllCatalogs(item.id, item.type)
      } else {
        try {
          const local = localStorage.getItem('7media_watchlist')
          if (local) {
            const list = JSON.parse(local).filter((i: any) => (i.tmdbId || i.id) !== item.id)
            localStorage.setItem('7media_watchlist', JSON.stringify(list))
          }
        } catch {}
      }

      setSaved(false)
      const nextList = catalogs.map((c) => ({
        ...c,
        itemIds: (c.itemIds || []).filter((id) => id !== item.id),
      }))
      setCatalogs(nextList)
      dispatchCatalogsUpdated(nextList)
      dispatchWatchlistUpdated()
      setShowFolderMenu(false)
    })
  }

  // Create new folder inline
  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    const newCat: CatalogData = {
      id: `cat_${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      thumbnail: 'Folder',
      itemIds: [item.id],
      custom: true,
    }

    const nextList = [...catalogs, newCat]
    setCatalogs(nextList)
    setNewFolderName('')
    setIsCreatingNew(false)
    dispatchCatalogsUpdated(nextList)

    if (session?.user) {
      await saveUserCatalog(newCat)
      if (!saved) {
        await addToWatchlist({
          tmdbId: item.id,
          mediaType: item.type,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
        })
        setSaved(true)
        dispatchWatchlistUpdated()
      }
    } else {
      if (!saved) {
        try {
          const local = localStorage.getItem('7media_watchlist')
          const list = local ? JSON.parse(local) : []
          if (!list.some((i: any) => (i.tmdbId || i.id) === item.id)) {
            list.unshift({
              tmdbId: item.id,
              mediaType: item.type,
              title: item.title,
              posterPath: item.posterPath,
              rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
            })
            localStorage.setItem('7media_watchlist', JSON.stringify(list))
          }
        } catch {}
        setSaved(true)
        dispatchWatchlistUpdated()
      }
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark
  const isSavedInAny = saved || (Array.isArray(catalogs) && catalogs.some((c) => c.itemIds?.includes(item.id)))

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleQuickToggle}
        disabled={isPending}
        className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all disabled:opacity-50 touch-manipulation active:scale-90 select-none ${
          isSavedInAny
            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            : 'bg-black/60 text-white hover:bg-emerald-500 hover:text-black'
        }`}
        aria-label={saved ? `Remove ${item.title} from watchlist` : `Add ${item.title} to watchlist`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      {/* Main Quick Action Button */}
      <button
        type="button"
        onClick={handleQuickToggle}
        disabled={isPending}
        className={`flex items-center gap-2.5 rounded-l-2xl border px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 touch-manipulation active:scale-95 select-none cursor-pointer ${
          isSavedInAny
            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            : 'border-white/15 bg-zinc-900/90 text-white hover:border-emerald-500/50 hover:bg-zinc-800'
        }`}
      >
        <Icon className={`h-4 w-4 ${isSavedInAny ? 'text-emerald-400' : ''}`} aria-hidden="true" />
        <span>{isSavedInAny ? 'In Watchlist' : 'Add to List'}</span>
      </button>

      {/* Folder Picker Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setShowFolderMenu((prev) => !prev)}
        className={`flex items-center justify-center border-y border-r rounded-r-2xl px-3.5 py-3 text-xs transition-all cursor-pointer ${
          isSavedInAny
            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
            : 'border-white/15 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
        title="Open folder list"
      >
        <ChevronDown size={15} className={showFolderMenu ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
      </button>

      {/* CLEAN, FULLY EXPANDED FOLDER LIST DROPDOWN (POR POR LIKHA THAKBE) */}
      {showFolderMenu && (
        <div
          className="absolute left-0 top-full z-[9999] mt-2.5 w-80 sm:w-96 rounded-3xl border border-white/20 bg-zinc-950/98 p-4 shadow-2xl shadow-black/95 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-1 pb-3 mb-2.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-wider text-white">
                Choose Folder / List
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {catalogs.length} Folders
            </span>
          </div>

          {/* ALL FOLDERS LISTED SEQUENTIALLY (POR POR - NO INNER SCROLL) */}
          <div className="space-y-1.5">
            {catalogs.map((cat) => {
              const inThisFolder = cat.id === 'watchlist' ? saved : cat.itemIds?.includes(item.id)
              const IconComp = ICON_MAP[cat.thumbnail || 'Folder'] || Folder
              const count = cat.id === 'watchlist' ? (saved ? 1 : 0) : (cat.itemIds?.length || 0)

              return (
                <div
                  key={cat.id}
                  onClick={(e) => handleToggleFolder(cat, e)}
                  className={`group flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold cursor-pointer transition-all border ${
                    inThisFolder
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-zinc-900/80 border-white/5 text-zinc-300 hover:bg-zinc-900 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {/* Left: Icon & Folder Name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`p-1.5 rounded-lg border shrink-0 ${
                        inThisFolder
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-white/5 group-hover:text-white'
                      }`}
                    >
                      <IconComp size={15} />
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate text-white group-hover:text-emerald-400 transition-colors">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {cat.id === 'watchlist' ? 'Default Collection' : `${count} titles`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Direct Action Button */}
                  <div className="shrink-0">
                    {inThisFolder ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFolder(cat, e)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500/25 hover:bg-rose-500/25 border border-emerald-500/50 hover:border-rose-500/50 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:text-rose-300 transition-all cursor-pointer"
                        title="Click to remove from this folder"
                      >
                        <Check size={12} className="group-hover:hidden" />
                        <X size={12} className="hidden group-hover:inline" />
                        <span className="group-hover:hidden">Added</span>
                        <span className="hidden group-hover:inline">Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFolder(cat, e)}
                        className="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-black border border-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-300 transition-all cursor-pointer"
                        title="Click to add to this folder"
                      >
                        <Plus size={12} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Controls: Create New Folder & Clean Actions */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            {!isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-zinc-850 transition active:scale-95 shadow-sm cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>Create New Folder</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewFolder} className="space-y-2 rounded-xl border border-emerald-500/40 bg-zinc-900/95 p-2.5 animate-in fade-in duration-150 shadow-xl">
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name (e.g. Anime Favorites)..."
                  className="w-full rounded-lg border border-emerald-500/50 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    {(['emerald', 'purple', 'rose', 'amber', 'cyan', 'pink'] as const).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewFolderColor(col)}
                        className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                          col === 'purple' ? 'bg-purple-500' :
                          col === 'emerald' ? 'bg-emerald-500' :
                          col === 'rose' ? 'bg-rose-500' :
                          col === 'amber' ? 'bg-amber-500' :
                          col === 'cyan' ? 'bg-cyan-500' : 'bg-pink-500'
                        } ${newFolderColor === col ? 'ring-2 ring-white scale-125' : 'opacity-60'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-sm cursor-pointer"
                    >
                      Save &amp; Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Remove from All */}
            {isSavedInAny && (
              <button
                type="button"
                onClick={handleRemoveFromAll}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 text-[11px] font-bold text-rose-400 transition active:scale-95 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Remove from Watchlist &amp; All Folders</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
