import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '7MEDIA — Cinema, Series & Anime Discovery',
    short_name: '7MEDIA',
    description:
      'The premier next-generation cinema & anime discovery ecosystem. Stream trending movies, explore anime schedules, and enjoy watch parties.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0a0a0b',
    theme_color: '#a4133c',
    categories: ['entertainment', 'movies', 'video', 'news', 'lifestyle'],
    shortcuts: [
      {
        name: 'Explore Movies',
        short_name: 'Movies',
        description: 'Browse top trending & 4K movies',
        url: '/movies',
        icons: [{ src: '/web-app-manifest-512x512.png', sizes: '512x512' }],
      },
      {
        name: 'Anime Hub',
        short_name: 'Anime',
        description: 'Browse popular anime & Tokyo schedule',
        url: '/anime',
        icons: [{ src: '/web-app-manifest-512x512.png', sizes: '512x512' }],
      },
      {
        name: 'Global Chat Lounge',
        short_name: 'Community',
        description: 'Join real-time cinema chat & discussions',
        url: '/chat',
        icons: [{ src: '/web-app-manifest-512x512.png', sizes: '512x512' }],
      },
    ],
    icons: [
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
