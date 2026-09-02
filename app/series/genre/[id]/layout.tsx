import type { Metadata } from 'next'
import { TV_GENRES } from '@/lib/tmdb/constants'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const matched =
    TV_GENRES.find((g) => String(g.id) === id) ||
    TV_GENRES.find(
      (g) =>
        g.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        id.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
  const genreName = matched ? matched.name : 'Popular'

  const title = `Top ${genreName} TV Shows & Series to Stream Online in HD`
  const description = `Binge-watch the best ${genreName} television series, seasons, and episodes in HD on 7MEDIA. Multi-language subtitles, trending IMDb picks, and zero bloat.`

  return {
    title,
    description,
    keywords: [
      `${genreName} tv shows`,
      `${genreName} series online`,
      `watch ${genreName} shows free`,
      `top ${genreName} seasons`,
      'binge watch tv series',
      '7media series',
    ],
    alternates: {
      canonical: `${siteUrl}/series/genre/${id}`,
    },
    openGraph: {
      title: `${title} | 7MEDIA`,
      description,
      url: `${siteUrl}/series/genre/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 7MEDIA`,
      description,
    },
  }
}

export default function SeriesGenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}