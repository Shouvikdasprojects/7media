export interface AniListTitle {
  romaji?: string | null
  english?: string | null
  native?: string | null
}

export interface AniListStartDate {
  year?: number | null
  month?: number | null
  day?: number | null
}

export interface AniListCoverImage {
  extraLarge?: string | null
  large?: string | null
  medium?: string | null
  color?: string | null
}

export interface AniListStudio {
  id: number
  name: string
  isAnimationStudio?: boolean
}

export interface AniListNextAiring {
  airingAt: number
  timeUntilAiring: number
  episode: number
}

export interface AniListTrailer {
  id?: string | null
  site?: string | null
  thumbnail?: string | null
}

export interface AniListVoiceActor {
  id: number
  name: {
    full: string
    native?: string | null
  }
  languageV2?: string | null
  image?: {
    large?: string | null
    medium?: string | null
  } | null
}

export interface AniListCharacterEdge {
  id: number
  role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND'
  node: {
    id: number
    name: {
      full: string
      native?: string | null
    }
    image?: {
      large?: string | null
      medium?: string | null
    } | null
  }
  voiceActors?: AniListVoiceActor[]
}

export interface AniListRelationEdge {
  id: number
  relationType: string
  node: {
    id: number
    title: AniListTitle
    format: string
    status: string
    coverImage?: AniListCoverImage | null
    episodes?: number | null
    averageScore?: number | null
    seasonYear?: number | null
    startDate?: {
      year?: number | null
      month?: number | null
      day?: number | null
    } | null
  }
}

export interface AniListStreamingLink {
  id: number
  site: string
  url: string
  icon?: string | null
}

export interface AniListMedia {
  id: number
  idMal?: number | null
  title: AniListTitle
  coverImage?: AniListCoverImage | null
  bannerImage?: string | null
  format: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | string
  episodes?: number | null
  duration?: number | null
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | string
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | string | null
  seasonYear?: number | null
  startDate?: AniListStartDate | null
  averageScore?: number | null
  meanScore?: number | null
  popularity?: number | null
  trending?: number | null
  favourites?: number | null
  genres: string[]
  tags?: Array<{ id: number; name: string; rank?: number }>
  studios?: {
    nodes: AniListStudio[]
  }
  nextAiringEpisode?: AniListNextAiring | null
  trailer?: AniListTrailer | null
  description?: string | null
  source?: string | null
  synonyms?: string[]
  characters?: {
    edges: AniListCharacterEdge[]
  }
  relations?: {
    edges: AniListRelationEdge[]
  }
  externalLinks?: AniListStreamingLink[]
  recommendations?: {
    nodes: Array<{
      mediaRecommendation?: AniListMedia | null
    }>
  }
}

export interface AniListPageInfo {
  total: number
  currentPage: number
  lastPage: number
  hasNextPage: boolean
  perPage: number
}

export interface AniListPageResponse {
  pageInfo: AniListPageInfo
  media: AniListMedia[]
}

export const ANIME_GENRES = [
  { id: 'Action', name: 'Action', icon: '⚔️', desc: 'High-octane fights, battles, and adrenaline rushes.' },
  { id: 'Adventure', name: 'Adventure', icon: '🗺️', desc: 'Epic journeys, explorations, and grand quests.' },
  { id: 'Comedy', name: 'Comedy', icon: '😂', desc: 'Hilarious antics, slapstick, and feel-good laughs.' },
  { id: 'Drama', name: 'Drama', icon: '🎭', desc: 'Emotional depth, character struggles, and compelling stories.' },
  { id: 'Fantasy', name: 'Fantasy', icon: '🔮', desc: 'Magic, mythical creatures, and enchanted realms.' },
  { id: 'Horror', name: 'Horror', icon: '👻', desc: 'Spine-chilling suspense, supernatural terror, and dark mysteries.' },
  { id: 'Mahou Shoujo', name: 'Mahou Shoujo', icon: '✨', desc: 'Magical girls transforming to protect what they love.' },
  { id: 'Mecha', name: 'Mecha', icon: '🤖', desc: 'Giant robots, futuristic battles, and pilot drama.' },
  { id: 'Music', name: 'Music', icon: '🎵', desc: 'Idols, bands, passionate performances, and musical journeys.' },
  { id: 'Mystery', name: 'Mystery', icon: '🔍', desc: 'Unraveling secrets, detective casework, and enigma.' },
  { id: 'Psychological', name: 'Psychological', icon: '🧠', desc: 'Mind games, moral dilemmas, and intense thriller plots.' },
  { id: 'Romance', name: 'Romance', icon: '💖', desc: 'Heartwarming love stories, chemistry, and romantic drama.' },
  { id: 'Sci-Fi', name: 'Sci-Fi', icon: '🚀', desc: 'Cyberpunk, space exploration, and futuristic technologies.' },
  { id: 'Slice of Life', name: 'Slice of Life', icon: '☕', desc: 'Heartwarming daily life, friendships, and cozy moments.' },
  { id: 'Sports', name: 'Sports', icon: '⚽', desc: 'Competitive spirit, team camaraderie, and championship glory.' },
  { id: 'Supernatural', name: 'Supernatural', icon: '⚡', desc: 'Spirits, paranormal occurrences, and occult powers.' },
  { id: 'Thriller', name: 'Thriller', icon: '⏱️', desc: 'Fast-paced suspense, high stakes, and cliffhangers.' },
] as const
