'use server'

import { db } from '@/lib/db'
import {
  globalChatMessages,
  directMessages,
  user,
} from '@/lib/db/schema'
import { eq, and, or, desc, asc, sql, inArray, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shouvikdaswork@gmail.com'

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

// 1. Get Admin User Info (for users to contact Admin Support)
export async function getAdminUserInfo() {
  try {
    const [adminUser] = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
        role: user.role,
      })
      .from(user)
      .where(or(eq(user.email, ADMIN_EMAIL), eq(user.role, 'admin')))
      .limit(1)

    if (adminUser) {
      return {
        id: adminUser.id,
        name: adminUser.name || '7MEDIA Support',
        image: adminUser.image || null,
        role: 'admin',
      }
    }

    return null
  } catch {
    return null
  }
}

// 2. Get Global Chat Messages (Latest 60)
export async function getGlobalChatMessages(limit = 60) {
  try {
    const safeLimit = Math.max(10, Math.min(limit, 100))
    const rows = await db
      .select()
      .from(globalChatMessages)
      .orderBy(desc(globalChatMessages.createdAt))
      .limit(safeLimit)

    // Return in chronological order (oldest to newest for chat box)
    const chronological = rows.reverse()

    return {
      success: true,
      messages: chronological,
    }
  } catch (err: any) {
    console.error('[Get Global Chat Error]', err)
    return { success: false, error: err?.message, messages: [] }
  }
}

// 3. Post Global Chat Message
export async function postGlobalChatMessage(params: {
  content: string
  mediaTag?: string | null
  guestName?: string
}) {
  const currentUser = await getSessionUser()
  const { content, mediaTag, guestName } = params

  const trimmed = typeof content === 'string' ? content.trim() : ''
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' }
  }
  if (trimmed.length > 1000) {
    return { success: false, error: 'Message is too long (max 1,000 characters).' }
  }

  const cleanContent = trimmed.replace(/[\0\x08]/g, '')

  let userId: string | null = null
  let userName = 'Guest Cinephile'
  let userEmail: string | null = null
  let userImage: string | null = null
  let userRole = 'user'

  if (currentUser) {
    userId = currentUser.id
    userName = currentUser.name || 'Cinephile'
    userEmail = currentUser.email || null
    userImage = currentUser.image || null

    const isAdmin =
      currentUser.email === ADMIN_EMAIL ||
      currentUser.email === '7media.support@gmail.com' ||
      (currentUser as any).role === 'admin'

    if (isAdmin) {
      userRole = 'admin'
    }
  } else {
    userName = (guestName || 'Guest').trim().slice(0, 30) || 'Guest'
  }

  try {
    const id = `gmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await db.insert(globalChatMessages).values({
      id,
      userId,
      userName,
      userEmail,
      userImage,
      userRole,
      content: cleanContent,
      mediaTag: mediaTag ? String(mediaTag).slice(0, 300) : null,
      likesCount: 0,
      createdAt: new Date(),
    })

    return { success: true, messageId: id }
  } catch (err: any) {
    console.error('[Post Global Chat Error]', err)
    return { success: false, error: err?.message || 'Failed to send message.' }
  }
}

// 4. Delete Global Chat Message (Admin or Author)
export async function deleteGlobalChatMessage(id: string) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized' }

  try {
    const [existing] = await db
      .select()
      .from(globalChatMessages)
      .where(eq(globalChatMessages.id, id))
      .limit(1)

    if (!existing) return { success: false, error: 'Message not found' }

    const isAdmin =
      currentUser.email === ADMIN_EMAIL ||
      currentUser.email === '7media.support@gmail.com' ||
      (currentUser as any).role === 'admin'

    if (existing.userId !== currentUser.id && !isAdmin) {
      return { success: false, error: 'Permission denied.' }
    }

    await db.delete(globalChatMessages).where(eq(globalChatMessages.id, id))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// 5. Get Direct Message Threads (Inbox List)
export async function getDirectMessageThreads() {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return { authenticated: false, threads: [], isAdmin: false }
  }

  const isAdmin =
    currentUser.email === ADMIN_EMAIL ||
    currentUser.email === '7media.support@gmail.com' ||
    (currentUser as any).role === 'admin'

  try {
    if (isAdmin) {
      // Admin sees conversations across all users
      const allDMs = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          content: directMessages.content,
          isRead: directMessages.isRead,
          createdAt: directMessages.createdAt,
        })
        .from(directMessages)
        .orderBy(desc(directMessages.createdAt))
        .limit(300)

      // Collect all partner user IDs
      const partnerUserIds = new Set<string>()
      for (const msg of allDMs) {
        if (msg.senderId !== currentUser.id) partnerUserIds.add(msg.senderId)
        if (msg.receiverId !== currentUser.id) partnerUserIds.add(msg.receiverId)
      }

      // Fetch user details for each partner
      const partnerList = partnerUserIds.size > 0
        ? await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            })
            .from(user)
            .where(inArray(user.id, Array.from(partnerUserIds)))
        : []

      const userMap = new Map(partnerList.map((u) => [u.id, u]))

      // Build thread summaries
      const threadMap = new Map<
        string,
        {
          partnerId: string
          partnerName: string
          partnerEmail: string
          partnerImage: string | null
          partnerRole: string
          lastMessage: string
          lastTimestamp: Date
          unreadCount: number
        }
      >()

      for (const msg of allDMs) {
        const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId
        if (!threadMap.has(partnerId)) {
          const partner = userMap.get(partnerId)
          const isUnread = msg.receiverId === currentUser.id && !msg.isRead

          threadMap.set(partnerId, {
            partnerId,
            partnerName: partner?.name || 'User ' + partnerId.slice(0, 6),
            partnerEmail: partner?.email || '',
            partnerImage: partner?.image || null,
            partnerRole: partner?.role || 'user',
            lastMessage: msg.content,
            lastTimestamp: msg.createdAt,
            unreadCount: isUnread ? 1 : 0,
          })
        } else {
          if (msg.receiverId === currentUser.id && !msg.isRead) {
            threadMap.get(partnerId)!.unreadCount += 1
          }
        }
      }

      return {
        authenticated: true,
        isAdmin: true,
        threads: Array.from(threadMap.values()),
      }
    } else {
      // Regular User: Fetch DMs where user is sender OR receiver
      const userDMs = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          content: directMessages.content,
          isRead: directMessages.isRead,
          createdAt: directMessages.createdAt,
        })
        .from(directMessages)
        .where(
          or(
            eq(directMessages.senderId, currentUser.id),
            eq(directMessages.receiverId, currentUser.id)
          )
        )
        .orderBy(desc(directMessages.createdAt))
        .limit(100)

      // Find Admin profile to include Admin Support as default thread
      const adminInfo = await getAdminUserInfo()

      const partnerUserIds = new Set<string>()
      if (adminInfo?.id) partnerUserIds.add(adminInfo.id)
      for (const msg of userDMs) {
        if (msg.senderId !== currentUser.id) partnerUserIds.add(msg.senderId)
        if (msg.receiverId !== currentUser.id) partnerUserIds.add(msg.receiverId)
      }

      const partnerList = partnerUserIds.size > 0
        ? await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            })
            .from(user)
            .where(inArray(user.id, Array.from(partnerUserIds)))
        : []

      const userMap = new Map(partnerList.map((u) => [u.id, u]))

      const threadMap = new Map<
        string,
        {
          partnerId: string
          partnerName: string
          partnerEmail: string
          partnerImage: string | null
          partnerRole: string
          lastMessage: string
          lastTimestamp: Date
          unreadCount: number
        }
      >()

      // Always ensure Admin Support thread is present for the user
      if (adminInfo?.id) {
        threadMap.set(adminInfo.id, {
          partnerId: adminInfo.id,
          partnerName: '7MEDIA Admin Support 👑',
          partnerEmail: '',
          partnerImage: adminInfo.image || null,
          partnerRole: 'admin',
          lastMessage: 'Send a direct message or feedback to Admin.',
          lastTimestamp: new Date(0),
          unreadCount: 0,
        })
      }

      for (const msg of userDMs) {
        const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId
        const partner = userMap.get(partnerId)
        const isUnread = msg.receiverId === currentUser.id && !msg.isRead

        if (!threadMap.has(partnerId)) {
          threadMap.set(partnerId, {
            partnerId,
            partnerName:
              partnerId === adminInfo?.id
                ? '7MEDIA Admin Support 👑'
                : partner?.name || 'User ' + partnerId.slice(0, 6),
            partnerEmail: partner?.email || '',
            partnerImage: partner?.image || null,
            partnerRole: partnerId === adminInfo?.id ? 'admin' : partner?.role || 'user',
            lastMessage: msg.content,
            lastTimestamp: msg.createdAt,
            unreadCount: isUnread ? 1 : 0,
          })
        } else {
          const existing = threadMap.get(partnerId)!
          if (existing.lastTimestamp.getTime() === 0) {
            existing.lastMessage = msg.content
            existing.lastTimestamp = msg.createdAt
          }
          if (isUnread) {
            existing.unreadCount += 1
          }
        }
      }

      // Sort threads by most recent
      const sorted = Array.from(threadMap.values()).sort(
        (a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime()
      )

      return {
        authenticated: true,
        isAdmin: false,
        threads: sorted,
      }
    }
  } catch (err: any) {
    console.error('[Get Direct Threads Error]', err)
    return { authenticated: true, threads: [], isAdmin, error: err?.message }
  }
}

// 6. Get Direct Messages with a Specific User
export async function getDirectMessagesWithUser(targetUserId: string) {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return { authenticated: false, messages: [], targetUser: null }
  }

  if (!targetUserId) {
    return { authenticated: true, messages: [], targetUser: null }
  }

  try {
    // 1. Fetch messages between current user and target user
    const rows = await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(eq(directMessages.senderId, currentUser.id), eq(directMessages.receiverId, targetUserId)),
          and(eq(directMessages.senderId, targetUserId), eq(directMessages.receiverId, currentUser.id))
        )
      )
      .orderBy(asc(directMessages.createdAt))
      .limit(150)

    // 2. Mark unread messages sent TO current user as read
    await db
      .update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.senderId, targetUserId),
          eq(directMessages.receiverId, currentUser.id),
          eq(directMessages.isRead, false)
        )
      )

    // 3. Fetch target user profile
    const [targetUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1)

    const isTargetAdmin =
      targetUser?.email === ADMIN_EMAIL ||
      targetUser?.email === '7media.support@gmail.com' ||
      targetUser?.role === 'admin'

    return {
      authenticated: true,
      currentUserId: currentUser.id,
      messages: rows,
      targetUser: targetUser
        ? {
            ...targetUser,
            role: isTargetAdmin ? 'admin' : targetUser.role || 'user',
          }
        : null,
    }
  } catch (err: any) {
    console.error('[Get DM Conversation Error]', err)
    return { authenticated: true, messages: [], targetUser: null, error: err?.message }
  }
}

// 7. Send Direct Message to a User or Admin
export async function sendDirectMessage(params: {
  receiverId: string
  content: string
}) {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return { success: false, error: 'Please sign in to send direct messages.' }
  }

  const { receiverId, content } = params
  if (!receiverId) {
    return { success: false, error: 'Recipient is required.' }
  }

  const trimmed = typeof content === 'string' ? content.trim() : ''
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' }
  }
  if (trimmed.length > 2000) {
    return { success: false, error: 'Message is too long (max 2,000 characters).' }
  }

  const cleanContent = trimmed.replace(/[\0\x08]/g, '')

  try {
    const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await db.insert(directMessages).values({
      id: msgId,
      senderId: currentUser.id,
      receiverId,
      content: cleanContent,
      isRead: false,
      createdAt: new Date(),
    })

    return { success: true, messageId: msgId }
  } catch (err: any) {
    console.error('[Send DM Error]', err)
    return { success: false, error: err?.message || 'Failed to send message.' }
  }
}
