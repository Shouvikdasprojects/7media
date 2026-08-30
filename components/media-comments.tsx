'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import {
  getTitleComments,
  postComment,
  toggleCommentLike,
  deleteComment,
} from '@/app/actions/comments'
import {
  MessageSquare,
  Heart,
  Reply,
  Trash2,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

interface MediaCommentsProps {
  titleId: string
  mediaType: string
  titleName?: string
}

export function MediaComments({ titleId, mediaType, titleName }: MediaCommentsProps) {
  const { data: session } = useSession()

  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyIsSpoiler, setReplyIsSpoiler] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Unblurred spoilers set
  const [unblurredSpoilers, setUnblurredSpoilers] = useState<Set<string>>(new Set())

  const loadComments = async () => {
    setLoading(true)
    const res = await getTitleComments(titleId, mediaType)
    setLoading(false)
    if (res.success) {
      setComments(res.comments || [])
    }
  }

  useEffect(() => {
    if (titleId) {
      loadComments()
    }
  }, [titleId, mediaType])

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setIsSubmitting(true)
    const res = await postComment({
      titleId,
      mediaType,
      content: commentText.trim(),
      isSpoiler,
    })
    setIsSubmitting(false)

    if (res.success) {
      setCommentText('')
      setIsSpoiler(false)
      loadComments()
    } else {
      alert(res.error || 'Failed to post comment')
    }
  }

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim()) return

    setIsSubmittingReply(true)
    const res = await postComment({
      titleId,
      mediaType,
      content: replyText.trim(),
      parentId,
      isSpoiler: replyIsSpoiler,
    })
    setIsSubmittingReply(false)

    if (res.success) {
      setReplyText('')
      setReplyIsSpoiler(false)
      setReplyingToId(null)
      loadComments()
    } else {
      alert(res.error || 'Failed to post reply')
    }
  }

  const handleToggleLike = async (commentId: string) => {
    if (!session?.user) {
      alert('Please sign in to like comments!')
      return
    }

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const newLiked = !c.isLikedByMe
          return {
            ...c,
            isLikedByMe: newLiked,
            likesCount: newLiked ? c.likesCount + 1 : Math.max(c.likesCount - 1, 0),
          }
        }
        return c
      })
    )

    await toggleCommentLike(commentId)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    const res = await deleteComment(commentId)
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId))
    } else {
      alert(res.error || 'Failed to delete comment')
    }
  }

  const toggleSpoilerBlur = (commentId: string) => {
    setUnblurredSpoilers((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  // Top-level comments and nested replies map
  const topLevelComments = comments.filter((c) => !c.parentId)
  const repliesByParentId: { [key: string]: any[] } = {}
  comments.forEach((c) => {
    if (c.parentId) {
      if (!repliesByParentId[c.parentId]) repliesByParentId[c.parentId] = []
      repliesByParentId[c.parentId].push(c)
    }
  })

  return (
    <div className="rounded-3xl border border-border bg-card/60 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black font-display uppercase tracking-tight text-foreground">
              Community Discussion
            </h3>
            <p className="text-xs text-muted-foreground">
              Share thoughts, theories, and reviews with fellow viewers.
            </p>
          </div>
        </div>
        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-secondary text-foreground border border-border">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      {/* Main Comment Input */}
      {session?.user ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 mt-1">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{session.user.name?.charAt(0) || 'U'}</span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <textarea
                required
                rows={3}
                placeholder={`What did you think of ${titleName || 'this title'}? Write your review...`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-border bg-secondary/40 text-xs font-medium text-foreground outline-none focus:border-primary placeholder:text-muted-foreground leading-relaxed"
              />

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle size={13} /> Contains Spoilers
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition shadow-md shadow-primary/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Post Comment</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-xs font-bold text-foreground">Want to join the conversation?</p>
            <p className="text-[11px] text-muted-foreground">Sign in to leave reviews and react to other fans.</p>
          </div>
          <Link
            href="/sign-in"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-8 flex justify-center items-center gap-2 text-muted-foreground text-xs">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span>Loading community discussion...</span>
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-border/70 rounded-2xl">
            <Sparkles size={24} className="mx-auto text-primary/60" />
            <p className="text-xs font-bold text-foreground">Be the first to share your thoughts!</p>
            <p className="text-[11px] text-muted-foreground">No comments yet on {titleName || 'this title'}.</p>
          </div>
        ) : (
          topLevelComments.map((c) => {
            const replies = repliesByParentId[c.id] || []
            const isRevealed = unblurredSpoilers.has(c.id)

            return (
              <div key={c.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {c.userImage ? (
                        <img src={c.userImage} alt={c.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] font-bold">{c.userName?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">{c.userName || '7MEDIA Fan'}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {c.isSpoiler && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Spoiler
                    </span>
                  )}
                </div>

                {/* Content with Spoiler Blur */}
                <div className="relative">
                  {c.isSpoiler && !isRevealed ? (
                    <div
                      onClick={() => toggleSpoilerBlur(c.id)}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-500/20 transition flex items-center justify-between select-none"
                    >
                      <span className="flex items-center gap-1.5">
                        <EyeOff size={14} /> ⚠️ Warning: Spoiler content hidden
                      </span>
                      <span className="text-[10px] underline uppercase tracking-wider">Click to view</span>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {c.content}
                    </p>
                  )}
                </div>

                {/* Actions: Like, Reply, Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(c.id)}
                      className={`flex items-center gap-1.5 transition cursor-pointer select-none ${
                        c.isLikedByMe ? 'text-rose-500 font-bold' : 'hover:text-foreground'
                      }`}
                    >
                      <Heart size={14} className={c.isLikedByMe ? 'fill-rose-500' : ''} />
                      <span className="text-[11px]">{c.likesCount || 0}</span>
                    </button>

                    {session?.user && (
                      <button
                        onClick={() => setReplyingToId(replyingToId === c.id ? null : c.id)}
                        className="flex items-center gap-1 hover:text-foreground transition cursor-pointer"
                      >
                        <Reply size={13} />
                        <span className="text-[11px]">Reply</span>
                      </button>
                    )}
                  </div>

                  {c.isMyComment && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="hover:text-destructive transition p-1 cursor-pointer"
                      title="Delete your comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Reply Input Box */}
                {replyingToId === c.id && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/50 space-y-2 animate-in fade-in">
                    <textarea
                      rows={2}
                      placeholder={`Reply to ${c.userName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none focus:border-primary"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={replyIsSpoiler}
                          onChange={(e) => setReplyIsSpoiler(e.target.checked)}
                          className="h-3.5 w-3.5 rounded text-primary"
                        />
                        <span>Spoiler</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingReply || !replyText.trim()}
                          onClick={() => handlePostReply(c.id)}
                          className="px-4 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase hover:bg-primary/90 transition"
                        >
                          {isSubmittingReply ? 'Posting...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-4 sm:pl-6 border-l-2 border-border/40 space-y-3 mt-3">
                    {replies.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-card/60 border border-border/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                              {r.userImage ? (
                                <img src={r.userImage} alt={r.userName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold">{r.userName?.charAt(0) || 'U'}</span>
                              )}
                            </div>
                            <span className="font-bold text-[11px] text-foreground">{r.userName}</span>
                            <span className="text-[9px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          {r.isMyComment && (
                            <button
                              onClick={() => handleDeleteComment(r.id)}
                              className="text-muted-foreground hover:text-destructive p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
