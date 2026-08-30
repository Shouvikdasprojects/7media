'use server'

import { db } from '@/lib/db'
import { watchlist } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { and, eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export interface WatchlistInput {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath?: string | null
  rating?: string | null
}

export async function addToWatchlist(input: WatchlistInput) {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'auth' as const }

  try {
    await db
      .insert(watchlist)
      .values({
        userId: user.id,
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
        title: input.title,
        posterPath: input.posterPath ?? null,
        rating: input.rating ?? null,
      })
      .onConflictDoNothing()
    revalidatePath('/my-list')
    return { success: true }
  } catch {
    return { success: false, error: 'db' as const }
  }
}

export async function removeFromWatchlist(tmdbId: number, mediaType: 'movie' | 'tv') {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'auth' as const }

  try {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.tmdbId, tmdbId),
          eq(watchlist.mediaType, mediaType)
        )
      )
    revalidatePath('/my-list')
    return { success: true }
  } catch {
    return { success: false, error: 'db' as const }
  }
}

export async function getWatchlist() {
  const user = await getSessionUser()
  if (!user) return { items: [], authenticated: false }

  const items = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.userId, user.id))
    .orderBy(desc(watchlist.createdAt))

  return { items, authenticated: true }
}

export async function isInWatchlist(tmdbId: number, mediaType: 'movie' | 'tv') {
  const user = await getSessionUser()
  if (!user) return false

  const rows = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, user.id),
        eq(watchlist.tmdbId, tmdbId),
        eq(watchlist.mediaType, mediaType)
      )
    )
    .limit(1)

  return rows.length > 0
}

export async function syncGuestWatchlist(guestItems: WatchlistInput[]) {
  const user = await getSessionUser()
  if (!user || !Array.isArray(guestItems) || guestItems.length === 0) {
    return { success: false }
  }

  try {
    for (const item of guestItems) {
      if (item && item.tmdbId) {
        await db
          .insert(watchlist)
          .values({
            userId: user.id,
            tmdbId: item.tmdbId,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterPath ?? null,
            rating: item.rating ?? null,
          })
          .onConflictDoNothing()
      }
    }
    revalidatePath('/my-list')
    return { success: true }
  } catch {
    return { success: false }
  }
}
