'use client'

import { useGenres, useWatchProviders } from '@/lib/tmdb/hooks'
import { LANGUAGES, COUNTRIES } from '@/lib/tmdb/constants'
import { ChevronDown } from 'lucide-react'

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.code, label: l.name }))
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }))

const MOVIE_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'primary_release_date.desc', label: 'Recent Releases' },
  { value: 'vote_average.desc', label: 'Top IMDb' },
]

const TV_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'first_air_date.desc', label: 'Recent Releases' },
  { value: 'vote_average.desc', label: 'Top IMDb' },
]

export interface BrowseFilters {
  genre: string
  language: string
  provider: string
  country: string
  sortBy: string
}

interface BrowseFilterBarProps {
  type: 'movie' | 'tv'
  filters: BrowseFilters
  onChange: (filters: BrowseFilters) => void
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="relative shrink-0 snap-start">
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-md border border-border bg-secondary pl-3 pr-8 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary"
        aria-label={label}
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

export function BrowseFilterBar({ type, filters, onChange }: BrowseFilterBarProps) {
  const { data: genresData } = useGenres(type)
  const { data: providersData } = useWatchProviders(type, filters.country || 'US')

  const rawGenres = Array.isArray(genresData)
    ? genresData
    : Array.isArray(genresData?.genres)
    ? genresData.genres
    : []

  const genreOptions = rawGenres.map((g) => ({ value: String(g.id), label: g.name }))

  const rawProviders = Array.isArray(providersData)
    ? providersData
    : Array.isArray(providersData?.results)
    ? providersData.results
    : []

  const providerOptions = rawProviders
    .slice()
    .sort((a, b) => (a.display_priority || 0) - (b.display_priority || 0))
    .slice(0, 30)
    .map((p) => ({ value: String(p.provider_id), label: p.provider_name }))

  const set = (key: keyof BrowseFilters) => (value: string) =>
    onChange({ ...filters, [key]: value })

  const hasActiveFilters =
    filters.genre || filters.language || filters.provider || filters.country

  return (
    <div className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide touch-pan-x md:flex-wrap md:overflow-visible">
      <FilterSelect
        label="Genre"
        value={filters.genre}
        options={genreOptions}
        onChange={set('genre')}
      />
      <FilterSelect
        label="Language"
        value={filters.language}
        options={LANGUAGE_OPTIONS}
        onChange={set('language')}
      />
      <FilterSelect
        label="Service"
        value={filters.provider}
        options={providerOptions}
        onChange={set('provider')}
      />
      <FilterSelect
        label="Country"
        value={filters.country}
        options={COUNTRY_OPTIONS}
        onChange={set('country')}
      />
      <FilterSelect
        label="Sort By"
        value={filters.sortBy}
        options={type === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS}
        onChange={set('sortBy')}
      />
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({ genre: '', language: '', provider: '', country: '', sortBy: filters.sortBy })
          }
          className="h-9 rounded-md px-3 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
