import { tmdbClient } from '@/lib/tmdb/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  try {
    // Route to appropriate function
    if (endpoint === 'trending-movies-day') {
      const data = await tmdbClient.getTrendingMovies('day')
      return NextResponse.json(data)
    }
    if (endpoint === 'trending-movies-week') {
      const data = await tmdbClient.getTrendingMovies('week')
      return NextResponse.json(data)
    }
    if (endpoint === 'trending-shows-day') {
      const data = await tmdbClient.getTrendingShows('day')
      return NextResponse.json(data)
    }
    if (endpoint === 'trending-shows-week') {
      const data = await tmdbClient.getTrendingShows('week')
      return NextResponse.json(data)
    }
    if (endpoint === 'popular-movies') {
      const page = searchParams.get('page') || '1'
      const data = await tmdbClient.getPopularMovies(parseInt(page))
      return NextResponse.json(data)
    }
    if (endpoint === 'popular-shows') {
      const page = searchParams.get('page') || '1'
      const data = await tmdbClient.getPopularShows(parseInt(page))
      return NextResponse.json(data)
    }
    if (endpoint === 'top-rated-movies') {
      const page = searchParams.get('page') || '1'
      const data = await tmdbClient.getTopRatedMovies(parseInt(page))
      return NextResponse.json(data)
    }
    if (endpoint === 'top-rated-shows') {
      const page = searchParams.get('page') || '1'
      const data = await tmdbClient.getTopRatedShows(parseInt(page))
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 })
  } catch (error) {
    console.error('TMDB API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from TMDB' },
      { status: 500 }
    )
  }
}
