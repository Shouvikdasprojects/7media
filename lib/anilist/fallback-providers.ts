import { AniListMedia, AniListPageResponse } from './types'

// ============================================================================
// ADAPTERS: Convert Jikan & Kitsu JSON into Unified AniListMedia Schema
// ============================================================================

export function mapJikanToAniListMedia(item: any): AniListMedia {
  const titles = item.titles || []
  const romaji = titles.find((t: any) => t.type === 'Default')?.title || item.title || 'Untitled Anime'
  const english = titles.find((t: any) => t.type === 'English')?.title || item.title_english || romaji
  const native = titles.find((t: any) => t.type === 'Japanese')?.title || item.title_japanese || null

  const image =
    item.images?.webp?.large_image_url ||
    item.images?.jpg?.large_image_url ||
    item.images?.webp?.image_url ||
    item.images?.jpg?.image_url ||
    ''

  const banner = item.trailer?.images?.maximum_image_url || item.images?.webp?.large_image_url || null

  return {
    id: item.mal_id,
    idMal: item.mal_id,
    title: { romaji, english, native },
    coverImage: {
      extraLarge: image,
      large: image,
      medium: item.images?.jpg?.small_image_url || image,
      color: '#e50914',
    },
    bannerImage: banner,
    format: item.type?.toUpperCase() || 'TV',
    episodes: item.episodes || null,
    duration: item.duration ? parseInt(item.duration, 10) || null : null,
    status: item.airing ? 'RELEASING' : item.status === 'Finished Airing' ? 'FINISHED' : 'NOT_YET_RELEASED',
    season: item.season ? item.season.toUpperCase() : null,
    seasonYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : null),
    startDate: item.aired?.from
      ? {
          year: new Date(item.aired.from).getFullYear(),
          month: new Date(item.aired.from).getMonth() + 1,
          day: new Date(item.aired.from).getDate(),
        }
      : null,
    averageScore: item.score ? Math.round(item.score * 10) : null,
    meanScore: item.score ? Math.round(item.score * 10) : null,
    popularity: item.members || 0,
    trending: item.popularity || 0,
    favourites: item.favorites || 0,
    genres: (item.genres || []).map((g: any) => g.name),
    studios: {
      nodes: (item.studios || []).map((s: any) => ({ id: s.mal_id, name: s.name })),
    },
    trailer: item.trailer?.youtube_id
      ? {
          id: item.trailer.youtube_id,
          site: 'youtube',
          thumbnail: item.trailer.images?.maximum_image_url || item.trailer.images?.large_image_url,
        }
      : null,
    description: item.synopsis || '',
  }
}

export function mapKitsuToAniListMedia(item: any): AniListMedia {
  const attr = item.attributes || {}
  const romaji = attr.titles?.en_jp || attr.canonicalTitle || 'Untitled Anime'
  const english = attr.titles?.en || attr.titles?.en_us || attr.canonicalTitle || romaji
  const native = attr.titles?.ja_jp || null

  const image = attr.posterImage?.large || attr.posterImage?.original || attr.posterImage?.medium || ''
  const banner = attr.coverImage?.large || attr.coverImage?.original || null

  const rawRating = parseFloat(attr.averageRating)
  const score = isNaN(rawRating) ? null : Math.round(rawRating)

  return {
    id: parseInt(item.id, 10) || Math.floor(Math.random() * 100000),
    title: { romaji, english, native },
    coverImage: {
      extraLarge: image,
      large: image,
      medium: attr.posterImage?.small || image,
      color: '#e50914',
    },
    bannerImage: banner,
    format: attr.subtype?.toUpperCase() || 'TV',
    episodes: attr.episodeCount || null,
    duration: attr.episodeLength || null,
    status: attr.status === 'current' ? 'RELEASING' : attr.status === 'finished' ? 'FINISHED' : 'NOT_YET_RELEASED',
    seasonYear: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
    startDate: attr.startDate
      ? {
          year: new Date(attr.startDate).getFullYear(),
          month: new Date(attr.startDate).getMonth() + 1,
          day: new Date(attr.startDate).getDate(),
        }
      : null,
    averageScore: score,
    meanScore: score,
    popularity: attr.userCount || 0,
    favourites: attr.favoritesCount || 0,
    genres: [],
    trailer: attr.youtubeVideoId
      ? {
          id: attr.youtubeVideoId,
          site: 'youtube',
          thumbnail: `https://img.youtube.com/vi/${attr.youtubeVideoId}/hqdefault.jpg`,
        }
      : null,
    description: attr.synopsis || attr.description || '',
  }
}

// ============================================================================
// TIER 2: JIKAN (MyAnimeList) API CLIENT
// ============================================================================

export const jikanFallback = {
  getTrendingAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=airing&page=${page}&limit=${limit}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapJikanToAniListMedia)
      return {
        pageInfo: {
          total: json.pagination?.items?.total || list.length,
          currentPage: page,
          lastPage: json.pagination?.last_visible_page || 1,
          hasNextPage: Boolean(json.pagination?.has_next_page),
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getPopularAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=bypopularity&page=${page}&limit=${limit}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapJikanToAniListMedia)
      return {
        pageInfo: {
          total: json.pagination?.items?.total || list.length,
          currentPage: page,
          lastPage: json.pagination?.last_visible_page || 1,
          hasNextPage: Boolean(json.pagination?.has_next_page),
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getTopRatedAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/top/anime?page=${page}&limit=${limit}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapJikanToAniListMedia)
      return {
        pageInfo: {
          total: json.pagination?.items?.total || list.length,
          currentPage: page,
          lastPage: json.pagination?.last_visible_page || 1,
          hasNextPage: Boolean(json.pagination?.has_next_page),
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getCurrentlyAiringAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/seasons/now?page=${page}&limit=${limit}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapJikanToAniListMedia)
      return {
        pageInfo: {
          total: json.pagination?.items?.total || list.length,
          currentPage: page,
          lastPage: json.pagination?.last_visible_page || 1,
          hasNextPage: Boolean(json.pagination?.has_next_page),
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  searchAnime: async (search: string, page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        { headers: { Accept: 'application/json' } }
      )
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapJikanToAniListMedia)
      return {
        pageInfo: {
          total: json.pagination?.items?.total || list.length,
          currentPage: page,
          lastPage: json.pagination?.last_visible_page || 1,
          hasNextPage: Boolean(json.pagination?.has_next_page),
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getAnimeDetails: async (id: number): Promise<AniListMedia | null> => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      if (!json.data) return null
      return mapJikanToAniListMedia(json.data)
    } catch {
      return null
    }
  },
}

// ============================================================================
// TIER 3: KITSU API CLIENT
// ============================================================================

export const kitsuFallback = {
  getTrendingAnime: async (limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const res = await fetch(`https://kitsu.io/api/edge/trending/anime?limit=${limit}`, {
        headers: { Accept: 'application/vnd.api+json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapKitsuToAniListMedia)
      return {
        pageInfo: {
          total: list.length,
          currentPage: 1,
          lastPage: 1,
          hasNextPage: false,
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getPopularAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const offset = (page - 1) * limit
      const res = await fetch(`https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=${limit}&page[offset]=${offset}`, {
        headers: { Accept: 'application/vnd.api+json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapKitsuToAniListMedia)
      return {
        pageInfo: {
          total: json.meta?.count || list.length,
          currentPage: page,
          lastPage: Math.ceil((json.meta?.count || list.length) / limit),
          hasNextPage: list.length === limit,
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getTopRatedAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const offset = (page - 1) * limit
      const res = await fetch(`https://kitsu.io/api/edge/anime?sort=-averageRating&page[limit]=${limit}&page[offset]=${offset}`, {
        headers: { Accept: 'application/vnd.api+json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapKitsuToAniListMedia)
      return {
        pageInfo: {
          total: json.meta?.count || list.length,
          currentPage: page,
          lastPage: Math.ceil((json.meta?.count || list.length) / limit),
          hasNextPage: list.length === limit,
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getCurrentlyAiringAnime: async (page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const offset = (page - 1) * limit
      const res = await fetch(
        `https://kitsu.io/api/edge/anime?filter[status]=current&sort=-userCount&page[limit]=${limit}&page[offset]=${offset}`,
        { headers: { Accept: 'application/vnd.api+json' } }
      )
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapKitsuToAniListMedia)
      return {
        pageInfo: {
          total: json.meta?.count || list.length,
          currentPage: page,
          lastPage: Math.ceil((json.meta?.count || list.length) / limit),
          hasNextPage: list.length === limit,
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getAnimeByGenre: async (genre: string, page = 1, limit = 24): Promise<AniListPageResponse | null> => {
    try {
      const offset = (page - 1) * limit
      const categoryFilter = genre && genre !== 'All' ? `&filter[categories]=${encodeURIComponent(genre.toLowerCase())}` : ''
      const res = await fetch(
        `https://kitsu.io/api/edge/anime?sort=-userCount${categoryFilter}&page[limit]=${limit}&page[offset]=${offset}`,
        { headers: { Accept: 'application/vnd.api+json' } }
      )
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapKitsuToAniListMedia)
      return {
        pageInfo: {
          total: json.meta?.count || list.length,
          currentPage: page,
          lastPage: Math.ceil((json.meta?.count || list.length) / limit),
          hasNextPage: list.length === limit,
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  searchAnime: async (search: string, page = 1, limit = 20): Promise<AniListPageResponse | null> => {
    try {
      const offset = (page - 1) * limit
      const res = await fetch(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(search)}&page[limit]=${limit}&page[offset]=${offset}`,
        { headers: { Accept: 'application/vnd.api+json' } }
      )
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.data || []).map(mapKitsuToAniListMedia)
      return {
        pageInfo: {
          total: json.meta?.count || list.length,
          currentPage: page,
          lastPage: Math.ceil((json.meta?.count || list.length) / limit),
          hasNextPage: list.length === limit,
          perPage: limit,
        },
        media: list,
      }
    } catch {
      return null
    }
  },

  getAnimeDetails: async (id: number): Promise<AniListMedia | null> => {
    try {
      const res = await fetch(`https://kitsu.io/api/edge/anime/${id}`, {
        headers: { Accept: 'application/vnd.api+json' },
      })
      if (!res.ok) return null
      const json = await res.json()
      if (!json.data) return null
      return mapKitsuToAniListMedia(json.data)
    } catch {
      return null
    }
  },
}
