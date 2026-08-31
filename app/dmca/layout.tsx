import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'DMCA & Copyright Compliance Policy',
  description: '7MEDIA DMCA copyright infringement notice and digital rights compliance policy.',
  keywords: ["7media dmca","copyright policy","content takedown"],
  alternates: {
    canonical: `${siteUrl}/dmca`,
  },
  openGraph: {
    title: 'DMCA & Copyright Compliance Policy | 7MEDIA',
    description: '7MEDIA DMCA copyright infringement notice and digital rights compliance policy.',
    url: `${siteUrl}/dmca`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
