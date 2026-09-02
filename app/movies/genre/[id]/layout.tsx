import type { Metadata } from 'next'
import { MOVIE_GENRES } from '@/lib/tmdb/constants'
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
    MOVIE_GENRES.find(
      (g) =>
        g.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        id.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
  const genreName = matched ? matched.name : 'Popular'

  const title = `Best ${genreName} Movies to Watch Online in 4K UHD`
  const description = `Stream the highest rated and trending ${genreName} movies in 4K UHD and 1080p HD. Filter by IMDb rating, release year, language and subtitles on 7MEDIA.`

  return {
    title,
    description,
    keywords: [
      `${genreName} movies`,
      `watch ${genreName} movies online`,
      `best ${genreName} films 4k`,
      `top ${genreName} cinema`,
      'stream movies free',
      '7media cinema',
    ],
    alternates: {
      canonical: `${siteUrl}/movies/genre/${id}`,
    },
    openGraph: {
      title: `${title} | 7MEDIA`,
      description,
      url: `${siteUrl}/movies/genre/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 7MEDIA`,
      description,
    },
  }
}

export default function MovieGenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}