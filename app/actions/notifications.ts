'use server'

import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, or, isNull, desc, and } from 'drizzle-orm'
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

// 1. Get Notifications for Current User (Broadcasts + User Specific)
export async function getUserNotifications() {
  try {
    const currentUser = await getSessionUser()

    let query
    if (currentUser) {
      query = db
        .select()
        .from(notifications)
        .where(or(eq(notifications.userId, currentUser.id), isNull(notifications.userId)))
        .orderBy(desc(notifications.createdAt))
        .limit(30)
    } else {
      // For unauthenticated users, show only global system broadcasts
      query = db
        .select()
        .from(notifications)
        .where(isNull(notifications.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(10)
    }

    const items = await query
    const unreadCount = items.filter((n) => !n.isRead).length

    return {
      success: true,
      notifications: items,
      unreadCount,
    }
  } catch (err: any) {
    return { success: false, error: err?.message, notifications: [], unreadCount: 0 }
  }
}

// 2. Mark Single Notification as Read
export async function markNotificationAsRead(id: string) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false }

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), or(eq(notifications.userId, currentUser.id), isNull(notifications.userId))))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// 3. Mark All Notifications as Read
export async function markAllNotificationsAsRead() {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false }

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(or(eq(notifications.userId, currentUser.id), isNull(notifications.userId)))

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}
