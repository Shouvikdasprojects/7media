import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) & Help Center',
  description: 'Find instant answers to common questions about streaming, 4K video playback, watch parties, account security, 2FA, and PWA installation on 7MEDIA.',
  keywords: ["7media faq","streaming help","watch party guide","pwa install guide"],
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) & Help Center | 7MEDIA',
    description: 'Find instant answers to common questions about streaming, 4K video playback, watch parties, account security, 2FA, and PWA installation on 7MEDIA.',
    url: `${siteUrl}/faq`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
