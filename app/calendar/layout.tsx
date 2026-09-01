import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Tokyo Anime Airing Schedule & Live Broadcast Calendar \u2014 Today's Episodes",
  description: 'Track live Tokyo TV broadcast schedules and upcoming episode release countdowns for all currently airing anime on 7MEDIA. Updated daily with JST and local air times.',
  keywords: ["anime calendar","anime schedule","tokyo broadcast time","new anime episodes today","upcoming anime countdown","airing anime 2026"],
  alternates: {
    canonical: `${siteUrl}/calendar`,
  },
  openGraph: {
    title: "Tokyo Anime Airing Schedule & Live Broadcast Calendar \u2014 Today's Episodes | 7MEDIA",
    description: 'Track live Tokyo TV broadcast schedules and upcoming episode release countdowns for all currently airing anime on 7MEDIA. Updated daily with JST and local air times.',
    url: `${siteUrl}/calendar`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
