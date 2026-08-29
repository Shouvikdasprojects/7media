import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/movies`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/series`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/anime`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/my-list`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/history`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ]
}
