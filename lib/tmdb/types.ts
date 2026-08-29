export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  media_type?: 'movie'
}

export interface TMDBShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  media_type?: 'tv'
}

export type TMDBMedia = TMDBMovie | TMDBShow

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number
  budget: number
  revenue: number
  status: string
  genres: Array<{ id: number; name: string }>
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>
  spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>
  credits?: {
    cast: Array<{
      id: number
      name: string
      character: string
      profile_path: string | null
      order: number
    }>
    crew: Array<{
      id: number
      name: string
      job: string
      department: string
      profile_path: string | null
    }>
  }
  videos?: {
    results: Array<{
      id: string
      key: string
      name: string
      site: string
      type: string
      official: boolean
    }>
  }
  similar?: {
    results: TMDBMovie[]
  }
}

export interface TMDBShowDetail extends TMDBShow {
  number_of_seasons: number
  number_of_episodes: number
  status: string
  genres: Array<{ id: number; name: string }>
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>
  networks: Array<{ id: number; name: string; logo_path: string | null }>
  spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>
  credits?: {
    cast: Array<{
      id: number
      name: string
      character: string
      profile_path: string | null
      order: number
    }>
    crew: Array<{
      id: number
      name: string
      job: string
      department: string
      profile_path: string | null
    }>
  }
  videos?: {
    results: Array<{
      id: string
      key: string
      name: string
      site: string
      type: string
      official: boolean
    }>
  }
  similar?: {
    results: TMDBShow[]
  }
}

export interface Genre {
  id: number
  name: string
}

export interface TMDBPaginatedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}
