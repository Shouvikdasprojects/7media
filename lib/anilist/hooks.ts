'use client'

import useSWR from 'swr'
import { AniListMedia, AniListPageResponse } from './types'

const listFetcher = async (url: string): Promise<AniListPageResponse> => {
  try {
    let res = await fetch(url)
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1000))
      res = await fetch(url)
    }
    if (!res.ok) {
      return { pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 }, media: [] }
    }
    const json = await res.json()
    if (json.error) {
      return { pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 }, media: [] }
    }
    return json
  } catch {
    return { pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 }, media: [] }
  }
}

const detailFetcher = async (url: string): Promise<AniListMedia | null> => {
  try {
    let res = await fetch(url)
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1000))
      res = await fetch(url)
    }
    if (!res.ok) return null
    const json = await res.json()
    if (json.error || !json.id) return null
    return json as AniListMedia
  } catch {
    return null
  }
}

export function useTrendingAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/trending?page=${page}&perPage=${perPage}`,
    listFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function usePopularAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/popular?page=${page}&perPage=${perPage}`,
    listFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useTopRatedAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/top-rated?page=${page}&perPage=${perPage}`,
    listFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useCurrentlyAiringAnime(page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    `/api/anilist/airing?page=${page}&perPage=${perPage}`,
    listFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useSeasonalAnime(season?: string, year?: number, page = 1, perPage = 20) {
  const queryParams = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  })
  if (season) queryParams.set('season', season)
  if (year) queryParams.set('year', String(year))

  return useSWR<AniListPageResponse>(
    `/api/anilist/seasonal?${queryParams.toString()}`,
    listFetcher,
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
    listFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}

export function useAnimeDetails(id: number | null) {
  return useSWR<AniListMedia | null>(
    id ? `/api/anilist/details/${id}` : null,
    detailFetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  )
}

export function useSearchAnime(query: string, page = 1, perPage = 20) {
  return useSWR<AniListPageResponse>(
    query ? `/api/anilist/search?q=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}` : null,
    listFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
}
