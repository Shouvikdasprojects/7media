import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'About 7MEDIA — Next-Generation Cinema & Anime Discovery Platform',
  description: 'Learn about 7MEDIA, our mission to provide lightning-fast, visually stunning cinema and anime discovery, and lead developer Shouvik Das.',
  keywords: ["about 7media","shouvik das 7media","free streaming platform","next generation cinema discovery"],
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'About 7MEDIA — Next-Generation Cinema & Anime Discovery Platform | 7MEDIA',
    description: 'Learn about 7MEDIA, our mission to provide lightning-fast, visually stunning cinema and anime discovery, and lead developer Shouvik Das.',
    url: `${siteUrl}/about`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
