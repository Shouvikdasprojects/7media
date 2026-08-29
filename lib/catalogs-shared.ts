export interface CatalogData {
  id: string
  name: string
  color: 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'pink'
  thumbnail?: 'Folder' | 'Clapperboard' | 'Film' | 'Tv' | 'Sparkles' | 'Flame' | 'Star' | 'Heart'
  itemIds: number[]
  custom?: boolean
}

export const DEFAULT_USER_CATALOGS: CatalogData[] = [
  { id: 'watchlist', name: 'Watchlist', color: 'emerald', thumbnail: 'Folder', itemIds: [] },
  { id: 'movies', name: 'Favorite Movies', color: 'emerald', thumbnail: 'Film', itemIds: [], custom: true },
  { id: 'series', name: 'TV Series Binge', color: 'cyan', thumbnail: 'Tv', itemIds: [], custom: true },
  { id: 'anime', name: 'Anime Picks', color: 'purple', thumbnail: 'Sparkles', itemIds: [], custom: true },
  { id: 'horror', name: 'Top Horror Movies', color: 'rose', thumbnail: 'Flame', itemIds: [], custom: true },
  { id: 'top_rated', name: 'Top Rated', color: 'amber', thumbnail: 'Star', itemIds: [], custom: true },
  { id: 'critics', name: "Critics' Cut", color: 'pink', thumbnail: 'Clapperboard', itemIds: [], custom: true },
]
