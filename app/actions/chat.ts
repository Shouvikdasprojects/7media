'use server'

import { db } from '@/lib/db'
import {
  globalChatMessages as pgGlobalChatMessages,
  directMessages as pgDirectMessages,
  user as pgUser,
} from '@/lib/db/schema'
import { eq, and, or, desc, asc, sql, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getChatDatabase, isMongoConfigured } from '@/lib/mongodb'

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
        id: pgUser.id,
        name: pgUser.name,
        image: pgUser.image,
        email: pgUser.email,
        role: pgUser.role,
      })
      .from(pgUser)
      .where(or(eq(pgUser.email, ADMIN_EMAIL), eq(pgUser.role, 'admin')))
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

// 2. Get Global Chat Messages (Latest 70)
export async function getGlobalChatMessages(limit = 70) {
  const safeLimit = Math.max(10, Math.min(limit, 100))

  // --- MONGODB ATLAS IMPLEMENTATION ---
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getChatDatabase()
      if (mongoDb) {
        const col = mongoDb.collection('global_chat_messages')
        const docs = await col
          .find({})
          .sort({ createdAt: -1 })
          .limit(safeLimit)
          .toArray()

        const messages = docs.map((d: any) => ({
          id: d.id || d._id.toString(),
          userId: d.userId || null,
          userName: d.userName || 'Cinephile',
          userEmail: d.userEmail || null,
          userImage: d.userImage || null,
          userRole: d.userRole || 'user',
          content: d.content || '',
          mediaTag: d.mediaTag || null,
          likesCount: d.likesCount || 0,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        })).reverse()

        return {
          success: true,
          storage: 'mongodb' as const,
          messages,
        }
      }
    } catch (mongoErr) {
      console.error('[MongoDB Global Chat Read Error]', mongoErr)
    }
  }

  // --- POSTGRESQL FALLBACK ---
  try {
    const rows = await db
      .select()
      .from(pgGlobalChatMessages)
      .orderBy(desc(pgGlobalChatMessages.createdAt))
      .limit(safeLimit)

    return {
      success: true,
      storage: 'postgres' as const,
      messages: rows.reverse(),
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

  const messageId = `gmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date()

  // --- MONGODB ATLAS INSERT ---
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getChatDatabase()
      if (mongoDb) {
        const col = mongoDb.collection('global_chat_messages')
        await col.insertOne({
          id: messageId,
          userId,
          userName,
          userEmail,
          userImage,
          userRole,
          content: cleanContent,
          mediaTag: mediaTag ? String(mediaTag).slice(0, 300) : null,
          likesCount: 0,
          createdAt: now,
        })

        return { success: true, messageId, storage: 'mongodb' }
      }
    } catch (mongoErr: any) {
      console.error('[MongoDB Global Chat Write Error]', mongoErr)
    }
  }

  // --- POSTGRESQL INSERT ---
  try {
    await db.insert(pgGlobalChatMessages).values({
      id: messageId,
      userId,
      userName,
      userEmail,
      userImage,
      userRole,
      content: cleanContent,
      mediaTag: mediaTag ? String(mediaTag).slice(0, 300) : null,
      likesCount: 0,
      createdAt: now,
    })

    return { success: true, messageId, storage: 'postgres' }
  } catch (err: any) {
    console.error('[Post Global Chat Error]', err)
    return { success: false, error: err?.message || 'Failed to send message.' }
  }
}

// 4. Delete Global Chat Message (Admin or Author)
export async function deleteGlobalChatMessage(id: string) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized' }

  const isAdmin =
    currentUser.email === ADMIN_EMAIL ||
    currentUser.email === '7media.support@gmail.com' ||
    (currentUser as any).role === 'admin'

  // --- MONGODB ATLAS DELETE ---
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getChatDatabase()
      if (mongoDb) {
        const col = mongoDb.collection('global_chat_messages')
        const filter = isAdmin ? { id } : { id, userId: currentUser.id }
        await col.deleteOne(filter)
        return { success: true, storage: 'mongodb' }
      }
    } catch (mongoErr) {
      console.error('[MongoDB Delete Error]', mongoErr)
    }
  }

  // --- POSTGRESQL DELETE ---
  try {
    const [existing] = await db
      .select()
      .from(pgGlobalChatMessages)
      .where(eq(pgGlobalChatMessages.id, id))
      .limit(1)

    if (!existing) return { success: false, error: 'Message not found' }

    if (existing.userId !== currentUser.id && !isAdmin) {
      return { success: false, error: 'Permission denied.' }
    }

    await db.delete(pgGlobalChatMessages).where(eq(pgGlobalChatMessages.id, id))
    return { success: true, storage: 'postgres' }
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

  // --- MONGODB ATLAS DIRECT THREADS ---
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getChatDatabase()
      if (mongoDb) {
        const col = mongoDb.collection('direct_messages')
        let allDMs: any[] = []

        if (isAdmin) {
          allDMs = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray()
        } else {
          allDMs = await col
            .find({
              $or: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
            })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray()
        }

        const partnerUserIds = new Set<string>()
        const adminInfo = await getAdminUserInfo()
        if (!isAdmin && adminInfo?.id) partnerUserIds.add(adminInfo.id)

        for (const msg of allDMs) {
          if (msg.senderId !== currentUser.id) partnerUserIds.add(msg.senderId)
          if (msg.receiverId !== currentUser.id) partnerUserIds.add(msg.receiverId)
        }

        const partnerList = partnerUserIds.size > 0
          ? await db
              .select({
                id: pgUser.id,
                name: pgUser.name,
                email: pgUser.email,
                image: pgUser.image,
                role: pgUser.role,
              })
              .from(pgUser)
              .where(inArray(pgUser.id, Array.from(partnerUserIds)))
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

        if (!isAdmin && adminInfo?.id) {
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

        for (const msg of allDMs) {
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
              lastTimestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
              unreadCount: isUnread ? 1 : 0,
            })
          } else {
            const existing = threadMap.get(partnerId)!
            if (existing.lastTimestamp.getTime() === 0) {
              existing.lastMessage = msg.content
              existing.lastTimestamp = msg.createdAt ? new Date(msg.createdAt) : new Date()
            }
            if (isUnread) {
              existing.unreadCount += 1
            }
          }
        }

        const sorted = Array.from(threadMap.values()).sort(
          (a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime()
        )

        return {
          authenticated: true,
          isAdmin,
          storage: 'mongodb' as const,
          threads: sorted,
        }
      }
    } catch (mongoErr) {
      console.error('[MongoDB DM Threads Error]', mongoErr)
    }
  }

  // --- POSTGRESQL DIRECT THREADS ---
  try {
    if (isAdmin) {
      const allDMs = await db
        .select({
          id: pgDirectMessages.id,
          senderId: pgDirectMessages.senderId,
          receiverId: pgDirectMessages.receiverId,
          content: pgDirectMessages.content,
          isRead: pgDirectMessages.isRead,
          createdAt: pgDirectMessages.createdAt,
        })
        .from(pgDirectMessages)
        .orderBy(desc(pgDirectMessages.createdAt))
        .limit(300)

      const partnerUserIds = new Set<string>()
      for (const msg of allDMs) {
        if (msg.senderId !== currentUser.id) partnerUserIds.add(msg.senderId)
        if (msg.receiverId !== currentUser.id) partnerUserIds.add(msg.receiverId)
      }

      const partnerList = partnerUserIds.size > 0
        ? await db
            .select({
              id: pgUser.id,
              name: pgUser.name,
              email: pgUser.email,
              image: pgUser.image,
              role: pgUser.role,
            })
            .from(pgUser)
            .where(inArray(pgUser.id, Array.from(partnerUserIds)))
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
        storage: 'postgres' as const,
        threads: Array.from(threadMap.values()),
      }
    } else {
      const userDMs = await db
        .select({
          id: pgDirectMessages.id,
          senderId: pgDirectMessages.senderId,
          receiverId: pgDirectMessages.receiverId,
          content: pgDirectMessages.content,
          isRead: pgDirectMessages.isRead,
          createdAt: pgDirectMessages.createdAt,
        })
        .from(pgDirectMessages)
        .where(
          or(
            eq(pgDirectMessages.senderId, currentUser.id),
            eq(pgDirectMessages.receiverId, currentUser.id)
          )
        )
        .orderBy(desc(pgDirectMessages.createdAt))
        .limit(100)

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
              id: pgUser.id,
              name: pgUser.name,
              email: pgUser.email,
              image: pgUser.image,
              role: pgUser.role,
            })
            .from(pgUser)
            .where(inArray(pgUser.id, Array.from(partnerUserIds)))
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

      const sorted = Array.from(threadMap.values()).sort(
        (a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime()
      )

      return {
        authenticated: true,
        isAdmin: false,
        storage: 'postgres' as const,
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

  // --- MONGODB ATLAS DM CONVERSATION ---
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getChatDatabase()
      if (mongoDb) {
        const col = mongoDb.collection('direct_messages')
        const docs = await col
          .find({
            $or: [
              { senderId: currentUser.id, receiverId: targetUserId },
              { senderId: targetUserId, receiverId: currentUser.id },
            ],
          })
          .sort({ createdAt: 1 })
          .limit(200)
          .toArray()

        // Mark incoming messages as read
        await col.updateMany(
          { senderId: targetUserId, receiverId: currentUser.id, isRead: false },
          { $set: { isRead: true } }
        )

        // Fetch target user from PostgreSQL
        const [targetUser] = await db
          .select({
            id: pgUser.id,
            name: pgUser.name,
            email: pgUser.email,
            image: pgUser.image,
            role: pgUser.role,
          })
          .from(pgUser)
          .where(eq(pgUser.id, targetUserId))
          .limit(1)

        const isTargetAdmin =
          targetUser?.email === ADMIN_EMAIL ||
          targetUser?.email === '7media.support@gmail.com' ||
          targetUser?.role === 'admin'

        const messages = docs.map((d: any) => ({
          id: d.id || d._id.toString(),
          senderId: d.senderId,
          receiverId: d.receiverId,
          content: d.content,
          isRead: Boolean(d.isRead),
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        }))

        return {
          authenticated: true,
          currentUserId: currentUser.id,
          storage: 'mongodb' as const,
          messages,
          targetUser: targetUser
            ? {
                ...targetUser,
                role: isTargetAdmin ? 'admin' : targetUser.role || 'user',
              }
            : null,
        }
      }
    } catch (mongoErr) {
      console.error('[MongoDB DM Fetch Error]', mongoErr)
    }
  }

  // --- POSTGRESQL DM CONVERSATION ---
  try {
    const rows = await db
      .select()
      .from(pgDirectMessages)
      .where(
        or(
          and(eq(pgDirectMessages.senderId, currentUser.id), eq(pgDirectMessages.receiverId, targetUserId)),
          and(eq(pgDirectMessages.senderId, targetUserId), eq(pgDirectMessages.receiverId, currentUser.id))
        )
      )
      .orderBy(asc(pgDirectMessages.createdAt))
      .limit(150)

    await db
      .update(pgDirectMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(pgDirectMessages.senderId, targetUserId),
          eq(pgDirectMessages.receiverId, currentUser.id),
          eq(pgDirectMessages.isRead, false)
        )
      )

    const [targetUser] = await db
      .select({
        id: pgUser.id,
        name: pgUser.name,
        email: pgUser.email,
        image: pgUser.image,
        role: pgUser.role,
      })
      .from(pgUser)
      .where(eq(pgUser.id, targetUserId))
      .limit(1)

    const isTargetAdmin =
      targetUser?.email === ADMIN_EMAIL ||
      targetUser?.email === '7media.support@gmail.com' ||
      targetUser?.role === 'admin'

    return {
      authenticated: true,
      currentUserId: currentUser.id,
      storage: 'postgres' as const,
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
  const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date()

  // --- MONGODB ATLAS INSERT ---
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getChatDatabase()
      if (mongoDb) {
        const col = mongoDb.collection('direct_messages')
        await col.insertOne({
          id: msgId,
          senderId: currentUser.id,
          receiverId,
          content: cleanContent,
          isRead: false,
          createdAt: now,
        })

        return { success: true, messageId: msgId, storage: 'mongodb' }
      }
    } catch (mongoErr) {
      console.error('[MongoDB Send DM Error]', mongoErr)
    }
  }

  // --- POSTGRESQL INSERT ---
  try {
    await db.insert(pgDirectMessages).values({
      id: msgId,
      senderId: currentUser.id,
      receiverId,
      content: cleanContent,
      isRead: false,
      createdAt: now,
    })

    return { success: true, messageId: msgId, storage: 'postgres' }
  } catch (err: any) {
    console.error('[Send DM Error]', err)
    return { success: false, error: err?.message || 'Failed to send message.' }
  }
}
