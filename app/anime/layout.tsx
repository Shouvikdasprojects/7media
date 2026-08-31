import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Watch Anime Online Free — English Sub & Dub, Trending Anime in HD',
  description: 'Stream popular and trending anime with English subtitles and dubs in full HD on 7MEDIA. Powered by AniList open metadata, explore characters, voice actors, and studios.',
  keywords: ["watch anime online","anime english sub","anime english dub","anime streaming free","anilist anime","stream attack on titan","demon slayer","jujutsu kaisen"],
  alternates: {
    canonical: `${siteUrl}/anime`,
  },
  openGraph: {
    title: 'Watch Anime Online Free — English Sub & Dub, Trending Anime in HD | 7MEDIA',
    description: 'Stream popular and trending anime with English subtitles and dubs in full HD on 7MEDIA. Powered by AniList open metadata, explore characters, voice actors, and studios.',
    url: `${siteUrl}/anime`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
