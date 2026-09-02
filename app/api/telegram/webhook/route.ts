import { NextRequest, NextResponse } from 'next/server'
import { tmdbClient } from '@/lib/tmdb/client'
import { anilistClient } from '@/lib/anilist/client'
import { getSiteUrl } from '@/lib/site'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const siteUrl = getSiteUrl()

async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: replyMarkup,
      }),
    })
  } catch (err) {
    console.error('Telegram sendMessage error:', err)
  }
}

async function sendTelegramPhoto(chatId: number | string, photoUrl: string, caption: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    })
  } catch (err) {
    console.error('Telegram sendPhoto error:', err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    // 1. Handle Direct Message
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id
      const text = update.message.text.trim()

      if (text === '/start' || text === '/help') {
        const welcomeText = `🍿 <b>Welcome to 7MEDIA Telegram Gateway!</b>\n\nStream thousands of movies, TV series, and anime in 4K UHD with multi-language subtitles for free.\n\n🔍 <b>How to Search:</b>\n• Type <code>/search &lt;movie name&gt;</code> (e.g. <code>/search Interstellar</code>)\n• Or just type any movie or anime name directly!\n• Use inline mode in any chat: <code>@SevenMediaBot Batman</code>\n\n🌐 <b>Web App:</b> ${siteUrl}`
        await sendTelegramMessage(chatId, welcomeText, {
          inline_keyboard: [
            [
              { text: '🎬 Open 7MEDIA Web App', url: siteUrl },
              { text: '⚡ Anime Portal', url: `${siteUrl}/anime` },
            ],
            [
              { text: '💬 Global Cinema Lounge', url: `${siteUrl}/chat` },
            ],
          ],
        })
        return NextResponse.json({ ok: true })
      }

      // Perform Search
      const query = text.replace(/^\/search\s*/i, '').trim()
      if (!query) {
        await sendTelegramMessage(chatId, 'Please enter a movie or anime name to search, e.g. <code>/search Demon Slayer</code>')
        return NextResponse.json({ ok: true })
      }

      const [tmdbRes, anilistRes] = await Promise.all([
        tmdbClient.searchMulti(query).catch(() => ({ results: [] })),
        anilistClient.searchAnime(query, 1, 3).catch(() => ({ media: [] })),
      ])

      const tmdbItems = (tmdbRes.results || []).slice(0, 3)
      const animeItems = (anilistRes.media || []).slice(0, 2)

      if (tmdbItems.length === 0 && animeItems.length === 0) {
        await sendTelegramMessage(chatId, `❌ No results found for "<b>${query}</b>". Try searching with a different title.`)
        return NextResponse.json({ ok: true })
      }

      // Send Movie / Series results
      for (const item of tmdbItems) {
        const raw: any = item
        const isMovie = raw.media_type === 'movie' || (!raw.media_type && raw.title)
        const title = isMovie ? raw.title : raw.name
        const year = (raw.release_date || raw.first_air_date || '').split('-')[0] || '2026'
        const rating = raw.vote_average ? `⭐ <b>${raw.vote_average.toFixed(1)}/10 IMDb</b>` : '⭐ <b>Top Rated</b>'
        const overview = raw.overview ? `${raw.overview.slice(0, 140)}...` : 'Watch free in 4K UHD on 7MEDIA.'
        const poster = raw.poster_path ? `https://image.tmdb.org/t/p/w500${raw.poster_path}` : `${siteUrl}/og-image.png`
        const watchUrl = `${siteUrl}/watch/${isMovie ? 'movie' : 'tv'}/${raw.id}`
        const infoUrl = `${siteUrl}/title/${isMovie ? 'movie' : 'tv'}/${raw.id}`

        const caption = `🎬 <b>${title} (${year})</b>\n${rating}\n\n${overview}`
        await sendTelegramPhoto(chatId, poster, caption, {
          inline_keyboard: [
            [
              { text: '▶️ Stream in 4K UHD', url: watchUrl },
              { text: 'ℹ️ Details & Trailer', url: infoUrl },
            ],
          ],
        })
      }

      // Send Anime results
      for (const anime of animeItems) {
        const title = anime.title?.english || anime.title?.romaji || 'Anime'
        const rating = anime.averageScore ? `⭐ <b>${(anime.averageScore / 10).toFixed(1)}/10 AniList</b>` : '⭐ <b>Popular</b>'
        const poster = anime.coverImage?.extraLarge || anime.coverImage?.large || `${siteUrl}/og-image.png`
        const watchUrl = `${siteUrl}/anime/${anime.id}`

        const caption = `⚡ <b>${title}</b>\n${rating}\n\nStream in HD with English subtitles & dubs on 7MEDIA.`
        await sendTelegramPhoto(chatId, poster, caption, {
          inline_keyboard: [
            [
              { text: '▶️ Watch Anime in HD', url: watchUrl },
            ],
          ],
        })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: '7MEDIA Telegram Gateway',
    status: 'operational',
    webhookConfigured: Boolean(TELEGRAM_BOT_TOKEN),
    info: 'Send POST updates from Telegram Bot API to this endpoint.',
  })
}