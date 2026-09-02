'use client'

import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  Download,
} from 'lucide-react'
import { StoryCardModal } from './story-card-modal'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url?: string
  overview?: string
  posterUrl?: string | null
  backdropUrl?: string | null
  year?: string
  rating?: string | number
  genres?: string[]
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  overview,
  posterUrl,
  backdropUrl,
  year,
  rating,
  genres,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [storyModalOpen, setStoryModalOpen] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Watch ${title} on 7MEDIA`,
          text: overview || `Check out ${title} on 7MEDIA!`,
          url: shareUrl,
        })
      } catch {
        // user cancelled
      }
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(`Watch "${title}" on 7MEDIA — Explore story, cast, and streaming providers:`)

  const shareLinks = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
        </svg>
      ),
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: 'bg-zinc-800 hover:bg-zinc-700 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      color: 'bg-sky-600 hover:bg-sky-500 text-white',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-blue-600 hover:bg-blue-500 text-white',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Reddit',
      href: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(title)}`,
      color: 'bg-orange-600 hover:bg-orange-500 text-white',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.334.334 0 0 0-.232-.095z" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-accent/15 text-accent border border-accent/20">
              <Share2 size={18} />
            </span>
            <div>
              <h3 className="text-xl font-bold font-display uppercase tracking-tight text-white">
                Share Title
              </h3>
              <p className="text-xs text-zinc-400">Share with friends or social media</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title Preview Badge */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/90 p-3.5 flex items-center gap-3">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={title}
              className="w-12 h-16 object-cover rounded-xl shrink-0 ring-1 ring-white/10 shadow-md"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{title}</h4>
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
              {overview || 'Watch and explore on 7MEDIA'}
            </p>
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">
            Share via
          </label>
          <div className="grid grid-cols-5 gap-2.5 text-center">
            {shareLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl ${item.color} transition-transform hover:scale-105 active:scale-95 shadow-md`}
              >
                {item.icon}
                <span className="text-[10px] font-bold truncate max-w-full">{item.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Copy Link Input */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Direct Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-xs text-zinc-300 focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : 'bg-accent hover:bg-accent/90 text-white shadow-accent/25'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 9:16 Story Card Generator CTA */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStoryModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary/20 via-pink-500/20 to-amber-500/20 hover:from-primary/30 hover:via-pink-500/30 hover:to-amber-500/30 border border-primary/30 py-3 text-xs font-black uppercase tracking-wider text-white transition active:scale-95 shadow-lg shadow-primary/10 cursor-pointer"
          >
            <Sparkles size={16} className="text-primary" />
            <span>🎨 Generate 9:16 Story Card (Instagram / WhatsApp)</span>
          </button>
        </div>

        {/* Native Mobile Share Button */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/90 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Open System Share Menu</span>
          </button>
        )}
      </div>

      {storyModalOpen && (
        <StoryCardModal
          isOpen={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
          title={title}
          year={year}
          rating={rating}
          posterUrl={posterUrl}
          backdropUrl={backdropUrl}
          overview={overview}
          genres={genres}
        />
      )}
    </div>
  )
}
