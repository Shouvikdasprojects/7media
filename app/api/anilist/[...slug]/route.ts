import { anilistClient } from '@/lib/anilist/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)

  try {
    const action = slug[0]
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    // 1. Trending
    if (action === 'trending') {
      const data = await anilistClient.getTrendingAnime(page, perPage)
      return NextResponse.json(data)
    }

    // 2. Popular
    if (action === 'popular') {
      const data = await anilistClient.getPopularAnime(page, perPage)
      return NextResponse.json(data)
    }

    // 3. Top Rated
    if (action === 'top-rated') {
      const data = await anilistClient.getTopRatedAnime(page, perPage)
      return NextResponse.json(data)
    }

    // 4. Currently Airing
    if (action === 'airing') {
      const data = await anilistClient.getCurrentlyAiringAnime(page, perPage)
      return NextResponse.json(data)
    }

    // 5. Seasonal
    if (action === 'seasonal') {
      const season = searchParams.get('season') || undefined
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
      const data = await anilistClient.getSeasonalAnime(season, year, page, perPage)
      return NextResponse.json(data)
    }

    // 6. Genre filter
    if (action === 'genre') {
      const genre = searchParams.get('genre') || undefined
      const sortParam = searchParams.get('sort') || 'POPULARITY_DESC'
      const format = searchParams.get('format') || undefined
      const status = searchParams.get('status') || undefined
      const sort = sortParam.split(',')
      const data = await anilistClient.getAnimeByGenre({
        genre,
        page,
        perPage: perPage || 24,
        sort,
        format,
        status,
      })
      return NextResponse.json(data)
    }

    // 7. Airing Schedule for Calendar
    if (action === 'airing-schedule') {
      const now = Math.floor(Date.now() / 1000)
      const start = searchParams.get('start') ? parseInt(searchParams.get('start')!) : now - 3 * 86400
      const end = searchParams.get('end') ? parseInt(searchParams.get('end')!) : now + 6 * 86400
      const data = await anilistClient.getAiringSchedule(start, end, perPage || 50)
      return NextResponse.json({ schedules: data })
    }

    // 8. Details by ID
    if (action === 'details' && slug[1]) {
      const animeId = parseInt(slug[1])
      const data = await anilistClient.getAnimeDetails(animeId)
      return NextResponse.json(data)
    }

    // 9. Search
    if (action === 'search') {
      const query = searchParams.get('q') || ''
      if (!query) {
        return NextResponse.json({ pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage }, media: [] })
      }
      const data = await anilistClient.searchAnime(query, page, perPage)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Unknown AniList endpoint' }, { status: 404 })
  } catch (error: any) {
    console.error('[AniList API Route Error]', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch AniList data' },
      { status: 500 }
    )
  }
}
