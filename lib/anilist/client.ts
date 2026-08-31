import { AniListMedia, AniListPageResponse } from './types'

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'

// In-Memory Server TTL Cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const memoryCache = new Map<string, CacheEntry<any>>()

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  const isExpired = Date.now() - entry.timestamp > entry.ttl
  if (isExpired) {
    // Keep stale cache for fallback, but return null for fresh fetch
    return null
  }
  return entry.data as T
}

function getStaleCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  return entry ? (entry.data as T) : null
}

function setCache<T>(key: string, data: T, ttlMs = 10 * 60 * 1000) {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  })
}

// Media Card GraphQL Fragment
const MEDIA_CARD_FRAGMENT = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  format
  episodes
  duration
  status
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  averageScore
  meanScore
  popularity
  trending
  favourites
  genres
  studios(isMain: true) {
    nodes {
      id
      name
    }
  }
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
  trailer {
    id
    site
    thumbnail
  }
  description
`

// Helper: Calculate current anime season based on current month
export function getCurrentAnimeSeason(): { season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; year: number } {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const year = now.getFullYear()

  if (month >= 1 && month <= 3) return { season: 'WINTER', year }
  if (month >= 4 && month <= 6) return { season: 'SPRING', year }
  if (month >= 7 && month <= 9) return { season: 'SUMMER', year }
  return { season: 'FALL', year }
}

// Fetch with Retry, Backoff, Timeout and Stale-While-Revalidate Fallback
async function fetchAniList<T>(query: string, variables: Record<string, any> = {}, ttlMs = 10 * 60 * 1000): Promise<T> {
  const cacheKey = JSON.stringify({ query: query.trim(), variables })
  const cached = getCached<T>(cacheKey)
  if (cached) {
    return cached
  }

  const maxRetries = 2
  let attempt = 0
  let lastError: any = null

  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(ANILIST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle Rate Limiting (429)
      if (response.status === 429) {
        attempt++
        if (attempt <= maxRetries) {
          const waitTime = 1000 * attempt + Math.floor(Math.random() * 500)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }
        // If out of retries on 429, check stale cache
        const stale = getStaleCached<T>(cacheKey)
        if (stale) return stale
        throw new Error('AniList API rate limit reached. Please try again in a moment.')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        attempt++
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 800))
          continue
        }
        const stale = getStaleCached<T>(cacheKey)
        if (stale) return stale
        throw new Error(`AniList GraphQL error ${response.status}: ${errorText}`)
      }

      const json = await response.json()
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message || 'AniList GraphQL query error')
      }

      if (json.data) {
        setCache(cacheKey, json.data, ttlMs)
        return json.data as T
      }

      throw new Error('No data received from AniList')
    } catch (err: any) {
      lastError = err
      attempt++
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 800))
      }
    }
  }

  // Fallback to stale cache if available
  const stale = getStaleCached<T>(cacheKey)
  if (stale) {
    return stale
  }

  throw lastError || new Error('Failed to query AniList GraphQL API')
}

export const anilistClient = {
  // 1. Trending Anime
  getTrendingAnime: async (page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage }, 15 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    }
  },

  // 1.5 Airing Schedule for Calendar
  getAiringSchedule: async (start: number, end: number, _perPage = 50) => {
    const query = `
      query ($start: Int, $end: Int, $page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo {
            hasNextPage
          }
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            id
            airingAt
            episode
            timeUntilAiring
            media {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                color
              }
              genres
              averageScore
              format
              studios(isMain: true) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    `
    try {
      let combined: any[] = []
      // Fetch up to 3 pages (up to 150 items) to cover every day of the full week
      for (let p = 1; p <= 3; p++) {
        const data = await fetchAniList<{ Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: any[] } }>(
          query,
          { start, end, page: p },
          15 * 60 * 1000
        )
        const list = data?.Page?.airingSchedules || []
        combined = combined.concat(list)
        if (!data?.Page?.pageInfo?.hasNextPage) break
      }
      return combined
    } catch {
      return []
    }
  },

  // 2. Popular All-Time
  getPopularAnime: async (page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage }, 30 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    }
  },

  // 3. Top Rated All-Time
  getTopRatedAnime: async (page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, sort: [SCORE_DESC], isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage }, 30 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    }
  },

  // 4. Currently Airing Anime
  getCurrentlyAiringAnime: async (page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, status: RELEASING, sort: [POPULARITY_DESC], isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage }, 15 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    }
  },

  // 5. Seasonal Picks
  getSeasonalAnime: async (season?: string, year?: number, page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const currentDefaults = getCurrentAnimeSeason()
    const activeSeason = season || currentDefaults.season
    const activeYear = year || currentDefaults.year

    const query = `
      query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, {
        page,
        perPage,
        season: activeSeason,
        seasonYear: activeYear,
      }, 30 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    }
  },

  // 6. Anime by Genre with Multi-filter
  getAnimeByGenre: async (params: {
    genre?: string
    page?: number
    perPage?: number
    sort?: string[]
    format?: string
    status?: string
  }): Promise<AniListPageResponse> => {
    const query = `
      query ($page: Int, $perPage: Int, $genre: String, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, genre: $genre, sort: $sort, format: $format, status: $status, isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    const variables: Record<string, any> = {
      page: params.page || 1,
      perPage: params.perPage || 24,
      sort: params.sort || ['POPULARITY_DESC'],
    }
    if (params.genre && params.genre !== 'All') {
      variables.genre = params.genre
    }
    if (params.format) {
      variables.format = params.format
    }
    if (params.status) {
      variables.status = params.status
    }

    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, variables, 15 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: params.page || 1, lastPage: 1, hasNextPage: false, perPage: params.perPage || 24 }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: params.page || 1, lastPage: 1, hasNextPage: false, perPage: params.perPage || 24 }, media: [] }
    }
  },

  // 7. Full Anime Details (Characters, Studios, Relations, Streaming)
  getAnimeDetails: async (id: number): Promise<AniListMedia | null> => {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ${MEDIA_CARD_FRAGMENT}
          source
          synonyms
          characters(sort: [ROLE, RELEVANCE], perPage: 12) {
            edges {
              id
              role
              node {
                id
                name {
                  full
                  native
                }
                image {
                  large
                  medium
                }
              }
              voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
                id
                name {
                  full
                  native
                }
                languageV2
                image {
                  large
                  medium
                }
              }
            }
          }
          relations {
            edges {
              id
              relationType
              node {
                id
                title {
                  romaji
                  english
                  native
                }
                format
                status
                coverImage {
                  large
                  medium
                  color
                }
                episodes
                averageScore
              }
            }
          }
          externalLinks {
            id
            site
            url
            icon
          }
          recommendations(sort: [RATING_DESC], perPage: 12) {
            nodes {
              mediaRecommendation {
                ${MEDIA_CARD_FRAGMENT}
              }
            }
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Media: AniListMedia }>(query, { id }, 60 * 60 * 1000)
      return data?.Media || null
    } catch {
      return null
    }
  },

  // 8. Search Anime
  searchAnime: async (search: string, page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const query = `
      query ($page: Int, $perPage: Int, $search: String) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: ANIME, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC], isAdult: false) {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    `
    try {
      const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage, search }, 30 * 60 * 1000)
      return data?.Page || { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    } catch {
      return { pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false, perPage }, media: [] }
    }
  },
}
