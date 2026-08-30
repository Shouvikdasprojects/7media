'use client'

import useSWR from 'swr'
import type {
  TMDBMovie,
  TMDBShow,
  TMDBMovieDetail,
  TMDBShowDetail,
  TMDBPaginatedResponse,
} from './types'

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
  errorRetryCount: 2,
}

const fetcher = async (url: string) => {
  try {
    let res = await fetch(url)
    if (res.status === 429) {
      // Automatic backoff retry on burst browsing
      await new Promise((r) => setTimeout(r, 600))
      res = await fetch(url)
    }
    if (!res.ok) {
      return { results: [], page: 1, total_pages: 1, total_results: 0 }
    }
    return await res.json()
  } catch {
    return { results: [], page: 1, total_pages: 1, total_results: 0 }
  }
}

export function useTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    `/api/tmdb/trending/movies?timeWindow=${timeWindow}&page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useTrendingShows(timeWindow: 'day' | 'week' = 'week', page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBShow>>(
    `/api/tmdb/trending/shows?timeWindow=${timeWindow}&page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function usePopularMovies(page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    `/api/tmdb/popular/movies?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function usePopularShows(page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBShow>>(
    `/api/tmdb/popular/shows?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useTopRatedMovies(page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    `/api/tmdb/top-rated/movies?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useTopRatedShows(page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBShow>>(
    `/api/tmdb/top-rated/shows?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useMovieDetails(movieId: number | null) {
  const { data, error, isLoading } = useSWR<TMDBMovieDetail>(
    movieId ? `/api/tmdb/movie/${movieId}` : null,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useShowDetails(showId: number | null) {
  const { data, error, isLoading } = useSWR<TMDBShowDetail>(
    showId ? `/api/tmdb/show/${showId}` : null,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useSearchMulti(query: string, page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie | TMDBShow>>(
    query ? `/api/tmdb/search?query=${encodeURIComponent(query)}&page=${page}` : null,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useNowPlayingMovies(page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    `/api/tmdb/now-playing/movies?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useOnTheAirShows(page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBShow>>(
    `/api/tmdb/on-the-air/shows?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export interface DiscoverFilters {
  page?: number
  genre?: string
  language?: string
  provider?: string
  country?: string
  sortBy?: string
  minVotes?: number
  minRating?: string
  year?: string
}

function buildDiscoverQuery(filters: DiscoverFilters) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page || 1))
  if (filters.genre) params.set('with_genres', filters.genre)
  if (filters.language) params.set('with_original_language', filters.language)
  if (filters.provider) {
    params.set('with_watch_providers', filters.provider)
    params.set('watch_region', filters.country || 'US')
  }
  if (filters.country && !filters.provider) params.set('watch_region', filters.country)
  if (filters.sortBy) params.set('sort_by', filters.sortBy)
  if (filters.minVotes) params.set('vote_count_gte', String(filters.minVotes))
  if (filters.minRating) {
    params.set('vote_average.gte', filters.minRating)
    if (!filters.minVotes) params.set('vote_count_gte', '50')
  }
  if (filters.year) {
    params.set('primary_release_year', filters.year)
    params.set('first_air_date_year', filters.year)
  }
  return params.toString()
}

export function useDiscoverMovies(filters: DiscoverFilters) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    `/api/tmdb/discover/movies?${buildDiscoverQuery(filters)}`,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  )
  return { data, error, isLoading }
}

export function useDiscoverShows(filters: DiscoverFilters) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBShow>>(
    `/api/tmdb/discover/shows?${buildDiscoverQuery(filters)}`,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  )
  return { data, error, isLoading }
}

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}

export function useWatchProviders(type: 'movie' | 'tv' = 'movie', region = 'US') {
  const { data, error, isLoading } = useSWR<{ results: WatchProvider[] }>(
    `/api/tmdb/providers?type=${type}&region=${region}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useGenres(type: 'movie' | 'tv' = 'movie') {
  const { data, error, isLoading } = useSWR<{ genres: Array<{ id: number; name: string }> }>(
    `/api/tmdb/genres?type=${type}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export interface SeasonDetail {
  id: number
  name: string
  season_number: number
  episodes: Array<{
    id: number
    episode_number: number
    name: string
    overview: string
    still_path: string | null
    air_date: string
    runtime: number | null
    vote_average: number
  }>
}

export function useSeasonDetails(showId: number | null, seasonNumber: number) {
  const { data, error, isLoading } = useSWR<SeasonDetail>(
    showId ? `/api/tmdb/season/${showId}/${seasonNumber}` : null,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useMoviesByGenre(genreId: number, page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBMovie>>(
    `/api/tmdb/movies/genre/${genreId}?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}

export function useShowsByGenre(genreId: number, page = 1) {
  const { data, error, isLoading } = useSWR<TMDBPaginatedResponse<TMDBShow>>(
    `/api/tmdb/shows/genre/${genreId}?page=${page}`,
    fetcher,
    swrOptions
  )
  return { data, error, isLoading }
}
