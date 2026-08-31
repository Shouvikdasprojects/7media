import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Watch TV Series & Shows Online Free — Stream Seasons & Episodes in 4K',
  description: 'Binge-watch trending TV series, complete seasons, and latest episodes in 4K UHD on 7MEDIA. Free streaming with multi-server playback and subtitle support.',
  keywords: ["watch tv series free","tv shows online","binge watch series","stream tv episodes","tv series 4k","netflix tv series","hbo shows free"],
  alternates: {
    canonical: `${siteUrl}/series`,
  },
  openGraph: {
    title: 'Watch TV Series & Shows Online Free — Stream Seasons & Episodes in 4K | 7MEDIA',
    description: 'Binge-watch trending TV series, complete seasons, and latest episodes in 4K UHD on 7MEDIA. Free streaming with multi-server playback and subtitle support.',
    url: `${siteUrl}/series`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
