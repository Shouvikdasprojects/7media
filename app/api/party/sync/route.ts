import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

interface PartyRoomState {
  code: string
  isPlaying: boolean
  currentTime: number
  lastUpdated: number
  host: string
  participants: Map<string, { name: string; lastSeen: number; avatar?: string }>
  messages: Array<{ id: string; user: string; text: string; time: string; isHost?: boolean }>
  reactions: Array<{ id: number; emoji: string; user: string; timestamp: number }>
}

// Global In-Memory Room Store with size limits
const MAX_GLOBAL_ROOMS = 500
const globalRooms = new Map<string, PartyRoomState>()

// Validation Constants
const ROOM_CODE_REGEX = /^[A-Za-z0-9_-]{1,30}$/
const ALLOWED_TYPES = new Set(['PLAY_STATE', 'CHAT', 'REACTION'])

function sanitizeString(str: string, maxLen = 100): string {
  return str.replace(/[\r\n\t\0\x08]/g, ' ').trim().slice(0, maxLen)
}

function pruneStaleRooms() {
  const now = Date.now()
  for (const [code, room] of globalRooms.entries()) {
    // If no activity for 2 hours and 0 participants, delete room
    if (now - room.lastUpdated > 2 * 60 * 60 * 1000 && room.participants.size === 0) {
      globalRooms.delete(code)
    }
  }
}

function getOrCreateRoom(code: string, hostName = 'Host'): PartyRoomState {
  const upper = code.toUpperCase()
  if (!globalRooms.has(upper)) {
    if (globalRooms.size >= MAX_GLOBAL_ROOMS) {
      pruneStaleRooms()
      if (globalRooms.size >= MAX_GLOBAL_ROOMS) {
        // Evict oldest room
        const oldestKey = globalRooms.keys().next().value
        if (oldestKey) globalRooms.delete(oldestKey)
      }
    }

    const safeHost = sanitizeString(hostName, 50) || 'Host'
    globalRooms.set(upper, {
      code: upper,
      isPlaying: true,
      currentTime: 0,
      lastUpdated: Date.now(),
      host: safeHost,
      participants: new Map(),
      messages: [
        {
          id: `welcome_${Date.now()}`,
          user: '7MEDIA Cinema Bot',
          text: `🍿 Room ${upper} is active! Multi-device sync is live.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      reactions: [],
    })
  }
  return globalRooms.get(upper)!
}

// GET: Heartbeat & Fetch Latest Delta
export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req)

  // Rate Limiting: 30 polls per 10 seconds per IP
  const rateLimitResult = checkRateLimit(`party_get:${clientIp}`, {
    limit: 30,
    windowMs: 10 * 1000,
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult, 'Polling rate limit exceeded.')
  }

  const { searchParams } = new URL(req.url)
  const rawCode = searchParams.get('code')
  if (!rawCode || !ROOM_CODE_REGEX.test(rawCode)) {
    return NextResponse.json({ error: 'Valid room code required (alphanumeric, max 30 chars).' }, { status: 400 })
  }

  const code = rawCode.toUpperCase()
  const rawUser = searchParams.get('user') || 'Guest Cinephile'
  const userName = sanitizeString(rawUser, 50) || 'Guest Cinephile'
  const since = Math.max(0, parseInt(searchParams.get('since') || '0', 10) || 0)

  const room = getOrCreateRoom(code, userName)
  const now = Date.now()

  // Update participant heartbeat
  room.participants.set(userName, { name: userName, lastSeen: now })

  // Prune users inactive for > 20 seconds
  for (const [name, p] of room.participants.entries()) {
    if (now - p.lastSeen > 20000) {
      room.participants.delete(name)
    }
  }

  // Host Succession: If current host disconnected, promote next active participant
  if (!room.participants.has(room.host) && room.participants.size > 0) {
    const nextHost = room.participants.keys().next().value
    if (nextHost) {
      const oldHost = room.host
      room.host = nextHost
      room.messages.push({
        id: `msg_${now}_sys`,
        user: '7MEDIA Cinema Bot',
        text: `👑 Host (${oldHost}) left. ${nextHost} is now the Room Host!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHost: false,
      })
      if (room.messages.length > 50) room.messages.shift()
    }
  }

  // Prune reactions older than 10 seconds
  room.reactions = room.reactions.filter((r) => now - r.timestamp < 10000)

  // Active participants list (max 50 to prevent huge payloads)
  const activeParticipants = Array.from(room.participants.values())
    .map((p) => p.name)
    .slice(0, 50)

  // Return new messages & reactions since last poll
  const newMessages = room.messages.filter((m) => {
    const msgTime = parseInt(m.id.split('_')[1] || '0', 10)
    return msgTime > since
  })

  const newReactions = room.reactions.filter((r) => r.timestamp > since)

  return NextResponse.json({
    code: room.code,
    isPlaying: room.isPlaying,
    currentTime: room.currentTime,
    host: room.host,
    participantCount: Math.max(activeParticipants.length, 1),
    participants: activeParticipants,
    messages: newMessages.length > 0 ? newMessages : since === 0 ? room.messages : [],
    reactions: newReactions,
    serverTime: now,
  })
}

// POST: Broadcast Play State / Chat / Reaction
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)

  // Rate Limiting: Max 10 broadcast events per 5 seconds per IP
  const rateLimitResult = checkRateLimit(`party_post:${clientIp}`, {
    limit: 10,
    windowMs: 5 * 1000,
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult, 'Too many room events. Please slow down your messages.')
  }

  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const { code: rawCode, type, user: rawUser, payload } = body || {}

    // Validation checks
    if (!rawCode || typeof rawCode !== 'string' || !ROOM_CODE_REGEX.test(rawCode)) {
      return NextResponse.json(
        { error: 'Valid room code required (alphanumeric, max 30 chars).' },
        { status: 400 }
      )
    }

    if (!type || typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid event type.' }, { status: 400 })
    }

    const code = rawCode.toUpperCase()
    const user = sanitizeString(typeof rawUser === 'string' ? rawUser : 'Guest', 50) || 'Guest'
    const room = getOrCreateRoom(code, user)
    const now = Date.now()
    room.lastUpdated = now

    if (type === 'PLAY_STATE') {
      if (typeof payload?.isPlaying === 'boolean') {
        room.isPlaying = payload.isPlaying
      }
      if (
        typeof payload?.currentTime === 'number' &&
        Number.isFinite(payload.currentTime) &&
        payload.currentTime >= 0 &&
        payload.currentTime <= 86400
      ) {
        room.currentTime = Math.floor(payload.currentTime * 100) / 100
      }
    } else if (type === 'CHAT') {
      if (typeof payload?.text === 'string') {
        const cleanText = sanitizeString(payload.text, 500)
        if (cleanText.length > 0) {
          const newMsg = {
            id: `msg_${now}_${Math.random().toString(36).slice(2, 6)}`,
            user,
            text: cleanText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isHost: Boolean(payload?.isHost),
          }
          room.messages.push(newMsg)
          // Keep max 50 messages in memory
          if (room.messages.length > 50) room.messages.shift()
        }
      }
    } else if (type === 'REACTION') {
      if (typeof payload?.emoji === 'string') {
        const cleanEmoji = sanitizeString(payload.emoji, 10)
        if (cleanEmoji.length > 0) {
          room.reactions.push({
            id: now + Math.random(),
            emoji: cleanEmoji,
            user,
            timestamp: now,
          })
          // Keep max 30 reactions in memory
          if (room.reactions.length > 30) room.reactions.shift()
        }
      }
    }

    return NextResponse.json({ success: true, serverTime: now })
  } catch (err: any) {
    console.error('[Party Sync Internal Error]', err)
    return NextResponse.json({ error: 'Failed to sync room event.' }, { status: 500 })
  }
}
