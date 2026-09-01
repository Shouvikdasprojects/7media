import { anilistClient } from '@/lib/anilist/client'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Cloudflare Edge & Browser Caching Headers
const CACHE_HEADERS_STATIC = {
  'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'max-age=3600',
  'Cloudflare-CDN-Cache-Control': 'max-age=3600',
}

const CACHE_HEADERS_AIRING = {
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  'CDN-Cache-Control': 'max-age=600',
  'Cloudflare-CDN-Cache-Control': 'max-age=600',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  // 1. Rate Limiting: 240 requests per minute per IP (prevents self-inflicted carousel 429s)
  const clientIp = getClientIp(req)
  const rateLimitResult = checkRateLimit(`anilist:${clientIp}`, {
    limit: 240,
    windowMs: 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult, 'Too many requests to AniList proxy.')
  }

  const { slug } = await params
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return NextResponse.json({ error: 'Invalid request path' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)

  try {
    const action = slug[0]
    const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10) || 1, 500))
    const perPage = Math.max(1, Math.min(parseInt(searchParams.get('perPage') || '20', 10) || 20, 50))

    // 1. Trending
    if (action === 'trending') {
      const data = await anilistClient.getTrendingAnime(page, perPage)
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 2. Popular
    if (action === 'popular') {
      const data = await anilistClient.getPopularAnime(page, perPage)
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 3. Top Rated
    if (action === 'top-rated') {
      const data = await anilistClient.getTopRatedAnime(page, perPage)
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 4. Currently Airing
    if (action === 'airing') {
      const data = await anilistClient.getCurrentlyAiringAnime(page, perPage)
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 5. Seasonal
    if (action === 'seasonal') {
      const rawSeason = searchParams.get('season')
      const season = rawSeason && ['WINTER', 'SPRING', 'SUMMER', 'FALL'].includes(rawSeason.toUpperCase())
        ? (rawSeason.toUpperCase() as 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL')
        : undefined
      const rawYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined
      const year = rawYear && rawYear >= 1970 && rawYear <= 2100 ? rawYear : undefined
      const data = await anilistClient.getSeasonalAnime(season, year, page, perPage)
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 6. Genre filter
    if (action === 'genre') {
      const genre = searchParams.get('genre')?.slice(0, 30) || undefined
      const sortParam = (searchParams.get('sort') || 'POPULARITY_DESC').slice(0, 50)
      const format = searchParams.get('format')?.slice(0, 20) || undefined
      const status = searchParams.get('status')?.slice(0, 20) || undefined
      const sort = sortParam.split(',').map((s) => s.trim().slice(0, 30))
      const data = await anilistClient.getAnimeByGenre({
        genre,
        page,
        perPage,
        sort,
        format,
        status,
      })
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 7. Airing Schedule for Calendar
    if (action === 'airing-schedule') {
      const now = Math.floor(Date.now() / 1000)
      const start = searchParams.get('start') ? parseInt(searchParams.get('start')!, 10) : now - 3 * 86400
      const end = searchParams.get('end') ? parseInt(searchParams.get('end')!, 10) : now + 6 * 86400
      const data = await anilistClient.getAiringSchedule(start, end, perPage || 50)
      return NextResponse.json({ schedules: data }, { headers: CACHE_HEADERS_AIRING })
    }

    // 8. Details by ID
    if (action === 'details' && slug[1]) {
      const animeId = parseInt(slug[1], 10)
      if (isNaN(animeId) || animeId <= 0) {
        return NextResponse.json({ error: 'Invalid anime ID' }, { status: 400 })
      }
      const data = await anilistClient.getAnimeDetails(animeId)
      return NextResponse.json(data, { headers: CACHE_HEADERS_STATIC })
    }

    // 9. Search
    if (action === 'search') {
      const query = (searchParams.get('query') || '').trim().slice(0, 100)
      if (!query) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
      }
      const data = await anilistClient.searchAnime(query, page, perPage)
      return NextResponse.json(data, { headers: CACHE_HEADERS_AIRING })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('[AniList API Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from anime provider' },
      { status: 500 }
    )
  }
}
