'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { progress } from '@/lib/db/schema'

export interface ProgressInput {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  season?: number | null
  episode?: number | null
  timestamp: number
  duration?: number | null
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function saveProgress(input: ProgressInput) {
  const userId = await getUserId()
  if (!userId || !Number.isFinite(input.timestamp) || input.timestamp < 0) {
    return { success: false, error: 'invalid' as const }
  }

  try {
    await db
      .insert(progress)
      .values({
        userId,
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
        title: input.title,
        posterPath: input.posterPath ?? null,
        backdropPath: input.backdropPath ?? null,
        season: input.season ?? null,
        episode: input.episode ?? null,
        timestamp: Math.floor(input.timestamp),
        duration: input.duration ? Math.floor(input.duration) : null,
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.tmdbId, progress.mediaType, progress.season, progress.episode],
        set: {
          timestamp: Math.floor(input.timestamp),
          duration: input.duration ? Math.floor(input.duration) : null,
          title: input.title,
          posterPath: input.posterPath ?? null,
          backdropPath: input.backdropPath ?? null,
          updatedAt: new Date(),
        },
      })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'db' as const }
  }
}

export async function getProgress() {
  const userId = await getUserId()
  if (!userId) return []

  return db
    .select()
    .from(progress)
    .where(eq(progress.userId, userId))
    .orderBy(desc(progress.updatedAt))
    .limit(12)
}

export async function removeProgress(id: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'auth' as const }

  await db.delete(progress).where(and(eq(progress.id, id), eq(progress.userId, userId)))
  revalidatePath('/')
  return { success: true }
}

export async function clearProgress() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'auth' as const }

  await db.delete(progress).where(eq(progress.userId, userId))
  revalidatePath('/')
  return { success: true }
}

export async function getProgressItem(tmdbId: number, mediaType: 'movie' | 'tv') {
  const userId = await getUserId()
  if (!userId) return null

  const rows = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.tmdbId, tmdbId), eq(progress.mediaType, mediaType)))
    .orderBy(desc(progress.updatedAt))
    .limit(1)

  return rows[0] ?? null
}
