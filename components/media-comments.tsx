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
  CheckCircle2,
  Info,
  X,
} from 'lucide-react'
import { AuthPromptModal } from '@/components/auth-prompt-modal'
import { CustomDialogModal } from '@/components/custom-dialog-modal'

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

  // Custom Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalFeature, setAuthModalFeature] = useState('Comment & Reactions')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message })
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current))
    }, 4000)
  }

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

    if (!session?.user) {
      setAuthModalFeature('Post Comment')
      setAuthModalOpen(true)
      return
    }

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
      showToast('Comment posted successfully!', 'success')
      loadComments()
    } else {
      showToast(res.error || 'Failed to post comment', 'error')
    }
  }

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim()) return

    if (!session?.user) {
      setAuthModalFeature('Reply to Comment')
      setAuthModalOpen(true)
      return
    }

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
      showToast('Reply published successfully!', 'success')
      loadComments()
    } else {
      showToast(res.error || 'Failed to post reply', 'error')
    }
  }

  const handleToggleLike = async (commentId: string) => {
    if (!session?.user) {
      setAuthModalFeature('Like Comments')
      setAuthModalOpen(true)
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
    const res = await deleteComment(commentId)
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId))
      showToast('Comment removed.', 'success')
    } else {
      showToast(res.error || 'Failed to delete comment', 'error')
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
      {/* Floating Animated Custom Toast */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[120] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-zinc-900/90 border-white/20 text-white'
            }`}
          >
            {toast.type === 'error' && <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-primary shrink-0" />}
            
            <p className="text-xs font-medium flex-1 leading-snug">{toast.message}</p>

            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Custom Auth Required Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        feature={authModalFeature}
        description="Sign in or create your free 7MEDIA account to post reviews, reply to discussions, and like comments."
      />

      {/* Custom Delete Confirmation Modal */}
      <CustomDialogModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDeleteComment(deleteConfirmId)
        }}
        type="danger"
        title="Delete Comment"
        message="Are you sure you want to delete this comment? All replies will also be removed."
        confirmText="Delete"
        cancelText="Cancel"
      />

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

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-bold text-muted-foreground">
          <span>{comments.length}</span>
          <span>{comments.length === 1 ? 'Comment' : 'Comments'}</span>
        </div>
      </div>

      {/* Main Comment Box */}
      {session?.user ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Share your review or discussion on ${titleName || 'this title'}...`}
              maxLength={1500}
              className="w-full rounded-2xl border border-border bg-secondary/50 p-4 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
            />
            <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">
              {commentText.length}/1500
            </span>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle size={13} className={isSpoiler ? 'text-amber-400' : ''} />
                Contains Spoilers
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 rounded-2xl border border-border/80 bg-secondary/30 text-center space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Join the conversation! Sign in to leave a review and join discussions.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthModalFeature('Community Reviews')
                setAuthModalOpen(true)
              }}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition cursor-pointer"
            >
              Sign In to Discuss
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-xs uppercase tracking-wider font-semibold">Loading discussions...</p>
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <MessageSquare size={36} className="mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-sm font-semibold text-foreground">No discussions yet</p>
            <p className="text-xs">Be the first to share your thoughts on this title!</p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = repliesByParentId[comment.id] || []
            const isSpoilerBlurred = comment.isSpoiler && !unblurredSpoilers.has(comment.id)
            const isMyComment = session?.user?.id === comment.userId

            return (
              <div
                key={comment.id}
                className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-secondary/20 space-y-3 transition"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                      {comment.userImage ? (
                        <img
                          src={comment.userImage}
                          alt={comment.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{comment.userName?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {comment.userName}
                        </span>
                        {comment.userRole === 'admin' && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase">
                            Admin
                          </span>
                        )}
                        {comment.isSpoiler && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-bold uppercase flex items-center gap-0.5">
                            <AlertTriangle size={9} /> Spoiler
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Delete if author or admin) */}
                  {(isMyComment || (session?.user as any)?.role === 'admin' || session?.user?.email === 'shouvikdaswork@gmail.com') && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(comment.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <div className="relative">
                  <p
                    className={`text-xs sm:text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap ${
                      isSpoilerBlurred ? 'filter blur-sm select-none' : ''
                    }`}
                  >
                    {comment.content}
                  </p>

                  {/* Spoiler Overlay */}
                  {isSpoilerBlurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => toggleSpoilerBlur(comment.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/90 hover:bg-secondary border border-border text-xs font-bold text-foreground shadow-lg transition cursor-pointer"
                      >
                        <Eye size={14} className="text-amber-400" />
                        <span>Reveal Spoiler</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment Footer (Like, Reply count, Hide spoiler toggle) */}
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(comment.id)}
                      className={`flex items-center gap-1.5 transition active:scale-125 cursor-pointer ${
                        comment.isLikedByMe
                          ? 'text-rose-500 font-bold'
                          : 'hover:text-foreground'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={comment.isLikedByMe ? 'fill-rose-500' : ''}
                      />
                      <span>{comment.likesCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setReplyingToId(replyingToId === comment.id ? null : comment.id)
                      }
                      className="flex items-center gap-1 hover:text-foreground transition cursor-pointer"
                    >
                      <Reply size={14} />
                      <span>Reply</span>
                    </button>

                    {comment.isSpoiler && !isSpoilerBlurred && (
                      <button
                        type="button"
                        onClick={() => toggleSpoilerBlur(comment.id)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <EyeOff size={12} />
                        <span>Hide spoiler</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyingToId === comment.id && (
                  <div className="pt-2 pl-4 border-l-2 border-primary/30 space-y-2.5 animate-in fade-in duration-150">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.userName}...`}
                      maxLength={1000}
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                    />

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={replyIsSpoiler}
                          onChange={(e) => setReplyIsSpoiler(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span>Spoiler</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null)
                            setReplyText('')
                          }}
                          className="px-3 py-1.5 rounded-lg hover:bg-secondary text-xs text-muted-foreground transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingReply || !replyText.trim()}
                          onClick={() => handlePostReply(comment.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingReply ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={12} />
                              <span>Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Replies Stream */}
                {replies.length > 0 && (
                  <div className="pt-2 pl-4 sm:pl-6 border-l border-border/60 space-y-3">
                    {replies.map((reply) => {
                      const isReplySpoilerBlurred =
                        reply.isSpoiler && !unblurredSpoilers.has(reply.id)
                      const isMyReply = session?.user?.id === reply.userId

                      return (
                        <div
                          key={reply.id}
                          className="p-3 rounded-xl bg-background/50 border border-border/40 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] uppercase overflow-hidden">
                                {reply.userImage ? (
                                  <img
                                    src={reply.userImage}
                                    alt={reply.userName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{reply.userName?.[0] || 'U'}</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-foreground">
                                {reply.userName}
                              </span>
                              {reply.userRole === 'admin' && (
                                <span className="px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] font-black uppercase">
                                  Admin
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            {(isMyReply || (session?.user as any)?.role === 'admin' || session?.user?.email === 'shouvikdaswork@gmail.com') && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(reply.id)}
                                className="p-1 rounded text-muted-foreground hover:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <p
                              className={`text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words ${
                                isReplySpoilerBlurred ? 'filter blur-sm select-none' : ''
                              }`}
                            >
                              {reply.content}
                            </p>
                            {isReplySpoilerBlurred && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => toggleSpoilerBlur(reply.id)}
                                  className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-bold text-foreground border border-border"
                                >
                                  Reveal Spoiler
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(reply.id)}
                              className={`flex items-center gap-1 transition ${
                                reply.isLikedByMe
                                  ? 'text-rose-500 font-bold'
                                  : 'hover:text-foreground'
                              }`}
                            >
                              <Heart
                                size={12}
                                className={reply.isLikedByMe ? 'fill-rose-500' : ''}
                              />
                              <span className="text-[11px]">{reply.likesCount}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
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
