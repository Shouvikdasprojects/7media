'use server'

import { db } from '@/lib/db'
import { catalogs, reactions, watchlist } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { CatalogData, DEFAULT_USER_CATALOGS, mergeWithDefaultCatalogs } from '@/lib/catalogs-shared'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function getUserCatalogs(): Promise<{ catalogs: CatalogData[]; authenticated: boolean }> {
  const user = await getSessionUser()
  if (!user) return { catalogs: mergeWithDefaultCatalogs(), authenticated: false }

  try {
    const rows = await db
      .select()
      .from(catalogs)
      .where(eq(catalogs.userId, user.id))
      .orderBy(catalogs.id)

    const parsed: CatalogData[] = rows.map((r) => {
      let items: number[] = []
      try {
        items = JSON.parse(r.itemIds)
      } catch {
        items = []
      }
      return {
        id: r.catalogId,
        name: r.name,
        color: r.color as CatalogData['color'],
        thumbnail: r.thumbnail as CatalogData['thumbnail'],
        itemIds: items,
        custom: r.catalogId !== 'watchlist',
      }
    })

    const merged = mergeWithDefaultCatalogs(parsed)

    // If any default catalogs were not in DB, backfill them asynchronously
    if (rows.length < merged.length) {
      for (const def of merged) {
        if (!rows.some((r) => r.catalogId === def.id)) {
          await db.insert(catalogs).values({
            userId: user.id,
            catalogId: def.id,
            name: def.name,
            color: def.color,
            thumbnail: def.thumbnail || 'Folder',
            itemIds: JSON.stringify(def.itemIds || []),
          }).onConflictDoNothing().catch(() => {})
        }
      }
    }

    return { catalogs: merged, authenticated: true }
  } catch (error) {
    console.error('Error fetching user catalogs:', error)
    return { catalogs: mergeWithDefaultCatalogs(), authenticated: true }
  }
}

export async function saveUserCatalog(catalog: CatalogData) {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'unauthenticated' }

  try {
    const existing = await db
      .select()
      .from(catalogs)
      .where(and(eq(catalogs.userId, user.id), eq(catalogs.catalogId, catalog.id)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(catalogs)
        .set({
          name: catalog.name,
          color: catalog.color,
          thumbnail: catalog.thumbnail || 'Folder',
          itemIds: JSON.stringify(catalog.itemIds || []),
          updatedAt: new Date(),
        })
        .where(and(eq(catalogs.userId, user.id), eq(catalogs.catalogId, catalog.id)))
    } else {
      await db.insert(catalogs).values({
        userId: user.id,
        catalogId: catalog.id,
        name: catalog.name,
        color: catalog.color,
        thumbnail: catalog.thumbnail || 'Folder',
        itemIds: JSON.stringify(catalog.itemIds || []),
      })
    }

    revalidatePath('/my-list')
    return { success: true }
  } catch (error) {
    console.error('Error saving user catalog:', error)
    return { success: false, error: 'db_error' }
  }
}

export async function deleteUserCatalog(catalogId: string) {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'unauthenticated' }

  if (catalogId === 'watchlist') return { success: false, error: 'cannot_delete_default' }

  try {
    await db
      .delete(catalogs)
      .where(and(eq(catalogs.userId, user.id), eq(catalogs.catalogId, catalogId)))

    revalidatePath('/my-list')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user catalog:', error)
    return { success: false, error: 'db_error' }
  }
}

export async function removeFromAllCatalogs(tmdbId: number, mediaType: 'movie' | 'tv') {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'unauthenticated' }

  try {
    // 1. Remove from watchlist table
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.tmdbId, tmdbId),
          eq(watchlist.mediaType, mediaType)
        )
      )

    // 2. Remove from all catalogs
    const userCats = await db
      .select()
      .from(catalogs)
      .where(eq(catalogs.userId, user.id))

    for (const cat of userCats) {
      let ids: number[] = []
      try { ids = JSON.parse(cat.itemIds) } catch { ids = [] }
      if (ids.includes(tmdbId)) {
        const filtered = ids.filter((x) => x !== tmdbId)
        await db
          .update(catalogs)
          .set({ itemIds: JSON.stringify(filtered), updatedAt: new Date() })
          .where(eq(catalogs.id, cat.id))
      }
    }

    revalidatePath('/my-list')
    return { success: true }
  } catch (error) {
    console.error('Error removing from all catalogs:', error)
    return { success: false, error: 'db_error' }
  }
}

export async function getUserReactions(): Promise<{
  watchedIds: number[]
  likedIds: number[]
  dislikedIds: number[]
  authenticated: boolean
}> {
  const user = await getSessionUser()
  if (!user) return { watchedIds: [], likedIds: [], dislikedIds: [], authenticated: false }

  try {
    const rows = await db
      .select()
      .from(reactions)
      .where(eq(reactions.userId, user.id))

    const watchedIds: number[] = []
    const likedIds: number[] = []
    const dislikedIds: number[] = []

    for (const r of rows) {
      if (r.isWatched) watchedIds.push(r.tmdbId)
      if (r.isLiked) likedIds.push(r.tmdbId)
      if (r.isDisliked) dislikedIds.push(r.tmdbId)
    }

    return { watchedIds, likedIds, dislikedIds, authenticated: true }
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return { watchedIds: [], likedIds: [], dislikedIds: [], authenticated: true }
  }
}

export async function toggleUserReaction(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  type: 'watched' | 'liked' | 'disliked'
) {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'unauthenticated' }

  try {
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.userId, user.id),
          eq(reactions.tmdbId, tmdbId),
          eq(reactions.mediaType, mediaType)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      const current = existing[0]
      const nextValue =
        type === 'watched' ? !current.isWatched : type === 'liked' ? !current.isLiked : !current.isDisliked

      await db
        .update(reactions)
        .set({
          [type === 'watched' ? 'isWatched' : type === 'liked' ? 'isLiked' : 'isDisliked']: nextValue,
          ...(type === 'liked' && nextValue ? { isDisliked: false } : {}),
          ...(type === 'disliked' && nextValue ? { isLiked: false } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(reactions.userId, user.id),
            eq(reactions.tmdbId, tmdbId),
            eq(reactions.mediaType, mediaType)
          )
        )
    } else {
      await db.insert(reactions).values({
        userId: user.id,
        tmdbId,
        mediaType,
        isWatched: type === 'watched',
        isLiked: type === 'liked',
        isDisliked: type === 'disliked',
      })
    }

    revalidatePath('/my-list')
    return { success: true }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return { success: false, error: 'db_error' }
  }
}
