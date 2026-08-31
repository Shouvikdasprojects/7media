import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Legal & Open Data API Disclaimer',
  description: '7MEDIA legal disclaimer and copyright policies regarding TMDB & AniList open metadata catalogs.',
  keywords: ["7media disclaimer","open api policy","legal disclaimer"],
  alternates: {
    canonical: `${siteUrl}/disclaimer`,
  },
  openGraph: {
    title: 'Legal & Open Data API Disclaimer | 7MEDIA',
    description: '7MEDIA legal disclaimer and copyright policies regarding TMDB & AniList open metadata catalogs.',
    url: `${siteUrl}/disclaimer`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
