'use server'

import { db } from '@/lib/db'
import {
  user,
  account,
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
import { buildPremiumEmailHtml } from '@/lib/email-templates'
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
      fromName: '7MEDIA',
      subject: `Response regarding: ${msg.topic}`,
      text: `Hello ${msg.name},\n\nThank you for reaching out to 7MEDIA support regarding "${msg.topic}".\n\n${replyText}\n\nBest regards,\n7MEDIA Support Team\nsupport: 7media.support@gmail.com`,
      html: buildPremiumEmailHtml({
        badgeTitle: 'SUPPORT DESK RESPONSE',
        heading: `Regarding: ${escapeHtml(msg.topic)}`,
        recipientName: msg.name,
        message: `${escapeHtml(replyText).replace(/\n/g, '<br/>')}<br/><br/><div style="padding: 12px 16px; background-color: #0c0d11; border: 1px solid #232530; border-radius: 10px; font-size: 12px; color: #73778c;"><em>Original Inquiry: "${escapeHtml(msg.message)}"</em></div>`,
        securityTip: 'If you have further inquiries, you can reply directly or open a new ticket on 7media.pages.dev/contact.',
      }),
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

// 9. Admin Permanently Delete User Account
export async function deleteAdminUser(targetUserId: string) {
  const { isAdmin, user: adminUser } = await verifyIsAdmin()
  if (!isAdmin || !adminUser) {
    return { success: false, error: 'Unauthorized: Master Admin access required.' }
  }

  if (!targetUserId?.trim()) {
    return { success: false, error: 'User ID is required.' }
  }

  // Prevent self-deletion via admin panel
  if (targetUserId === adminUser.id) {
    return { success: false, error: 'Cannot delete your own active Master Admin account.' }
  }

  try {
    const [target] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1)

    if (!target) {
      return { success: false, error: 'User not found in database.' }
    }

    const cleanEmail = target.email?.toLowerCase().trim()
    if (cleanEmail === ADMIN_EMAIL.toLowerCase().trim() || cleanEmail === '7media.support@gmail.com') {
      return { success: false, error: 'Protected system administrator accounts cannot be deleted.' }
    }

    // Cascade delete all associated user records
    await db.delete(catalogs).where(eq(catalogs.userId, targetUserId))
    await db.delete(watchlist).where(eq(watchlist.userId, targetUserId))
    await db.delete(progress).where(eq(progress.userId, targetUserId))
    await db.delete(reactions).where(eq(reactions.userId, targetUserId))
    await db.delete(sessionTable).where(eq(sessionTable.userId, targetUserId))
    await db.delete(account).where(eq(account.userId, targetUserId))
    await db.delete(userTwoFactor).where(eq(userTwoFactor.userId, targetUserId))
    await db.delete(comments).where(eq(comments.userId, targetUserId))
    await db.delete(notifications).where(eq(notifications.userId, targetUserId))
    await db.delete(user).where(eq(user.id, targetUserId))

    return {
      success: true,
      message: `Account "${target.name || target.email}" has been permanently purged from 7MEDIA database.`,
    }
  } catch (err: any) {
    console.error('Error in deleteAdminUser:', err)
    return { success: false, error: err?.message || 'Failed to delete user account.' }
  }
}

