import { tmdbClient } from '@/lib/tmdb/client'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  // 1. Rate Limiting: 240 requests per minute per IP (prevents self-inflicted carousel 429s)
  const clientIp = getClientIp(req)
  const rateLimitResult = checkRateLimit(`tmdb:${clientIp}`, {
    limit: 240,
    windowMs: 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult, 'Too many requests to TMDB proxy.')
  }

  const { slug } = await params
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return NextResponse.json({ error: 'Invalid request path' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)

  try {
    // /api/tmdb/trending/movies or /api/tmdb/trending/movie
    if (slug[0] === 'trending' && (slug[1] === 'movies' || slug[1] === 'movie')) {
      const timeWindow = searchParams.get('timeWindow') === 'day' ? 'day' : 'week'
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getTrendingMovies(timeWindow, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/trending/shows or /api/tmdb/trending/tv or /api/tmdb/trending/show
    if (slug[0] === 'trending' && (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show')) {
      const timeWindow = searchParams.get('timeWindow') === 'day' ? 'day' : 'week'
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getTrendingShows(timeWindow, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/popular/movies
    if (slug[0] === 'popular' && slug[1] === 'movies') {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getPopularMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/popular/shows
    if (slug[0] === 'popular' && slug[1] === 'shows') {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getPopularShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/top-rated/movies
    if (slug[0] === 'top-rated' && slug[1] === 'movies') {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getTopRatedMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/top-rated/shows
    if (slug[0] === 'top-rated' && slug[1] === 'shows') {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getTopRatedShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/upcoming/movies
    if (slug[0] === 'upcoming' && (slug[1] === 'movies' || slug[1] === 'movie')) {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getUpcomingMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/on-the-air/shows or /api/tmdb/on-the-air/tv
    if (slug[0] === 'on-the-air' && (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show')) {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getOnTheAirShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/airing-today/shows or /api/tmdb/airing-today/tv
    if (slug[0] === 'airing-today' && (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show')) {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getAiringTodayShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/now-playing/movies
    if (slug[0] === 'now-playing' && (slug[1] === 'movies' || slug[1] === 'movie')) {
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getNowPlayingMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/movie/:id
    if (slug[0] === 'movie' && slug[1]) {
      const movieId = parseInt(slug[1], 10)
      if (isNaN(movieId) || movieId <= 0) {
        return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
      }
      const data = await tmdbClient.getMovieDetails(movieId)
      return NextResponse.json(data)
    }

    // /api/tmdb/show/:id
    if (slug[0] === 'show' && slug[1]) {
      const showId = parseInt(slug[1], 10)
      if (isNaN(showId) || showId <= 0) {
        return NextResponse.json({ error: 'Invalid show ID' }, { status: 400 })
      }
      const data = await tmdbClient.getShowDetails(showId)
      return NextResponse.json(data)
    }

    // /api/tmdb/search
    if (slug[0] === 'search') {
      const query = (searchParams.get('query') || '').trim().slice(0, 100)
      if (!query) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
      }
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.searchMulti(query, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/discover/movies and /api/tmdb/discover/shows
    if (slug[0] === 'discover') {
      const minRating = searchParams.get('vote_average_gte') || searchParams.get('vote_average.gte') || searchParams.get('minRating')
      const year = searchParams.get('primary_release_year') || searchParams.get('first_air_date_year') || searchParams.get('year')

      const params: Record<string, any> = {
        page: Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500)),
        with_genres: searchParams.get('with_genres')?.slice(0, 50) || undefined,
        with_original_language: searchParams.get('with_original_language')?.slice(0, 10) || undefined,
        with_watch_providers: searchParams.get('with_watch_providers')?.slice(0, 50) || undefined,
        watch_region: searchParams.get('watch_region')?.slice(0, 10) || undefined,
        sort_by: searchParams.get('sort_by')?.slice(0, 30) || undefined,
      }

      if (minRating) {
        params['vote_average.gte'] = parseFloat(minRating)
        params['vote_count.gte'] = 20
      }
      if (year) {
        if (slug[1] === 'movies' || slug[1] === 'movie') {
          params['primary_release_year'] = parseInt(year, 10)
        } else {
          params['first_air_date_year'] = parseInt(year, 10)
        }
      }

      if (slug[1] === 'movies' || slug[1] === 'movie') {
        const data = await tmdbClient.discoverMovies(params)
        return NextResponse.json(data)
      }
      if (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show') {
        const data = await tmdbClient.discoverShows(params)
        return NextResponse.json(data)
      }
    }

    // /api/tmdb/providers?type=movie&region=US
    if (slug[0] === 'providers') {
      const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie'
      const region = (searchParams.get('region') || 'US').slice(0, 5)
      const data = await tmdbClient.getWatchProviders(type, region)
      return NextResponse.json({ results: Array.isArray(data) ? data : [] })
    }

    // /api/tmdb/genres?type=movie|tv
    if (slug[0] === 'genres') {
      const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie'
      const data =
        type === 'tv' ? await tmdbClient.getShowGenres() : await tmdbClient.getMovieGenres()
      return NextResponse.json({ genres: data })
    }

    // /api/tmdb/season/:showId/:seasonNumber
    if (slug[0] === 'season' && slug[1] && slug[2]) {
      const showId = parseInt(slug[1], 10)
      const seasonNumber = parseInt(slug[2], 10)
      if (isNaN(showId) || isNaN(seasonNumber)) {
        return NextResponse.json({ error: 'Invalid season parameters' }, { status: 400 })
      }
      const data = await tmdbClient.getSeasonDetails(showId, seasonNumber)
      return NextResponse.json(data)
    }

    // /api/tmdb/movies/genre/:id
    if (slug[0] === 'movies' && slug[1] === 'genre' && slug[2]) {
      const genreId = parseInt(slug[2], 10)
      if (isNaN(genreId)) return NextResponse.json({ error: 'Invalid genre ID' }, { status: 400 })
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getMoviesByGenre(genreId, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/shows/genre/:id
    if (slug[0] === 'shows' && slug[1] === 'genre' && slug[2]) {
      const genreId = parseInt(slug[2], 10)
      if (isNaN(genreId)) return NextResponse.json({ error: 'Invalid genre ID' }, { status: 400 })
      const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
      const data = await tmdbClient.getShowsByGenre(genreId, page)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('[TMDB API Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from media provider' },
      { status: 500 }
    )
  }
}
