import type { Metadata } from 'next'
import { getMovieDetails, getShowDetails } from '@/lib/tmdb/client'
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
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : `${siteUrl}/og-image.png`

    const metaTitle = `Watch ${title}${yearStr} Full ${isMovie ? 'Movie' : 'Series'} Online Free in 4K UHD`
    const metaDesc = `Stream ${title}${yearStr} online free in 4K UHD & 1080p with multi-server playback and subtitles on 7MEDIA.`

    return {
      title: metaTitle,
      description: metaDesc,
      alternates: {
        canonical: `${siteUrl}/watch/${type}/${id}`,
      },
      openGraph: {
        title: `${metaTitle} | 7MEDIA`,
        description: metaDesc,
        url: `${siteUrl}/watch/${type}/${id}`,
        type: 'video.other',
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

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
