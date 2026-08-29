'use client'

import { use, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BrowseGrid } from '@/components/browse-grid'
import { useGenres, useMoviesByGenre, useShowsByGenre } from '@/lib/tmdb/hooks'
import { Film } from 'lucide-react'

export default function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const genreId = Number(id)
  const [type, setType] = useState<'movie' | 'tv'>('movie')
  const [page, setPage] = useState(1)
  const { data: genres } = useGenres(type)
  const movies = useMoviesByGenre(type === 'movie' ? genreId : 0, page)
  const shows = useShowsByGenre(type === 'tv' ? genreId : 0, page)
  const result = type === 'movie' ? movies : shows
  const name = genres?.genres?.find((genre) => genre.id === genreId)?.name || 'Genre'
  return <div className="flex min-h-screen flex-col bg-background"><Navbar /><main className="flex-1 px-4 pb-16 pt-24 md:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Film className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Browse collection</p><h1 className="text-2xl font-bold text-foreground md:text-3xl">{name}</h1></div></div><div className="flex rounded-xl bg-secondary p-1" role="tablist" aria-label="Media type"><button onClick={() => { setType('movie'); setPage(1) }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === 'movie' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} role="tab" aria-selected={type === 'movie'}>Movies</button><button onClick={() => { setType('tv'); setPage(1) }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === 'tv' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} role="tab" aria-selected={type === 'tv'}>Series</button></div></header><BrowseGrid items={result.data?.results || []} type={type} isLoading={result.isLoading} page={page} totalPages={result.data?.total_pages || 0} onPageChange={setPage} /></div></main><Footer /></div>
}
