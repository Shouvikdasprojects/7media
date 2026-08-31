import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Synchronized Watch Party — Watch Movies & Anime Together Live',
  description: 'Create or join synchronized watch party rooms on 7MEDIA. Watch movies and anime together with friends in real-time sync with host playback controls.',
  keywords: ["watch party online","synchronized streaming","watch movies with friends","anime watch party"],
  alternates: {
    canonical: `${siteUrl}/party`,
  },
  openGraph: {
    title: 'Synchronized Watch Party — Watch Movies & Anime Together Live | 7MEDIA',
    description: 'Create or join synchronized watch party rooms on 7MEDIA. Watch movies and anime together with friends in real-time sync with host playback controls.',
    url: `${siteUrl}/party`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
