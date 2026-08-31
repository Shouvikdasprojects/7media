import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Badges, Achievements & Community Rewards',
  description: 'Earn exclusive community badges, cinema ranks, and unlock achievement rewards on 7MEDIA.',
  keywords: ["7media badges","cinema rewards","community achievements"],
  alternates: {
    canonical: `${siteUrl}/badges`,
  },
  openGraph: {
    title: 'Badges, Achievements & Community Rewards | 7MEDIA',
    description: 'Earn exclusive community badges, cinema ranks, and unlock achievement rewards on 7MEDIA.',
    url: `${siteUrl}/badges`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
