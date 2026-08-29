import {
  TMDBMovie,
  TMDBShow,
  TMDBMovieDetail,
  TMDBShowDetail,
  Genre,
  TMDBPaginatedResponse,
} from './types'

const BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY || 'fe69221eb4a5511fd9ea5889f9e24ae3'

// In-memory response cache on server (5 min TTL)
const responseCache = new Map<string, { data: any; expires: number }>()

// Known working worldwide AWS CloudFront Anycast IPs for api.themoviedb.org
const IP_POOL = [
  '13.224.245.63',
  '13.224.245.47',
  '13.224.245.92',
  '13.224.245.44',
  '18.65.229.86',
  '13.35.114.17',
  '13.35.114.86',
]

let activeIpIndex = 0
let keepAliveAgent: any = null

// Refresh IP pool in background via DNS-over-HTTPS
async function refreshDoHIps() {
  try {
    const res = await fetch('https://dns.google/resolve?name=api.themoviedb.org', {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.Answer && Array.isArray(data.Answer)) {
      const validIps = data.Answer.filter((a: any) => a.type === 1 && a.data).map((a: any) => a.data)
      if (validIps.length > 0) {
        validIps.forEach((ip: string) => {
          if (!IP_POOL.includes(ip)) IP_POOL.unshift(ip)
        })
      }
    }
  } catch {}
}

// Initial async DoH fetch
refreshDoHIps()

async function requestNodeHttps<T>(urlStr: string, attempt = 0): Promise<T> {
  if (typeof window !== 'undefined') {
    throw new Error('Direct TMDB fetch is only available on server')
  }

  const https = await import('node:https')

  if (!keepAliveAgent) {
    keepAliveAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 80,
      maxFreeSockets: 20,
      timeout: 6000,
    })
  }

  const ip = IP_POOL[activeIpIndex % IP_POOL.length]
  const parsed = new URL(urlStr)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ip,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        agent: keepAliveAgent,
        servername: 'api.themoviedb.org',
        headers: {
          Host: 'api.themoviedb.org',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 7Media/1.0',
          Accept: 'application/json',
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => (raw += chunk))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(raw) as T)
            } catch (err) {
              reject(err)
            }
          } else {
            reject(new Error(`TMDB error status ${res.statusCode}: ${raw}`))
          }
        })
      }
    )

    req.on('error', async (err) => {
      // Rotate to next IP in pool on error
      activeIpIndex++
      if (attempt < 3) {
        try {
          const retryData = await requestNodeHttps<T>(urlStr, attempt + 1)
          resolve(retryData)
        } catch (retryErr) {
          reject(retryErr)
        }
      } else {
        reject(err)
      }
    })

    req.setTimeout(5000, () => {
      req.destroy(new Error('TMDB request timed out'))
    })

    req.end()
  })
}

async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.append('api_key', API_KEY)

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const cacheKey = url.toString()
  const cached = responseCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data as T
  }

  try {
    const data = await requestNodeHttps<T>(url.toString())
    responseCache.set(cacheKey, { data, expires: Date.now() + 300000 })
    return data
  } catch (err) {
    if (cached) return cached.data as T
    console.error(`[TMDB API Error] ${endpoint}:`, err)
    // Return empty fallback instead of crashing
    return { results: [], page: 1, total_pages: 1, total_results: 0 } as unknown as T
  }
}

export const tmdbClient = {
  // Trending
  getTrendingMovies: async (timeWindow: 'day' | 'week' = 'week', page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`, {
      page,
    })
  },

  getTrendingShows: async (timeWindow: 'day' | 'week' = 'week', page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>(`/trending/tv/${timeWindow}`, {
      page,
    })
  },

  // Popular
  getPopularMovies: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', { page })
  },

  getPopularShows: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/tv/popular', { page })
  },

  // Top Rated
  getTopRatedMovies: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', { page })
  },

  getTopRatedShows: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/tv/top_rated', { page })
  },

  // Upcoming
  getUpcomingMovies: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', { page })
  },

  // Movie Details
  getMovieDetails: async (movieId: number) => {
    return fetchTMDB<TMDBMovieDetail>(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,similar',
    })
  },

  // Show Details
  getShowDetails: async (showId: number) => {
    return fetchTMDB<TMDBShowDetail>(`/tv/${showId}`, {
      append_to_response: 'credits,videos,similar',
    })
  },

  // Search
  searchMovies: async (query: string, page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', {
      query,
      page,
    })
  },

  searchShows: async (query: string, page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/search/tv', {
      query,
      page,
    })
  },

  searchMulti: async (query: string, page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie | TMDBShow>>('/search/multi', {
      query,
      page,
    })
  },

  // Genres
  getMovieGenres: async () => {
    const data = await fetchTMDB<{ genres: Genre[] }>('/genre/movie/list')
    return data.genres || []
  },

  getShowGenres: async () => {
    const data = await fetchTMDB<{ genres: Genre[] }>('/genre/tv/list')
    return data.genres || []
  },

  // Now Playing / Latest Releases
  getNowPlayingMovies: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', { page })
  },

  getOnTheAirShows: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/tv/on_the_air', { page })
  },

  getAiringTodayShows: async (page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/tv/airing_today', { page })
  },

  // Discover
  discoverMovies: async (params: {
    page?: number
    with_genres?: string
    with_original_language?: string
    with_watch_providers?: string
    watch_region?: string
    sort_by?: string
    include_adult?: boolean
  }) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', params)
  },

  discoverShows: async (params: {
    page?: number
    with_genres?: string
    with_original_language?: string
    with_watch_providers?: string
    watch_region?: string
    sort_by?: string
    include_adult?: boolean
  }) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', params)
  },

  getMoviesByGenre: async (genreId: number, page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
      with_genres: genreId,
      page,
      sort_by: 'popularity.desc',
    })
  },

  getShowsByGenre: async (genreId: number, page = 1) => {
    return fetchTMDB<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
      with_genres: genreId,
      page,
      sort_by: 'popularity.desc',
    })
  },

  getWatchProviders: async (type: 'movie' | 'tv', region = 'US') => {
    const data = await fetchTMDB<{
      results: Array<{
        provider_id: number
        provider_name: string
        logo_path: string
        display_priority: number
      }>
    }>(`/watch/providers/${type}`, {
      watch_region: region,
    })
    return data.results || []
  },

  // Season Details
  getSeasonDetails: async (showId: number, seasonNumber: number) => {
    return fetchTMDB<{
      _id: string
      air_date: string
      episodes: Array<{
        air_date: string
        episode_number: number
        id: number
        name: string
        overview: string
        production_code: string
        runtime: number
        season_number: number
        show_id: number
        still_path: string
        vote_average: number
        vote_count: number
        crew: any[]
        guest_stars: any[]
      }>
      name: string
      overview: string
      id: number
      poster_path: string
      season_number: number
    }>(`/tv/${showId}/season/${seasonNumber}`)
  },

  // Images
  getImageUrl: (
    path: string | null | undefined,
    size: 'w92' | 'w154' | 'w185' | 'w200' | 'w300' | 'w342' | 'w500' | 'w780' | 'original' = 'original'
  ) => {
    if (!path) return null
    return `https://image.tmdb.org/t/p/${size}${path}`
  },
}
