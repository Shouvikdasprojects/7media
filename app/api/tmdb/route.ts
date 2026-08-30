import { tmdbClient } from '@/lib/tmdb/client'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  // Rate Limiting: 240 requests per minute per IP
  const clientIp = getClientIp(req)
  const rateLimitResult = checkRateLimit(`tmdb_root:${clientIp}`, {
    limit: 240,
    windowMs: 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult, 'Too many requests to TMDB proxy.')
  }

  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  try {
    const rawPage = searchParams.get('page') || '1'
    const page = Math.max(1, Math.min(parseInt(rawPage, 10) || 1, 500))

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
      const data = await tmdbClient.getPopularMovies(page)
      return NextResponse.json(data)
    }
    if (endpoint === 'popular-shows') {
      const data = await tmdbClient.getPopularShows(page)
      return NextResponse.json(data)
    }
    if (endpoint === 'top-rated-movies') {
      const data = await tmdbClient.getTopRatedMovies(page)
      return NextResponse.json(data)
    }
    if (endpoint === 'top-rated-shows') {
      const data = await tmdbClient.getTopRatedShows(page)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 })
  } catch (error) {
    console.error('[TMDB API Root Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch from media provider' },
      { status: 500 }
    )
  }
}
