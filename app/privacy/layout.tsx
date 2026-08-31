import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection',
  description: 'Learn how 7MEDIA protects user privacy, secures authentication data with 2FA, and respects your rights.',
  keywords: ["7media privacy policy","data security","user privacy"],
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy & Data Protection | 7MEDIA',
    description: 'Learn how 7MEDIA protects user privacy, secures authentication data with 2FA, and respects your rights.',
    url: `${siteUrl}/privacy`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
