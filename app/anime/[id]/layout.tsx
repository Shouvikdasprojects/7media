import type { Metadata } from 'next'
import { anilistClient } from '@/lib/anilist/client'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const animeId = parseInt(id)

  try {
    const data = await anilistClient.getAnimeDetails(animeId)

    if (!data) {
      return {
        title: 'Watch Anime Online Free in HD',
        description: 'Stream popular and trending anime in HD on 7MEDIA.',
      }
    }

    const title = data.title.english || data.title.romaji || 'Anime'
    const native = data.title.native ? ` (${data.title.native})` : ''
    const yearStr = data.seasonYear ? ` (${data.seasonYear})` : ''
    const cover = data.coverImage?.extraLarge || data.coverImage?.large || data.bannerImage || `${siteUrl}/og-image.png`
    const genres = (data.genres || []).join(', ')

    const metaTitle = `Watch ${title}${native}${yearStr} Online Free — English Sub & Dub Anime in HD`
    const rawDesc = data.description?.replace(/<[^>]*>/g, '') || ''
    const metaDesc = rawDesc
      ? `${rawDesc.slice(0, 155)}... Stream ${title} in HD with voice actors and studios on 7MEDIA.`
      : `Stream ${title} in HD with English subtitles and dub on 7MEDIA.`

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: [title, `${title} anime`, `${title} watch online`, `${title} english sub`, `${title} episodes free`, genres],
      alternates: {
        canonical: `${siteUrl}/anime/${id}`,
      },
      openGraph: {
        title: `${metaTitle} | 7MEDIA`,
        description: metaDesc,
        url: `${siteUrl}/anime/${id}`,
        type: 'video.other',
        images: [{ url: cover, width: 800, height: 1100, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${metaTitle} | 7MEDIA`,
        description: metaDesc,
        images: [cover],
      },
    }
  } catch {
    return {
      title: 'Watch Anime Online Free in HD',
      description: 'Stream popular and trending anime in HD on 7MEDIA.',
    }
  }
}

export default async function AnimeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const animeId = parseInt(id)
  let schemaData: any = null

  try {
    const data = await anilistClient.getAnimeDetails(animeId)
    if (data) {
      const title = data.title.english || data.title.romaji || 'Anime'
      const cover = data.coverImage?.extraLarge || data.coverImage?.large || data.bannerImage || `${siteUrl}/og-image.png`
      const rawDesc = data.description?.replace(/<[^>]*>/g, '') || ''
      const genres = data.genres || []

      schemaData = {
        '@context': 'https://schema.org',
        '@type': data.format === 'MOVIE' ? 'Movie' : 'TVSeries',
        name: title,
        description: rawDesc || `Watch ${title} on 7MEDIA`,
        image: cover,
        genre: genres,
        inLanguage: 'ja',
        ...(data.averageScore
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: (data.averageScore / 10).toFixed(1),
                bestRating: '10',
                worstRating: '1',
                ratingCount: Math.max(data.popularity || 50, 10),
              },
            }
          : {}),
        potentialAction: {
          '@type': 'WatchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/anime/${id}`,
            actionPlatform: [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/MobileWebPlatform',
              'http://schema.org/AndroidPlatform',
              'http://schema.org/IOSPlatform',
            ],
          },
        },
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
