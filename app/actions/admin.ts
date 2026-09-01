'use server'

import { db } from '@/lib/db'
import {
  user,
  session as sessionTable,
  userTwoFactor,
  catalogs,
  watchlist,
  progress,
  reactions,
  contactMessages,
  comments,
  notifications,
} from '@/lib/db/schema'
import { eq, desc, sql, like, or, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shouvikdaswork@gmail.com'

// Check if currently authenticated user is Admin
export async function verifyIsAdmin() {
  try {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({
      headers: reqHeaders,
    })

    if (!session || !session.user) {
      return { isAdmin: false, user: null }
    }

    const email = session.user.email?.toLowerCase().trim()
    const isMasterAdmin =
      email === ADMIN_EMAIL.toLowerCase().trim() ||
      email === '7media.support@gmail.com' ||
      (session.user as any).role === 'admin'

    return {
      isAdmin: isMasterAdmin,
      user: session.user,
    }
  } catch (err) {
    return { isAdmin: false, user: null }
  }
}

// 1. Get High-Level Dashboard Statistics
export async function getAdminStats() {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin access required.' }
  }

  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(user)
    const [twoFactorCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTwoFactor)
      .where(eq(userTwoFactor.enabled, true))

    const [watchlistCount] = await db.select({ count: sql<number>`count(*)::int` }).from(watchlist)
    const [catalogCount] = await db.select({ count: sql<number>`count(*)::int` }).from(catalogs)
    const [commentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(comments)
    const [messagesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(contactMessages)
    const [unreadMessages] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'unread'))

    return {
      success: true,
      stats: {
        totalUsers: userCount?.count || 0,
        twoFactorActive: twoFactorCount?.count || 0,
        totalWatchlists: watchlistCount?.count || 0,
        totalCatalogs: catalogCount?.count || 0,
        totalComments: commentsCount?.count || 0,
        totalMessages: messagesCount?.count || 0,
        unreadMessages: unreadMessages?.count || 0,
      },
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch admin stats' }
  }
}

// 2. Get Users List with Search and Pagination
export async function getAdminUsersList(options?: { search?: string; limit?: number }) {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', users: [] }
  }

  const limit = options?.limit || 50
  const search = options?.search?.trim()

  try {
    let query = db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(limit)

    if (search) {
      const searchPattern = `%${search}%`
      const rawUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(or(like(user.name, searchPattern), like(user.email, searchPattern)))
        .orderBy(desc(user.createdAt))
        .limit(limit)

      const users = rawUsers.map((u) => ({
        ...u,
        role:
          u.email === 'shouvikdaswork@gmail.com' || u.email === '7media.support@gmail.com'
            ? 'admin'
            : 'user',
      }))

      return { success: true, users }
    }

    const rawUsers = await query
    const users = rawUsers.map((u) => ({
      ...u,
      role:
        u.email === 'shouvikdaswork@gmail.com' || u.email === '7media.support@gmail.com'
          ? 'admin'
          : 'user',
    }))
    return { success: true, users }
  } catch (err: any) {
    return { success: false, error: err?.message, users: [] }
  }
}

// 3. Get Contact Desk Messages
export async function getAdminContactMessages() {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', messages: [] }
  }

  try {
    const messages = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(100)

    return { success: true, messages }
  } catch (err: any) {
    return { success: false, error: err?.message, messages: [] }
  }
}

// 4. Reply to Contact Message via Nodemailer
export async function replyToContactMessage(params: { id: string; replyText: string }) {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  const { id, replyText } = params
  if (!id || !replyText?.trim()) {
    return { success: false, error: 'Message ID and reply content are required.' }
  }

  try {
    const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1)
    if (!msg) {
      return { success: false, error: 'Contact message not found.' }
    }

    // Send email to the user via 7MEDIA Mail Engine
    const emailResult = await sendEmail({
      to: msg.email,
      fromName: '7MEDIA Support Desk',
      subject: `Re: [${msg.topic}] Your 7MEDIA Support Inquiry`,
      text: `Hello ${msg.name},\n\nThank you for reaching out to 7MEDIA.\n\n${replyText}\n\nBest regards,\n7MEDIA Team\nsupport: 7media.support@gmail.com`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0d12; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; color: #f4f4f5;">
          <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">7MEDIA SUPPORT DESK</h1>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 15px; color: #a1a1aa; margin-top: 0;">Hello <strong style="color: #ffffff;">${escapeHtml(msg.name)}</strong>,</p>
            <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">Regarding your topic: <strong style="color: #fb7185;">${escapeHtml(msg.topic)}</strong></p>
            <div style="background: #18181b; border-left: 4px solid #e11d48; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #ffffff; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(replyText)}</div>
            <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">Original Inquiry: "<em>${escapeHtml(msg.message)}</em>"</p>
          </div>
          <div style="background: #121318; padding: 16px; text-align: center; border-top: 1px solid #27272a; font-size: 11px; color: #71717a;">
            7MEDIA Streaming Network • Direct Support: 7media.support@gmail.com
          </div>
        </div>
      `,
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to dispatch email reply' }
    }

    // Update database status
    await db
      .update(contactMessages)
      .set({
        status: 'replied',
        replyText,
        updatedAt: new Date(),
      })
      .where(eq(contactMessages.id, id))

    return { success: true, message: 'Reply sent successfully to ' + msg.email }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to dispatch email reply' }
  }
}

// 5. Delete Contact Message
export async function deleteContactMessage(id: string) {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { success: false, error: 'Unauthorized' }

  try {
    await db.delete(contactMessages).where(eq(contactMessages.id, id))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// 6. Broadcast System Notification
export async function sendSystemBroadcast(params: {
  title: string
  message: string
  type?: 'info' | 'release' | 'system' | 'social'
  link?: string
}) {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { success: false, error: 'Unauthorized' }

  const { title, message, type = 'system', link } = params
  if (!title?.trim() || !message?.trim()) {
    return { success: false, error: 'Title and message are required' }
  }

  try {
    const notifId = `broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await db.insert(notifications).values({
      id: notifId,
      userId: null, // Null = Global Broadcast to all users
      title: title.trim(),
      message: message.trim(),
      type,
      link: link?.trim() || null,
      isRead: false,
      createdAt: new Date(),
    })

    return { success: true, message: 'Broadcast notification published successfully!' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to publish notification' }
  }
}

// 7. Get Recent Comments for Global Moderation
export async function getAdminRecentComments(limit = 50) {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { success: false, error: 'Unauthorized', comments: [] }

  try {
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
        userEmail: user.email,
        userImage: user.image,
      })
      .from(comments)
      .leftJoin(user, eq(comments.userId, user.id))
      .orderBy(desc(comments.createdAt))
      .limit(limit)

    return { success: true, comments: rawComments }
  } catch (err: any) {
    return { success: false, error: err?.message, comments: [] }
  }
}

// 8. Admin Delete Any Comment
export async function deleteAdminComment(commentId: string) {
  const { isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { success: false, error: 'Unauthorized' }

  try {
    await db.delete(comments).where(or(eq(comments.id, commentId), eq(comments.parentId, commentId)))
    return { success: true, message: 'Comment and its replies removed.' }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}
