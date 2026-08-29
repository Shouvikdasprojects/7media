import { tmdbClient } from '@/lib/tmdb/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)

  try {
    // /api/tmdb/trending/movies or /api/tmdb/trending/movie
    if (slug[0] === 'trending' && (slug[1] === 'movies' || slug[1] === 'movie')) {
      const timeWindow = (searchParams.get('timeWindow') || 'week') as 'day' | 'week'
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getTrendingMovies(timeWindow, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/trending/shows or /api/tmdb/trending/tv or /api/tmdb/trending/show
    if (slug[0] === 'trending' && (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show')) {
      const timeWindow = (searchParams.get('timeWindow') || 'week') as 'day' | 'week'
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getTrendingShows(timeWindow, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/popular/movies
    if (slug[0] === 'popular' && slug[1] === 'movies') {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getPopularMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/popular/shows
    if (slug[0] === 'popular' && slug[1] === 'shows') {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getPopularShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/top-rated/movies
    if (slug[0] === 'top-rated' && slug[1] === 'movies') {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getTopRatedMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/top-rated/shows
    if (slug[0] === 'top-rated' && slug[1] === 'shows') {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getTopRatedShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/upcoming/movies
    if (slug[0] === 'upcoming' && (slug[1] === 'movies' || slug[1] === 'movie')) {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getUpcomingMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/on-the-air/shows or /api/tmdb/on-the-air/tv
    if (slug[0] === 'on-the-air' && (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show')) {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getOnTheAirShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/airing-today/shows or /api/tmdb/airing-today/tv
    if (slug[0] === 'airing-today' && (slug[1] === 'shows' || slug[1] === 'tv' || slug[1] === 'show')) {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getAiringTodayShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/now-playing/movies
    if (slug[0] === 'now-playing' && (slug[1] === 'movies' || slug[1] === 'movie')) {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getNowPlayingMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/movie/:id
    if (slug[0] === 'movie') {
      const movieId = parseInt(slug[1])
      const data = await tmdbClient.getMovieDetails(movieId)
      return NextResponse.json(data)
    }

    // /api/tmdb/show/:id
    if (slug[0] === 'show') {
      const showId = parseInt(slug[1])
      const data = await tmdbClient.getShowDetails(showId)
      return NextResponse.json(data)
    }

    // /api/tmdb/search
    if (slug[0] === 'search') {
      const query = searchParams.get('query')
      if (!query) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
      }
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.searchMulti(query, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/now-playing/movies
    if (slug[0] === 'now-playing' && slug[1] === 'movies') {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getNowPlayingMovies(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/on-the-air/shows
    if (slug[0] === 'on-the-air' && slug[1] === 'shows') {
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getOnTheAirShows(page)
      return NextResponse.json(data)
    }

    // /api/tmdb/discover/movies and /api/tmdb/discover/shows
    if (slug[0] === 'discover') {
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        with_genres: searchParams.get('with_genres') || undefined,
        with_original_language: searchParams.get('with_original_language') || undefined,
        with_watch_providers: searchParams.get('with_watch_providers') || undefined,
        watch_region: searchParams.get('watch_region') || undefined,
        sort_by: searchParams.get('sort_by') || undefined,
        'vote_count.gte': searchParams.get('vote_count_gte')
          ? parseInt(searchParams.get('vote_count_gte')!)
          : undefined,
      }
      if (slug[1] === 'movies') {
        const data = await tmdbClient.discoverMovies(params)
        return NextResponse.json(data)
      }
      if (slug[1] === 'shows') {
        const data = await tmdbClient.discoverShows(params)
        return NextResponse.json(data)
      }
    }

    // /api/tmdb/providers?type=movie&region=US
    if (slug[0] === 'providers') {
      const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv'
      const region = searchParams.get('region') || 'US'
      const data = await tmdbClient.getWatchProviders(type, region)
      return NextResponse.json(data)
    }

    // /api/tmdb/genres?type=movie|tv
    if (slug[0] === 'genres') {
      const type = searchParams.get('type') || 'movie'
      const data =
        type === 'tv' ? await tmdbClient.getShowGenres() : await tmdbClient.getMovieGenres()
      return NextResponse.json({ genres: data })
    }

    // /api/tmdb/season/:showId/:seasonNumber
    if (slug[0] === 'season') {
      const showId = parseInt(slug[1])
      const seasonNumber = parseInt(slug[2])
      const data = await tmdbClient.getSeasonDetails(showId, seasonNumber)
      return NextResponse.json(data)
    }

    // /api/tmdb/movies/genre/:id
    if (slug[0] === 'movies' && slug[1] === 'genre') {
      const genreId = parseInt(slug[2])
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getMoviesByGenre(genreId, page)
      return NextResponse.json(data)
    }

    // /api/tmdb/shows/genre/:id
    if (slug[0] === 'shows' && slug[1] === 'genre') {
      const genreId = parseInt(slug[2])
      const page = parseInt(searchParams.get('page') || '1')
      const data = await tmdbClient.getShowsByGenre(genreId, page)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('[TMDB API Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
