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
    default: 'Watch Free Movies, TV Shows & Anime Online | 7MEDIA',
    template: '%s | 7MEDIA',
  },
  description:
    "Discover trending movies, TV shows, and anime on 7MEDIA. Browse by genre, provider, language and country, create your personal watchlist, and explore what's popular this week.",
  generator: 'v0.app',
  applicationName: '7MEDIA',
  keywords: ['movies', 'tv shows', 'anime', 'streaming', 'watchlist', 'trending'],
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
    title: '7MEDIA — Stream Free Movies, TV Shows & Anime',
    description:
      'Discover and save your favorite movies and TV shows. Browse by genre, provider, language and country.',
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
    title: '7MEDIA — Stream Free Movies, TV Shows & Anime',
    description:
      'Discover and save your favorite movies and TV shows. Browse by genre, provider, language and country.',
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
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
