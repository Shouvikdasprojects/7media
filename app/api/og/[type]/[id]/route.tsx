import { ImageResponse } from 'next/og'
import { tmdbClient } from '@/lib/tmdb/client'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type: rawType, id } = await params
  const type = rawType === 'tv' ? 'tv' : 'movie'
  const data = type === 'movie' ? await tmdbClient.getMovieDetails(Number(id)) : await tmdbClient.getShowDetails(Number(id))
  const title = 'title' in data ? data.title : data.name
  return new ImageResponse(<div style={{ background: '#111318', color: '#f5f7fa', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px', width: '1200px', height: '630px', fontFamily: 'sans-serif' }}><div style={{ color: '#e11d48', fontSize: 28, fontWeight: 800, letterSpacing: 8 }}>7MEDIA</div><div style={{ fontSize: 64, fontWeight: 800, marginTop: 24 }}>{title}</div><div style={{ color: '#a7afbd', fontSize: 26, marginTop: 20 }}>{type === 'movie' ? 'Movie' : 'TV Series'} · {data.vote_average.toFixed(1)} rating</div></div>, { width: 1200, height: 630 })
}
