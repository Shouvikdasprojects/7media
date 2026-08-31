import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Terms of Service & Usage Guidelines',
  description: 'Read 7MEDIA\'s Terms of Service and guidelines governing platform usage, community interactions, and open metadata discovery.',
  keywords: ["7media terms of service","user agreement","streaming terms"],
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    title: 'Terms of Service & Usage Guidelines | 7MEDIA',
    description: 'Read 7MEDIA\'s Terms of Service and guidelines governing platform usage, community interactions, and open metadata discovery.',
    url: `${siteUrl}/terms`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
