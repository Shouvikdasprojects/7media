'use client'

import { useState, useEffect, useRef } from 'react'
import { Music, Play, Pause, ExternalLink, Disc, Radio, Volume2, Sparkles, Loader2 } from 'lucide-react'

interface RealTrack {
  id: number
  title: string
  artist: string
  duration: string
  previewUrl: string | null
  artworkUrl: string | null
  appleMusicUrl: string
}

interface SoundtrackSectionProps {
  mediaTitle: string
  mediaType: 'movie' | 'tv' | 'anime'
}

export function SoundtrackSection({ mediaTitle, mediaType }: SoundtrackSectionProps) {
  const [tracks, setTracks] = useState<RealTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTrackId, setActiveTrackId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)

    const searchTerm = `${mediaTitle} soundtrack`
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=6`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        if (data.results && data.results.length > 0) {
          const parsed: RealTrack[] = data.results.map((item: any) => {
            const totalSec = Math.floor((item.trackTimeMillis || 180000) / 1000)
            const mins = Math.floor(totalSec / 60)
            const secs = String(totalSec % 60).padStart(2, '0')
            return {
              id: item.trackId,
              title: item.trackName,
              artist: item.artistName,
              duration: `${mins}:${secs}`,
              previewUrl: item.previewUrl || null,
              artworkUrl: item.artworkUrl100 || null,
              appleMusicUrl: item.trackViewUrl || `https://music.apple.com/search?term=${encodeURIComponent(mediaTitle)}`,
            }
          })
          setTracks(parsed)
        } else {
          setTracks([])
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error loading real soundtrack:', err)
        if (active) {
          setTracks([])
          setIsLoading(false)
        }
      })

    return () => {
      active = false
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [mediaTitle])

  const toggleTrack = (track: RealTrack) => {
    if (!track.previewUrl) return

    if (activeTrackId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setActiveTrackId(track.id)
      setIsPlaying(true)
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    }
  }

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(mediaTitle + ' soundtrack')}`
  const appleMusicSearchUrl = `https://music.apple.com/search?term=${encodeURIComponent(mediaTitle + ' soundtrack')}`

  // If loading, show clean loader; if no real tracks exist for this title, return null (NO dummy/fake data)
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-8 md:px-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span>Searching official soundtrack and audio previews...</span>
        </div>
      </section>
    )
  }

  if (tracks.length === 0) {
    return null // Zero dummy data
  }

  return (
    <section className="mx-auto max-w-7xl border-t border-border px-4 py-10 md:px-8">
      {/* Hidden audio element for real playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-primary/15 text-primary border border-primary/25">
            <Music size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground md:text-2xl flex items-center gap-2">
              <span>Official Soundtrack &amp; Score</span>
              <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                Live Preview
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stream original motion picture score and opening/ending themes
            </p>
          </div>
        </div>

        {/* Real Streaming Provider Links */}
        <div className="flex items-center gap-2.5">
          <a
            href={spotifySearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-2xl bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] border border-[#1DB954]/30 px-3.5 py-2 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Disc size={14} className="animate-spin" />
            <span>Spotify</span>
            <ExternalLink size={12} />
          </a>
          <a
            href={appleMusicSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-2xl bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 text-[#FC3C44] border border-[#FC3C44]/30 px-3.5 py-2 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Radio size={14} />
            <span>Apple Music</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Real Tracklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tracks.map((track, idx) => {
          const isCurrentActive = activeTrackId === track.id
          return (
            <div
              key={track.id}
              onClick={() => toggleTrack(track)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                isCurrentActive && isPlaying
                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                  : 'border-white/10 bg-card/70 hover:bg-card hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Artwork or Number */}
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 flex items-center justify-center border border-white/10">
                  {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                  )}
                  {track.previewUrl && (
                    <div
                      className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                        isCurrentActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrentActive && isPlaying ? (
                        <Pause size={14} className="text-white" />
                      ) : (
                        <Play size={14} className="text-white fill-white ml-0.5" />
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold truncate transition-colors ${
                      isCurrentActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    }`}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-3 flex-shrink-0">
                {isCurrentActive && isPlaying && (
                  <div className="flex items-center gap-0.5 text-primary">
                    <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-primary rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150" />
                  </div>
                )}
                <span className="text-xs font-mono text-muted-foreground">{track.duration}</span>
                <a
                  href={track.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                  title="Open on Apple Music"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
