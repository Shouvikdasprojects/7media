import type { Metadata } from 'next'
import { tmdbClient } from '@/lib/tmdb/client'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: 'movie' | 'tv'; id: string }>
}): Promise<Metadata> {
  const { type, id } = await params
  const isMovie = type === 'movie'

  try {
    const data: any = isMovie
      ? await tmdbClient.getMovieDetails(parseInt(id))
      : await tmdbClient.getShowDetails(parseInt(id))

    if (!data || (!data.title && !data.name)) {
      return {
        title: isMovie ? 'Watch Movie in 4K UHD' : 'Watch TV Series in 4K UHD',
      }
    }

    const title = isMovie ? data.title : data.name
    const year = (data.release_date || data.first_air_date || '').split('-')[0]
    const yearStr = year ? ` (${year})` : ''
    const poster = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : `${siteUrl}/og-image.png`
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : poster
    const genres = (data.genres || []).map((g: any) => g.name).join(', ')

    const metaTitle = `Watch ${title}${yearStr} — Full ${isMovie ? 'Movie' : 'Series'} in 4K UHD`
    const metaDesc = data.overview
      ? `${data.overview.slice(0, 155)}... Stream ${title} in 4K UHD with English & multi-language subtitles on 7MEDIA.`
      : `Stream ${title}${yearStr} in 4K UHD on 7MEDIA.`

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: [title, `${title} watch online`, `${title} full movie`, `${title} 4k`, `${title} streaming free`, genres],
      alternates: {
        canonical: `${siteUrl}/title/${type}/${id}`,
      },
      openGraph: {
        title: `${metaTitle} | 7MEDIA`,
        description: metaDesc,
        url: `${siteUrl}/title/${type}/${id}`,
        type: 'video.movie',
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
      title: isMovie ? 'Watch Movie in 4K UHD' : 'Watch TV Series in 4K UHD',
      description: 'Stream trending movies and TV series in 4K UHD on 7MEDIA.',
    }
  }
}

export default function TitleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
