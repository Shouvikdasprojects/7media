'use client'

import useSWR from 'swr'
import { AniListMedia, AniListPageResponse } from './types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch from AniList API')
  }
  return res.json()
}

export function useTrendingAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/trending?page=${page}&perPage=${perPage}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function usePopularAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/popular?page=${page}&perPage=${perPage}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useTopRatedAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/top-rated?page=${page}&perPage=${perPage}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useCurrentlyAiringAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/airing?page=${page}&perPage=${perPage}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useSeasonalAnime(season?: string, year?: number, page = 1, perPage = 20) {
  const s = season || 'WINTER'
  const y = year || new Date().getFullYear()
  return useSWR<AniListPageResponse>(
    `/api/anilist/seasonal?season=${s}&year=${y}&page=${page}&perPage=${perPage}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useAnimeByGenre(params: {
  genre?: string
  page?: number
  perPage?: number
  sort?: string
  format?: string
  status?: string
}) {
  const queryParams = new URLSearchParams()
  if (params.genre) queryParams.set('genre', params.genre)
  if (params.page) queryParams.set('page', String(params.page))
  if (params.perPage) queryParams.set('perPage', String(params.perPage))
  if (params.sort) queryParams.set('sort', params.sort)
  if (params.format) queryParams.set('format', params.format)
  if (params.status) queryParams.set('status', params.status)

  return useSWR<AniListPageResponse>(
    `/api/anilist/genre?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useAnimeDetails(id: number | null) {
  return useSWR<AniListMedia>(
    id ? `/api/anilist/details/${id}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  )
}

export function useSearchAnime(query: string, page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    query ? `/api/anilist/search?q=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}
