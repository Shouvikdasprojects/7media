import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listName = decodeURIComponent(id.replace(/-/g, ' ')).replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())

  return {
    title: `${listName} — Curated Cinema & Anime Playlist | 7MEDIA`,
    description: `Explore the "${listName}" curated collection on 7MEDIA. Stream in 4K UHD with multi-language subtitles or save to your personal watchlist in 1-click.`,
    keywords: [listName, 'custom watchlist', 'top 10 movies', 'anime collection', '7media playlists'],
    alternates: {
      canonical: `${siteUrl}/list/${id}`,
    },
    openGraph: {
      title: `${listName} — Curated Cinema & Anime Collection | 7MEDIA`,
      description: `Stream the "${listName}" playlist in 4K UHD or clone to your library on 7MEDIA.`,
      url: `${siteUrl}/list/${id}`,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listName} — Curated Playlist | 7MEDIA`,
      description: `Stream the "${listName}" playlist on 7MEDIA.`,
    },
  }
}

export default function SharedListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
