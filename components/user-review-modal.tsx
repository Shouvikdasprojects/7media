'use client'

import { useState, useEffect } from 'react'
import { Star, X, Check, MessageSquare, ThumbsUp } from 'lucide-react'
import { useSession } from '@/lib/auth-client'

export interface UserReview {
  id: string
  userId: string
  userName: string
  userAvatar?: string | null
  tmdbId: number
  mediaType: 'movie' | 'tv'
  score: number
  title: string
  content: string
  tags: string[]
  createdAt: string
  helpfulCount: number
}

interface UserReviewModalProps {
  isOpen: boolean
  onClose: () => void
  tmdbId: number
  mediaType: 'movie' | 'tv'
  mediaTitle: string
  onReviewSubmitted?: (review: UserReview) => void
}

const TAG_OPTIONS = [
  'Masterpiece',
  'Great Cinematography',
  'Mind Bending',
  'Emotional Rollercoaster',
  'Binge-Worthy',
  'Must Watch',
  'Great Soundtrack',
  'Underrated Gem',
]

export function UserReviewModal({
  isOpen,
  onClose,
  tmdbId,
  mediaType,
  mediaTitle,
  onReviewSubmitted,
}: UserReviewModalProps) {
  const { data: session } = useSession()
  const [score, setScore] = useState(9)
  const [hoverScore, setHoverScore] = useState<number | null>(null)
  const [reviewTitle, setReviewTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    const newReview: UserReview = {
      id: `rev_${Date.now()}`,
      userId: session?.user?.id || 'guest',
      userName: session?.user?.name || 'Anonymous Cinephile',
      userAvatar: session?.user?.image,
      tmdbId,
      mediaType,
      score,
      title: reviewTitle.trim() || `${score}/10 — Exceptional Experience`,
      content: content.trim(),
      tags: selectedTags,
      createdAt: new Date().toISOString(),
      helpfulCount: 1,
    }

    try {
      const stored = localStorage.getItem(`7media_reviews_${tmdbId}`)
      const list: UserReview[] = stored ? JSON.parse(stored) : []
      list.unshift(newReview)
      localStorage.setItem(`7media_reviews_${tmdbId}`, JSON.stringify(list))
    } catch {
      // ignore
    }

    if (onReviewSubmitted) onReviewSubmitted(newReview)
    setIsSubmitting(false)
    onClose()
  }

  const activeRating = hoverScore ?? score

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Star size={18} fill="currentColor" />
            </span>
            <div>
              <h3 className="text-xl font-bold font-display uppercase tracking-tight text-white">
                Rate &amp; Review
              </h3>
              <p className="text-xs text-zinc-400">{mediaTitle}</p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
              Your Score
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const val = i + 1
                const isFilled = val <= activeRating
                return (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => setHoverScore(val)}
                    onMouseLeave={() => setHoverScore(null)}
                    onClick={() => setScore(val)}
                    className="p-1 text-zinc-600 hover:scale-125 transition-transform touch-manipulation"
                  >
                    <Star
                      size={20}
                      className={isFilled ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}
                    />
                  </button>
                )
              })}
            </div>
            <p className="text-sm font-black text-white font-display">
              <span className="text-amber-400 text-lg">{activeRating}</span> / 10
            </p>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Review Headline
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. An absolute masterpiece with stunning visuals"
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Review Body */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Detailed Thoughts
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you love about the story, acting, direction, or music?"
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
              Add Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                      active
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50"
            >
              Publish Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
