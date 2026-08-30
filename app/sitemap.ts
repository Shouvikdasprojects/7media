import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  return [
    // Primary Entertainment Hubs
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/movies`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/series`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/anime`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/calendar`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },

    // Community & Social
    { url: `${base}/chat`, lastModified: now, changeFrequency: 'hourly', priority: 0.85 },
    { url: `${base}/party`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/badges`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },

    // Information & Support
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Legal & Policies
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/dmca`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
