import type { Metadata } from 'next'
import { getMovieDetails, getShowDetails } from '@/lib/tmdb/client'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}): Promise<Metadata> {
  const { type, id } = await params
  const isMovie = type === 'movie'

  try {
    const data: any = isMovie
      ? await getMovieDetails(parseInt(id))
      : await getShowDetails(parseInt(id))

    if (!data || (!data.title && !data.name)) {
      return {
        title: isMovie ? 'Stream Movie in 4K UHD' : 'Stream TV Series in 4K UHD',
      }
    }

    const title = isMovie ? data.title : data.name
    const year = (data.release_date || data.first_air_date || '').split('-')[0]
    const yearStr = year ? ` (${year})` : ''
    const poster = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : `${siteUrl}/og-image.png`
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : poster
    const genres = (data.genres || []).map((g: any) => g.name).join(', ')

    const metaTitle = `Watch ${title}${yearStr} Full ${isMovie ? 'Movie' : 'Series'} Online Free in 4K UHD`
    const metaDesc = `Stream ${title}${yearStr} online free in 4K UHD & 1080p with multi-server playback and subtitles on 7MEDIA.`

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: [
        title,
        `watch ${title} free`,
        `stream ${title} online`,
        `${title} full hd`,
        `${title} multi server`,
        genres,
      ],
      alternates: {
        canonical: `${siteUrl}/watch/${type}/${id}`,
      },
      openGraph: {
        title: `${metaTitle} | 7MEDIA`,
        description: metaDesc,
        url: `${siteUrl}/watch/${type}/${id}`,
        type: isMovie ? 'video.movie' : 'video.tv_show',
        images: [{ url: backdrop, width: 1280, height: 720, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${metaTitle} | 7MEDIA`,
        description: metaDesc,
        images: [backdrop],
      },
    }
  } catch {
    return {
      title: isMovie ? 'Stream Movie in 4K UHD' : 'Stream TV Series in 4K UHD',
      description: 'Stream trending movies and TV series online in 4K UHD on 7MEDIA.',
    }
  }
}

export default async function WatchLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = await params
  const isMovie = type === 'movie'
  let schemaData: any = null

  try {
    const data: any = isMovie
      ? await getMovieDetails(parseInt(id))
      : await getShowDetails(parseInt(id))

    if (data && (data.title || data.name)) {
      const title = isMovie ? data.title : data.name
      const releaseDate = data.release_date || data.first_air_date
      const poster = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : `${siteUrl}/og-image.png`
      const genres = (data.genres || []).map((g: any) => g.name)

      schemaData = {
        '@context': 'https://schema.org',
        '@type': isMovie ? 'Movie' : 'TVSeries',
        name: title,
        description: data.overview || `Watch ${title} on 7MEDIA`,
        image: poster,
        datePublished: releaseDate,
        genre: genres,
        inLanguage: 'en',
        ...(data.vote_average
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(data.vote_average).toFixed(1),
                bestRating: '10',
                worstRating: '1',
                ratingCount: Math.max(data.vote_count || 10, 10),
              },
            }
          : {}),
      }
    }
  } catch {}

  return (
    <>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      {children}
    </>
  )
}
