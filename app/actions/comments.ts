'use server'

import { db } from '@/lib/db'
import { comments, commentLikes, user } from '@/lib/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

async function getSessionUser() {
  try {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({
      headers: reqHeaders,
    })
    return session?.user || null
  } catch {
    return null
  }
}

// 1. Get Comments for a Media Title (Movies, TV Shows, Anime)
export async function getTitleComments(titleId: string, mediaType: string) {
  if (!titleId) return { success: false, comments: [] }

  try {
    const currentUser = await getSessionUser()

    // Fetch all comments for this title
    const rawComments = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        titleId: comments.titleId,
        mediaType: comments.mediaType,
        parentId: comments.parentId,
        content: comments.content,
        isSpoiler: comments.isSpoiler,
        likesCount: comments.likesCount,
        createdAt: comments.createdAt,
        userName: user.name,
        userImage: user.image,
      })
      .from(comments)
      .leftJoin(user, eq(comments.userId, user.id))
      .where(and(eq(comments.titleId, titleId), eq(comments.mediaType, mediaType)))
      .orderBy(desc(comments.createdAt))

    // If user is logged in, find which comments they liked
    let userLikedCommentIds: string[] = []
    if (currentUser && rawComments.length > 0) {
      const commentIds = rawComments.map((c) => c.id)
      const likes = await db
        .select({ commentId: commentLikes.commentId })
        .from(commentLikes)
        .where(and(eq(commentLikes.userId, currentUser.id), inArray(commentLikes.commentId, commentIds)))

      userLikedCommentIds = likes.map((l) => l.commentId)
    }

    const commentsWithUserLike = rawComments.map((c) => ({
      ...c,
      isLikedByMe: userLikedCommentIds.includes(c.id),
      isMyComment: currentUser ? currentUser.id === c.userId : false,
    }))

    return { success: true, comments: commentsWithUserLike }
  } catch (err: any) {
    return { success: false, error: err?.message, comments: [] }
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shouvikdaswork@gmail.com'

// 2. Post a New Comment or Reply
export async function postComment(params: {
  titleId: string
  mediaType: string
  content: string
  parentId?: string | null
  isSpoiler?: boolean
}) {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return { success: false, error: 'Please sign in to join the discussion.' }
  }

  const { titleId, mediaType, content, parentId, isSpoiler } = params
  const trimmed = typeof content === 'string' ? content.trim() : ''
  if (!trimmed) {
    return { success: false, error: 'Comment cannot be empty.' }
  }
  if (trimmed.length > 1500) {
    return { success: false, error: 'Comment is too long (maximum 1,500 characters allowed).' }
  }

  const sanitizedContent = trimmed.replace(/[\0\x08]/g, '')

  try {
    const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    await db.insert(comments).values({
      id: commentId,
      userId: currentUser.id,
      titleId: String(titleId).slice(0, 50),
      mediaType: String(mediaType).slice(0, 20),
      parentId: parentId || null,
      content: sanitizedContent,
      isSpoiler: Boolean(isSpoiler),
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { success: true, message: 'Comment posted!' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to post comment' }
  }
}

// 3. Toggle Like on a Comment
export async function toggleCommentLike(commentId: string) {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return { success: false, error: 'Please sign in to like comments.' }
  }

  try {
    const [existing] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, currentUser.id)))
      .limit(1)

    if (existing) {
      // Remove like
      await db
        .delete(commentLikes)
        .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, currentUser.id)))

      await db
        .update(comments)
        .set({ likesCount: sql`GREATEST(${comments.likesCount} - 1, 0)` })
        .where(eq(comments.id, commentId))

      return { success: true, liked: false }
    } else {
      // Add like
      const likeId = `cl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await db.insert(commentLikes).values({
        id: likeId,
        commentId,
        userId: currentUser.id,
        createdAt: new Date(),
      })

      await db
        .update(comments)
        .set({ likesCount: sql`${comments.likesCount} + 1` })
        .where(eq(comments.id, commentId))

      return { success: true, liked: true }
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update like' }
  }
}

// 4. Delete a Comment (Author or Admin)
export async function deleteComment(commentId: string) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized' }

  try {
    const [existing] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1)
    if (!existing) return { success: false, error: 'Comment not found' }

    const isMasterAdmin =
      currentUser.email === ADMIN_EMAIL ||
      currentUser.email === '7media.support@gmail.com' ||
      (currentUser as any).role === 'admin'

    if (existing.userId !== currentUser.id && !isMasterAdmin) {
      return { success: false, error: 'Permission denied.' }
    }

    await db.delete(comments).where(eq(comments.id, commentId))
    return { success: true, message: 'Comment deleted.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete comment' }
  }
}
