import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Global Cinema Lounge & Community Chat — Discuss Movies & Anime',
  description: 'Join the live 7MEDIA global cinema chat lounge. Discuss trending movies, share anime recommendations, react with real-time emojis, and chat 1-on-1 with verified admins.',
  keywords: ["movie community chat","anime discussion lounge","live movie chat","cinema social network","7media community"],
  alternates: {
    canonical: `${siteUrl}/chat`,
  },
  openGraph: {
    title: 'Global Cinema Lounge & Community Chat — Discuss Movies & Anime | 7MEDIA',
    description: 'Join the live 7MEDIA global cinema chat lounge. Discuss trending movies, share anime recommendations, react with real-time emojis, and chat 1-on-1 with verified admins.',
    url: `${siteUrl}/chat`,
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
