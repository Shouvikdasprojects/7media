import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Watch Free Movies Online in 4K UHD — Stream Trending & Top IMDb Films',
  description: 'Explore and stream thousands of 4K UHD & HD movies on 7MEDIA. Filter by IMDb rating, genre, release year, streaming provider, and language with multi-language subtitles.',
  keywords: ["watch movies online","free movies 4k","stream movies free","hd movies 2026","top rated imdb movies","action movies","hindi dubbed movies","bengali movies"],
  alternates: {
    canonical: `${siteUrl}/movies`,
  },
  openGraph: {
    title: 'Watch Free Movies Online in 4K UHD — Stream Trending & Top IMDb Films | 7MEDIA',
    description: 'Explore and stream thousands of 4K UHD & HD movies on 7MEDIA. Filter by IMDb rating, genre, release year, streaming provider, and language with multi-language subtitles.',
    url: `${siteUrl}/movies`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
