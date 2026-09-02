'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Download, Share2, Sparkles, Check, Loader2, Image as ImageIcon } from 'lucide-react'

interface StoryCardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  year?: string
  rating?: string | number
  backdropUrl?: string | null
  posterUrl?: string | null
  overview?: string
  genres?: string[]
}

export function StoryCardModal({
  isOpen,
  onClose,
  title,
  year = '2026',
  rating = '8.5',
  backdropUrl,
  posterUrl,
  overview = '',
  genres = [],
}: StoryCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(true)
  const [downloaded, setDownloaded] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null)
      return
    }

    let isMounted = true
    setGenerating(true)

    const generateStoryImage = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Canvas Resolution: 1080 x 1920 (9:16 Story Format)
      canvas.width = 1080
      canvas.height = 1920

      // 1. Fill base dark gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920)
      bgGrad.addColorStop(0, '#090a0f')
      bgGrad.addColorStop(0.5, '#0d0e15')
      bgGrad.addColorStop(1, '#050608')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1080, 1920)

      // 2. Load and draw backdrop image if available
      const mainImgSrc = backdropUrl || posterUrl || '/og-image.png'
      try {
        const bgImg = new Image()
        bgImg.crossOrigin = 'anonymous'
        bgImg.src = mainImgSrc
        await new Promise((res, rej) => {
          bgImg.onload = res
          bgImg.onerror = rej
          setTimeout(res, 2000) // Fallback timeout
        })

        if (bgImg.complete && bgImg.naturalWidth > 0) {
          // Draw backdrop covering upper 65% of screen
          ctx.drawImage(bgImg, 0, 0, 1080, 1280)
        }
      } catch {}

      // 3. Dark cinematic gradient overlay on top of backdrop
      const overlay = ctx.createLinearGradient(0, 0, 0, 1920)
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
      overlay.addColorStop(0.4, 'rgba(9, 10, 15, 0.65)')
      overlay.addColorStop(0.65, 'rgba(9, 10, 15, 0.95)')
      overlay.addColorStop(1, '#050608')
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, 1080, 1920)

      // 4. Draw Brand Header Badge (Top)
      ctx.fillStyle = 'rgba(225, 29, 72, 0.15)'
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.4)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(140, 100, 800, 100, 50)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '900 36px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('7MEDIA CINEMA • 4K STREAMING', 540, 164)

      // 5. Draw Poster Frame (Middle)
      if (posterUrl) {
        try {
          const pImg = new Image()
          pImg.crossOrigin = 'anonymous'
          pImg.src = posterUrl
          await new Promise((res, rej) => {
            pImg.onload = res
            pImg.onerror = rej
            setTimeout(res, 1500)
          })

          if (pImg.complete && pImg.naturalWidth > 0) {
            // Draw Poster with rounded corners & shadow
            const pX = 260
            const pY = 280
            const pW = 560
            const pH = 840

            ctx.save()
            ctx.shadowColor = 'rgba(225, 29, 72, 0.35)'
            ctx.shadowBlur = 60
            ctx.shadowOffsetY = 20
            ctx.fillStyle = '#181920'
            ctx.beginPath()
            ctx.roundRect(pX, pY, pW, pH, 36)
            ctx.fill()
            ctx.restore()

            ctx.save()
            ctx.beginPath()
            ctx.roundRect(pX, pY, pW, pH, 36)
            ctx.clip()
            ctx.drawImage(pImg, pX, pY, pW, pH)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 4
            ctx.stroke()
            ctx.restore()
          }
        } catch {}
      }

      // 6. Draw Metadata Pills (Year & Rating)
      const pillY = 1180
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(300, pillY, 220, 70, 35)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.font = '900 32px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`★ ${rating}/10`, 410, pillY + 48)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.roundRect(560, pillY, 220, 70, 35)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${year}`, 670, pillY + 48)

      // 7. Draw Movie Title (Large & Bold)
      ctx.fillStyle = '#ffffff'
      ctx.font = '900 64px -apple-system, sans-serif'
      ctx.textAlign = 'center'

      // Title word wrapping
      const words = title.toUpperCase().split(' ')
      let line = ''
      let titleY = 1340
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > 920 && n > 0) {
          ctx.fillText(line.trim(), 540, titleY)
          line = words[n] + ' '
          titleY += 76
        } else {
          line = testLine
        }
      }
      ctx.fillText(line.trim(), 540, titleY)

      // 8. Draw Genres
      if (genres.length > 0) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '700 28px -apple-system, sans-serif'
        ctx.fillText(genres.slice(0, 3).join(' • ').toUpperCase(), 540, titleY + 60)
      }

      // 9. Draw Bottom CTA Banner
      const botY = 1680
      ctx.fillStyle = 'rgba(225, 29, 72, 0.95)'
      ctx.beginPath()
      ctx.roundRect(100, botY, 880, 130, 40)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = '900 40px -apple-system, sans-serif'
      ctx.fillText('WATCH FREE IN 4K ON 7MEDIA', 540, botY + 78)

      ctx.fillStyle = '#64748b'
      ctx.font = '600 24px -apple-system, sans-serif'
      ctx.fillText('7media.pages.dev • Zero Ads • Multi-Subtitles', 540, 1860)

      if (isMounted) {
        try {
          const dataUrl = canvas.toDataURL('image/png')
          setPreviewUrl(dataUrl)
        } catch {}
        setGenerating(false)
      }
    }

    generateStoryImage()

    return () => {
      isMounted = false
    }
  }, [isOpen, title, year, rating, backdropUrl, posterUrl])

  if (!isOpen) return null

  const handleDownload = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.download = `7media-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-story.png`
    link.href = previewUrl
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  const handleShareStory = async () => {
    if (!previewUrl) return
    if (typeof navigator !== 'undefined' && (navigator as any).share && (navigator as any).canShare) {
      try {
        const blob = await (await fetch(previewUrl)).blob()
        const file = new File([blob], `7media-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`, { type: 'image/png' })
        if ((navigator as any).canShare({ files: [file] })) {
          await navigator.share({
            title: `Watch ${title} on 7MEDIA`,
            text: `Stream ${title} in 4K UHD on 7MEDIA: https://7media.pages.dev`,
            files: [file],
          })
          return
        }
      } catch {}
    }

    // Fallback to direct download
    handleDownload()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-950 p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col items-center">
        <canvas ref={canvasRef} className="hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={11} /> 9:16 Story Card Generator
          </div>
          <h3 className="text-base font-black font-display text-white">Instagram &amp; WhatsApp Story</h3>
        </div>

        {/* Preview Container */}
        <div className="w-full aspect-[9/16] max-h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 relative flex items-center justify-center shadow-inner">
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-zinc-400 text-xs">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span>Rendering HD Story Card...</span>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Story Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-xs text-zinc-500">Failed to render preview</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={generating || !previewUrl}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {downloaded ? <Check size={14} className="text-emerald-300" /> : <Download size={14} />}
            <span>{downloaded ? 'Saved PNG!' : 'Download Image'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareStory}
            disabled={generating || !previewUrl}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Share2 size={14} />
            <span>Share Story</span>
          </button>
        </div>
      </div>
    </div>
  )
}