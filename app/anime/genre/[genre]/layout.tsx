import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>
}): Promise<Metadata> {
  const { genre } = await params
  const decodedGenre = decodeURIComponent(genre)
  const formattedGenre = decodedGenre.charAt(0).toUpperCase() + decodedGenre.slice(1)

  const title = `Watch Popular ${formattedGenre} Anime Series & Movies Online Free`
  const description = `Discover and stream trending ${formattedGenre} anime shows, OVAs, and movies in HD with English subtitles and dubbing on 7MEDIA. Powered by AniList.`

  return {
    title,
    description,
    keywords: [
      `${formattedGenre} anime`,
      `watch ${formattedGenre} anime online`,
      `${formattedGenre} anime english sub`,
      `${formattedGenre} anime dub`,
      'stream anime free',
      'anilist 7media',
    ],
    alternates: {
      canonical: `${siteUrl}/anime/genre/${genre}`,
    },
    openGraph: {
      title: `${title} | 7MEDIA`,
      description,
      url: `${siteUrl}/anime/genre/${genre}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 7MEDIA`,
      description,
    },
  }
}

export default function AnimeGenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}