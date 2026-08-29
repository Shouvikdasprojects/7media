import { AniListMedia, AniListPageResponse } from './types'

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'

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

async function fetchAniList<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AniList GraphQL error ${response.status}: ${errorText}`)
  }

  const json = await response.json()
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'AniList GraphQL query error')
  }

  return json.data
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
    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage })
    return data.Page
  },

  // 1.5 Airing Schedule for Calendar
  getAiringSchedule: async (start: number, end: number, perPage = 50) => {
    const query = `
      query ($start: Int, $end: Int, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
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
    const data = await fetchAniList<{ Page: { airingSchedules: any[] } }>(query, {
      start,
      end,
      perPage,
    })
    return data.Page?.airingSchedules || []
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
    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage })
    return data.Page
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
    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage })
    return data.Page
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
    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage })
    return data.Page
  },

  // 5. Seasonal Picks
  getSeasonalAnime: async (season?: string, year?: number, page = 1, perPage = 20): Promise<AniListPageResponse> => {
    const currentYear = year || new Date().getFullYear()
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
    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, {
      page,
      perPage,
      season: season || 'WINTER',
      seasonYear: currentYear,
    })
    return data.Page
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

    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, variables)
    return data.Page
  },

  // 7. Full Anime Details (Characters, Studios, Relations, Streaming)
  getAnimeDetails: async (id: number): Promise<AniListMedia> => {
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
    const data = await fetchAniList<{ Media: AniListMedia }>(query, { id })
    return data.Media
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
    const data = await fetchAniList<{ Page: AniListPageResponse }>(query, { page, perPage, search })
    return data.Page
  },
}
