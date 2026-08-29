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
  Heart
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
  DEFAULT_USER_CATALOGS
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
  const [catalogs, setCatalogs] = useState<CatalogData[]>(DEFAULT_USER_CATALOGS)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState<CatalogData['color']>('purple')
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    if (session?.user) {
      isInWatchlist(item.id, item.type).then((result) => {
        if (active) setSaved(result)
      })
      getUserCatalogs().then((res) => {
        if (active && res && Array.isArray(res.catalogs) && res.catalogs.length > 0) {
          setCatalogs(res.catalogs)
        }
      })
    } else {
      try {
        const localSaved = localStorage.getItem('7media_catalogs')
        if (localSaved) {
          const parsed = JSON.parse(localSaved)
          if (Array.isArray(parsed)) setCatalogs(parsed)
        }
      } catch {}
    }
    return () => {
      active = false
    }
  }, [session?.user, item.id, item.type])

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

  const handleQuickToggle = () => {
    if (!session?.user) {
      router.push('/sign-in')
      return
    }

    startTransition(async () => {
      if (saved) {
        await removeFromAllCatalogs(item.id, item.type)
        setSaved(false)
        // update local catalogs state
        setCatalogs((prev) =>
          prev.map((c) => ({
            ...c,
            itemIds: (c.itemIds || []).filter((id) => id !== item.id),
          }))
        )
      } else {
        const res = await addToWatchlist({
          tmdbId: item.id,
          mediaType: item.type,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
        })
        if (res.success) {
          setSaved(true)
          // Auto add to main watchlist and type-specific folder (movies/series/anime)
          const typeFolderId = item.type === 'movie' ? 'movies' : 'series'
          setCatalogs((prev) =>
            prev.map((c) => {
              if (c.id === 'watchlist' || c.id === typeFolderId) {
                const nextIds = c.itemIds?.includes(item.id) ? c.itemIds : [...(c.itemIds || []), item.id]
                return { ...c, itemIds: nextIds }
              }
              return c
            })
          )
        }
      }
    })
  }

  // Toggle item in a specific folder (Add or Remove)
  const handleToggleFolder = async (cat: CatalogData, e: React.MouseEvent) => {
    e.stopPropagation()
    const inThisFolder = cat.id === 'watchlist' ? saved : cat.itemIds?.includes(item.id)

    if (cat.id === 'watchlist') {
      handleQuickToggle()
      return
    }

    const updatedIds = inThisFolder
      ? (cat.itemIds || []).filter((id) => id !== item.id)
      : [...(cat.itemIds || []), item.id]

    const updatedCat: CatalogData = {
      ...cat,
      itemIds: updatedIds,
    }

    const nextList = catalogs.map((c) => (c.id === cat.id ? updatedCat : c))
    setCatalogs(nextList)

    if (session?.user) {
      await saveUserCatalog(updatedCat)
      // If added to any folder, also make sure it's in main watchlist
      if (!saved && !inThisFolder) {
        await addToWatchlist({
          tmdbId: item.id,
          mediaType: item.type,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
        })
        setSaved(true)
      }
    } else {
      try {
        localStorage.setItem('7media_catalogs', JSON.stringify(nextList))
      } catch {}
    }
  }

  // Remove completely from all folders
  const handleRemoveFromAll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      if (session?.user) {
        await removeFromAllCatalogs(item.id, item.type)
      }
      setSaved(false)
      const nextList = catalogs.map((c) => ({
        ...c,
        itemIds: (c.itemIds || []).filter((id) => id !== item.id),
      }))
      setCatalogs(nextList)
      try {
        localStorage.setItem('7media_catalogs', JSON.stringify(nextList))
      } catch {}
      setShowFolderMenu(false)
    })
  }

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
      }
    } else {
      try {
        localStorage.setItem('7media_catalogs', JSON.stringify(nextList))
      } catch {}
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
          saved
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
        className={`flex items-center gap-2.5 rounded-l-2xl border px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 touch-manipulation active:scale-95 select-none ${
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
        className={`flex items-center justify-center border-y border-r rounded-r-2xl px-3.5 py-3 text-xs transition-all ${
          isSavedInAny
            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
            : 'border-white/15 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
        title="Manage folders (Add, Remove, or Create New)"
      >
        <ChevronDown size={15} className={showFolderMenu ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {/* Folder Management Dropdown Modal */}
      {showFolderMenu && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-80 rounded-3xl border border-white/15 bg-zinc-950/98 p-3.5 shadow-2xl shadow-black/90 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-2 py-1 mb-2.5 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Save &amp; Organize Folders
              </p>
              <p className="text-[10px] text-zinc-400">Add or remove from specific catalogs</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">
              {catalogs.length} Folders
            </span>
          </div>

          {/* All Folders List with Independent Add / Remove Controls */}
          <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-1.5 pr-1">
            {catalogs.map((cat) => {
              const inThisFolder = cat.id === 'watchlist' ? saved : cat.itemIds?.includes(item.id)
              const IconComp = ICON_MAP[cat.thumbnail || 'Folder'] || Folder

              return (
                <div
                  key={cat.id}
                  onClick={(e) => handleToggleFolder(cat, e)}
                  className={`group flex items-center justify-between rounded-2xl p-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    inThisFolder
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-zinc-900/60 border border-white/5 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className={`p-1.5 rounded-xl ${inThisFolder ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <IconComp size={14} />
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate text-white">{cat.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {cat.id === 'watchlist' ? (saved ? 'Main Watchlist' : 'Default') : `${cat.itemIds?.length || 0} saved`}
                      </p>
                    </div>
                  </div>

                  {/* Action Pill: Saved / Remove vs Add */}
                  <div className="shrink-0">
                    {inThisFolder ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFolder(cat, e)}
                        className="flex items-center gap-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 px-2.5 py-1 text-[10px] font-bold text-rose-300 transition-colors"
                        title="Remove from this folder"
                      >
                        <X size={12} />
                        <span>Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFolder(cat, e)}
                        className="flex items-center gap-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400 transition-colors"
                        title="Add to this folder"
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

          {/* Inline "+ Create New Folder" Form */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            {!isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-zinc-800 transition active:scale-95 shadow-sm"
              >
                <Plus size={14} />
                <span>Create New Folder</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewFolder} className="space-y-2 rounded-2xl border border-emerald-500/40 bg-zinc-900/90 p-2.5 animate-in fade-in duration-150">
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name (e.g. Weekend Anime)..."
                  className="w-full rounded-xl border border-emerald-500/50 bg-zinc-950 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    {(['purple', 'emerald', 'rose', 'amber', 'cyan', 'pink'] as const).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewFolderColor(col)}
                        className={`w-4 h-4 rounded-full transition-transform ${
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
                      className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black shadow-sm"
                    >
                      Create &amp; Save
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* 1-Click Remove From All Watchlists / Folders Button */}
            {isSavedInAny && (
              <button
                type="button"
                onClick={handleRemoveFromAll}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-2 text-xs font-bold text-rose-400 transition active:scale-95"
              >
                <Trash2 size={13} />
                <span>Remove from Watchlist &amp; All Folders</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
