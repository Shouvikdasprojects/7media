import type { Metadata } from 'next'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb/constants'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const matched =
    MOVIE_GENRES.find((g) => String(g.id) === id) ||
    TV_GENRES.find((g) => String(g.id) === id) ||
    MOVIE_GENRES.find(
      (g) =>
        g.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        id.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
  const genreName = matched ? matched.name : 'Popular'

  const title = `Watch Trending ${genreName} Movies & TV Series in 4K UHD`
  const description = `Stream the highest rated and trending ${genreName} movies and TV shows in 4K UHD. Filter by release year, IMDb rating, and language on 7MEDIA.`

  return {
    title,
    description,
    keywords: [
      `${genreName} movies and shows`,
      `watch ${genreName} online`,
      `${genreName} streaming 4k`,
      '7media genre catalog',
    ],
    alternates: {
      canonical: `${siteUrl}/genre/${id}`,
    },
    openGraph: {
      title: `${title} | 7MEDIA`,
      description,
      url: `${siteUrl}/genre/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 7MEDIA`,
      description,
    },
  }
}

export default function UniversalGenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}