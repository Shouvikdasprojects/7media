import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Montserrat } from 'next/font/google'
import { getSiteUrl } from '@/lib/site'
import { AppProviders } from '@/components/app-providers'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const stencil = Montserrat({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-stencil',
  display: 'swap',
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '7MEDIA — Watch Free Movies, TV Series & Anime Online in 4K UHD',
    template: '%s | 7MEDIA',
  },
  description:
    'Stream trending movies, binge TV series, and explore the complete anime ecosystem on 7MEDIA. High-speed 4K discovery, 25+ languages, real-time community chat, watch party sync, and AniList & TMDB open catalogs.',
  applicationName: '7MEDIA',
  authors: [
    { name: 'Shouvik Das', url: 'https://shouvikdasportfolio.vercel.app/' },
    { name: '7MEDIA Team', url: siteUrl },
  ],
  creator: 'Shouvik Das',
  publisher: '7MEDIA Inc. (Shouvik Das)',
  category: 'Entertainment',
  keywords: [
    '7media',
    'movies online',
    'free movie streaming',
    'watch movies 4k',
    'watch tv shows free',
    'watch anime online',
    'anime english sub and dub',
    'anilist anime streaming',
    'tmdb trending movies 2026',
    'hindi dubbed movies online',
    'bengali cinema streaming',
    'anime airing schedule tokyo',
    'watch party synchronized streaming',
    'live movie chat community lounge',
    '4k uhd free cinema',
    'ad-free movie discovery ecosystem',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  verification: {
    google: 'google3c0b6378db7cdc4f',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: '7MEDIA',
    locale: 'en_US',
    title: '7MEDIA — Watch Free Movies, TV Shows & Anime in 4K UHD',
    description:
      'Stream trending movies, binge TV series, and explore the anime universe. 100% legal, zero bloat, live community lounge & synchronized watch parties.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '7MEDIA — Watch Free Movies, TV Shows & Anime',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '7MEDIA — Watch Free Movies, TV Shows & Anime in 4K UHD',
    description:
      'Stream trending movies, binge TV series, and explore the anime universe. 100% legal, zero bloat, live community lounge & synchronized watch parties.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '7MEDIA',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#a4133c',
  userScalable: true,
}

const jsonLdWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '7MEDIA',
  url: siteUrl,
  description: 'The premier next-generation cinema & anime discovery ecosystem. Stream movies, TV shows and anime.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '7MEDIA Inc.',
  url: siteUrl,
  logo: `${siteUrl}/web-app-manifest-512x512.png`,
  founder: {
    '@type': 'Person',
    name: 'Shouvik Das',
    url: 'https://shouvikdasportfolio.vercel.app/',
    sameAs: [
      'https://github.com/Shouvikdasprojects',
      'https://x.com/shouvikdas155',
      'https://www.instagram.com/shouvik_das_official',
      'https://heylink.me/ShouvikDas/',
    ],
  },
  sameAs: [
    'https://shouvikdasportfolio.vercel.app/',
    'https://github.com/Shouvikdasprojects',
    'https://x.com/shouvikdas155',
    'https://www.instagram.com/shouvik_das_official',
    'https://heylink.me/ShouvikDas/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: '7media.support@gmail.com',
    contactType: 'customer support',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${geist.variable} ${stencil.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Structured JSON-LD Schema.org Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;var m=document.cookie.match(/(?:^|; )7media-theme=([^;]+)/);var t=m&&decodeURIComponent(m[1]);if(t){var v=t.toLowerCase().replace(/\s+/g,'-');r.dataset.theme=v;r.classList.toggle('dark',t!=='Apple Theme');r.classList.toggle('theme-midnight',t==='Midnight');r.classList.toggle('theme-sakura',t==='Sakura');r.classList.toggle('theme-apple',t==='Apple Theme');r.style.colorScheme='dark'}var p=document.cookie.match(/(?:^|; )7media-prefs=([^;]+)/);if(p){var prefs=JSON.parse(decodeURIComponent(p[1]));if(prefs.quality)r.dataset.quality=String(prefs.quality).toLowerCase();if(prefs.language==='Arabic')r.dir='rtl'}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
      </head>
      <body className="bg-background text-foreground antialiased font-sans" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
        {Boolean(process.env.VERCEL) && <Analytics />}
      </body>
    </html>
  )
}
