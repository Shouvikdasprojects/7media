import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Official Support Desk & Contact Us',
  description: 'Get in touch with the official 7MEDIA Support Team for inquiries, feature requests, bug reports, or partnership proposals.',
  keywords: ["7media support","contact 7media","customer support streaming"],
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: 'Official Support Desk & Contact Us | 7MEDIA',
    description: 'Get in touch with the official 7MEDIA Support Team for inquiries, feature requests, bug reports, or partnership proposals.',
    url: `${siteUrl}/contact`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
