# 7MEDIA — Project Handoff Document

> **Purpose:** Complete state of this project so any AI assistant (or developer) can continue work without mistakes. Read this ENTIRE file before changing anything.
>
> **Last updated:** 2026-07-16

---

## 1. What This Project Is

**7MEDIA** — a free movie / TV show / anime streaming discovery web app (similar to 7reels.cc / other TMDB-based streaming frontends).

- Browse trending, popular, and genre-filtered movies & TV shows
- Search across all media
- Title detail pages with cast, seasons, episodes
- Watch pages that embed third-party video providers (vidsrc-style embeds)
- User accounts (email + password) with a personal watchlist ("My List")

**Live data source:** TMDB (The Movie Database) API — NOTHING is hardcoded; all posters, titles, ratings come from TMDB at runtime.

---

## 2. Tech Stack (do NOT deviate)

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, RSC) + React 19                 |
| Language   | TypeScript                                              |
| Styling    | Tailwind CSS v4 (tokens in `app/globals.css` `@theme`, NO tailwind.config.js) |
| UI         | shadcn/ui pattern (`components/ui/`), lucide-react icons |
| Database   | **Neon Postgres** (Vercel integration, already connected) |
| ORM        | Drizzle ORM (`drizzle-orm`) with `pg` driver            |
| Auth       | **Better Auth** (email + password ONLY — no OAuth/social) |
| Data fetch | Server Components + SWR on client (`lib/tmdb/hooks.ts`) |
| Package mgr| pnpm                                                     |

**Design system:** dark cinematic theme. Background near-black `#0a0a0b`, primary crimson red `#a4133c`, neutrals. Fonts: Geist (sans) + Geist Mono. Max 3-5 colors. NEVER use purple. All colors via semantic tokens (`bg-background`, `text-foreground`, etc.) defined in `app/globals.css`.

---

## 3. Environment Variables (CRITICAL)

All values are stored in **v0 → Settings (top right) → Vars** and synced to the Vercel project. They are auto-loaded in the sandbox via `.env.development.local` (never commit this file).

| Variable | Status | Purpose / How to get |
| -------- | ------ | -------------------- |
| `TMDB_API_KEY` | SET (user added, confirmed in project Vars) | TMDB API v3 key. Free at themoviedb.org → Settings → API. Used ONLY server-side in `lib/tmdb/client.ts` and `app/api/tmdb/`. NEVER expose client-side. |
| `BETTER_AUTH_SECRET` | SET (user added to project Vars, confirmed 2026-07-16) | Secures Better Auth sessions/cookies. If ever rotated, all users are signed out but no data is lost. |
| `DATABASE_URL` | SET (Neon integration, pooled) | Main Postgres connection used by `lib/db/index.ts` |
| `DATABASE_URL_UNPOOLED` | SET | Direct connection (for migrations) |
| `POSTGRES_URL`, `POSTGRES_*`, `PG*` | SET | Neon integration aliases — same database |
| `NEON_PROJECT_ID` | SET | Neon project reference |

**Rule for any AI:** NEVER print, log, or hardcode these values in source code. Reference them only via `process.env.X`.

---

## 4. Database Schema (Neon Postgres — ALREADY CREATED, do not recreate)

Tables live in the `public` schema. Created manually via SQL (no migration files — see "Gotchas").

### Better Auth tables (standard, camelCase quoted columns)
- **`user`** — id (text PK), name, email (unique), "emailVerified", image, "createdAt", "updatedAt"
- **`session`** — id, "expiresAt", token (unique), "userId" → user.id CASCADE, "ipAddress", "userAgent", timestamps
- **`account`** — id, "accountId", "providerId", "userId" → user.id CASCADE, password (hashed), token fields, timestamps
- **`verification`** — id, identifier, value, "expiresAt", timestamps

### App tables
- **`watchlist`** — id (serial PK), "userId" (text), "tmdbId" (int), "mediaType" ('movie'|'tv'), title, "posterPath", "backdropPath", rating, year, "createdAt". UNIQUE ("userId","tmdbId","mediaType").

**Security rule:** No RLS on Neon — EVERY query touching user data MUST filter by the session user id (see `app/actions/watchlist.ts` for the pattern). Always use parameterized queries.

---

## 5. File Map (what each file does)

```
app/
  layout.tsx                 Root layout: fonts, full SEO metadata, OG/Twitter cards,
                             JSON-LD (WebSite + SearchAction, Organization),
                             TMDB preconnects, theme-color, manifest link
  page.tsx                   Homepage: hero carousel, ranked/popular rows, genre rows
  globals.css                Tailwind v4 theme tokens (dark cinematic palette)
  manifest.ts                PWA manifest (installable app, icons, theme #a4133c)
  robots.ts                  robots.txt (blocks /api/, /my-list, /sign-in, /sign-up)
  sitemap.ts                 sitemap.xml (main browse pages)
  not-found.tsx              404 page
  movies/page.tsx            Movies browse w/ genre + sort filters
  series/page.tsx            TV browse w/ genre + sort filters
  search/page.tsx            Multi-search page
  title/[type]/[id]/page.tsx Detail page (movie|tv): overview, cast, seasons
  watch/[type]/[id]/page.tsx Player page: provider iframe embeds, episode list for TV,
                             provider switcher, safety banner
  my-list/page.tsx           Auth-protected watchlist page
  sign-in/page.tsx           Sign in (Better Auth email+password)
  sign-up/page.tsx           Sign up
  actions/watchlist.ts       Server actions: add/remove/check watchlist (userId-scoped)
  api/auth/[...all]/route.ts Better Auth handler
  api/tmdb/route.ts          TMDB proxy (keeps API key server-side)
  api/tmdb/[...slug]/route.ts TMDB proxy catch-all

components/
  navbar.tsx                 Sticky nav: logo, links, search, auth state
  hero-carousel.tsx          Auto-rotating hero with backdrop images
  movie-carousel.tsx         Horizontal scroll row
  ranked-carousel.tsx        Numbered "Top 10" style row
  media-card.tsx             Poster card w/ hover info
  browse-filter-bar.tsx      Genre/sort filter pills
  browse-grid.tsx            Infinite-ish grid for browse pages
  episode-list.tsx           Season/episode picker on watch pages
  providers-row.tsx          Video provider switcher buttons
  watchlist-button.tsx       Add/remove from list (client, calls server action)
  safety-banner.tsx          Dismissible disclaimer banner on watch pages
  auth-form.tsx              Shared sign-in/sign-up form
  footer.tsx                 Footer w/ disclaimer
  ui/button.tsx              shadcn button

lib/
  auth.ts                    Better Auth server config (pg Pool, email+password)
  auth-client.ts             Better Auth React client (useSession, signIn, signUp, signOut)
  db/index.ts                Drizzle + pg Pool (DATABASE_URL)
  db/schema.ts               Drizzle schema (mirrors DB tables above)
  site.ts                    getSiteUrl() helper for absolute URLs
  tmdb/client.ts             Server-side TMDB fetch wrapper (uses TMDB_API_KEY)
  tmdb/constants.ts          Genre lists, image base URLs, provider embed URL builders
  tmdb/hooks.ts              SWR client hooks hitting /api/tmdb proxy
  tmdb/types.ts              TMDB TypeScript types

public/
  web-app-manifest-512x512.png  PWA icon (generated "7M" crimson logo)
  og-image.png                  1200x630 social share card (generated)
```

---

## 6. Work Completed (chronological)

1. **Full app built** — all pages/components above, TMDB integration, provider embeds
2. **Neon connected** + all 5 DB tables created (auth + watchlist)
3. **Better Auth wired** — email+password, tested sign-up end-to-end (test users deleted after)
4. **`BETTER_AUTH_SECRET` generated**, `TMDB_API_KEY` added by user — app verified fully working: homepage live data, auth, watch pages all return 200
5. **SEO/PWA pass (inspired by 7reels.cc source, legit parts only):**
   - PWA manifest + generated icons → installable app
   - Open Graph + Twitter cards + generated og-image.png
   - JSON-LD: WebSite w/ SearchAction + Organization
   - robots.ts + sitemap.ts
   - Preconnect/dns-prefetch to image.tmdb.org & api.themoviedb.org
   - **Deliberately SKIPPED:** popunder ad network, ad-config system, ad domain verification (user agreed these are undesirable)

---

## 7. Next Steps / TODO (in priority order)

1. ~~Save `BETTER_AUTH_SECRET` to project Vars~~ — DONE (user added it 2026-07-16). All required env vars are now saved.
2. **Set a production site URL** — add `NEXT_PUBLIC_SITE_URL` env var once deployed so canonical URLs, OG tags, and sitemap use the real domain (currently falls back to VERCEL_URL / localhost in `lib/site.ts`)
3. **Continue Watching** feature — store playback position (new table: `progress` with userId, tmdbId, mediaType, season, episode, timestamp), show a row on homepage
4. **Watch history** page
5. **Dynamic OG images per title** — use `next/og` ImageResponse for `/title/*` pages
6. **Genre landing pages** (`/genre/[id]`) + add to sitemap
7. **Anime section** — dedicated page filtering TMDB by genre 16 + origin country JP
8. **Error/loading states polish** — add `loading.tsx` skeletons for browse/title routes
9. **Deploy to Vercel** — Publish button in v0; verify env vars carry over

---

## 8. Gotchas & Rules for Any AI Continuing This Project

- **No migration files exist.** Schema was applied with raw SQL directly to Neon. If you change schema, apply SQL directly (script or Neon MCP) AND update `lib/db/schema.ts` to match. Column names are camelCase and QUOTED in Postgres.
- **TMDB key is server-only.** Client components fetch through `/api/tmdb/*` proxy. Never call TMDB directly from the browser.
- **Auth is email+password ONLY.** Do not add OAuth/social/magic links unless the user explicitly asks.
- **Every watchlist/user query must be scoped by session userId** (no RLS). Pattern in `app/actions/watchlist.ts`.
- **Tailwind v4** — no `tailwind.config.js`; edit `@theme` in `app/globals.css`. Use semantic tokens, never raw `bg-black`/`text-white`.
- **Design rules:** dark theme, crimson `#a4133c` primary, max 5 colors, NO purple, NO gradients, no emojis as icons (lucide-react only).
- **Package manager is pnpm.** Install deps BEFORE writing code that imports them.
- **Watch embeds are third-party iframes** (built in `lib/tmdb/constants.ts`). The safety-banner component warns users; keep it.
- **Do NOT add ad networks / popunders** — explicitly rejected by user.
- **Test users:** if you create test accounts while verifying auth, DELETE them afterward (`DELETE FROM "user" WHERE email = '...'` — sessions/accounts cascade).

---

## 9. How to Run / Verify

```bash
pnpm dev                 # dev server on :3000
# verify: homepage should show live TMDB hero + rows
# verify auth: POST /api/auth/sign-up/email {email,password,name}
# verify SEO: GET /manifest.webmanifest, /robots.txt, /sitemap.xml → 200
```
