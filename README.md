<div align="center">

# 🎬 7MEDIA

**The Next-Generation Cinematic & Anime Discovery Ecosystem**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-Realtime_Chat-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![PWA](https://img.shields.io/badge/PWA-Ready-a4133c?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

</div>

---

## 🌟 Overview

**7MEDIA** is a high-performance, dark glassmorphic streaming discovery and community platform. Built with **Next.js 16 (App Router)** and **React 19**, it bridges global entertainment catalogs (TMDB & AniList) with real-time social features like synchronized watch parties, global cinema chat lounges, 1-on-1 admin support desks, and personalized user watchlist syncing.

---

## 🚀 Key Features

### 🎥 Cinema & TV Series Hub
- **4K UHD & HD Discovery:** Instant filtering by genre, release year, IMDb rating, provider (Netflix, Prime, Disney+, etc.), and spoken language.
- **Dynamic Watch Pages:** Multiple streaming providers with server switching, season/episode drawers, and episode progress tracking.
- **Smart Recommendations:** Contextual recommendations powered by TMDB open API.

### 🌸 Anime Portal & Tokyo Airing Calendar
- **AniList GraphQL Integration:** Deep anime metadata including Japanese titles, romanji, studios, voice actors, character profiles, and trailer embeds.
- **Tokyo Live Schedule:** Real-time countdowns to upcoming anime episodes airing live on Japanese TV.
- **Top Airing & Trending Grids:** Filter by seasons, genres, and all-time popularity.

### 💬 Real-Time Community & Direct Messages
- **Global Cinema Lounge:** Live multi-user chat room with quick emoji bar, spoiler filters, and movie tagging.
- **1-on-1 Direct Support:** Private messaging channel between users and verified administrators.
- **High-Speed MongoDB Atlas Driver:** Optimized document storage with connection pooling and DNS fallback.

### 👥 Synchronized Watch Party
- **Interactive Rooms:** Create or join private watch parties using 6-character room codes.
- **Synced Playback:** Host playback controls synced in real-time with member status badges.

### 🛡️ Security, Profiles & 2FA
- **Better Auth Integration:** Secure email/password authentication with PostgreSQL storage.
- **Two-Factor Authentication (2FA):** Time-sensitive email OTP verification with emergency backup recovery codes.
- **Local & Cloud Sync:** Guests enjoy 7-day auto-expiring local storage; registered users get seamless cloud database syncing.

### 🌐 Global Localization & Preferences
- **25+ International Locales:** Full multi-language support (English, Hindi, Bengali, Spanish, French, Japanese, Arabic with RTL, etc.).
- **Multiple Visual Themes:** Obsidian Dark, Midnight Neon, Sakura Velvet, and Apple Glass.
- **Quality & Bandwidth Settings:** Auto 4K/1080p preferences and network optimization.

### 📱 Progressive Web App (PWA)
- **Installable Anywhere:** Standalone desktop and mobile experience with custom shortcuts, offline fallback banners, and home-screen badges.

---

## 🛠️ Architecture & Tech Stack

```
7media/
├── app/                  # Next.js 16 App Router (Routes, API endpoints, Layouts)
│   ├── actions/          # Server Actions (Auth, Chat, Admin, Watchlist, 2FA)
│   ├── admin/            # Administrative dashboard and user management
│   ├── anime/            # Anime portal and Tokyo airing calendar
│   ├── chat/             # Global cinema lounge & 1-on-1 direct messages
│   ├── contact/          # Official support and contact desk
│   ├── movies/           # Movies discovery catalog
│   ├── party/            # Synchronized watch party rooms
│   ├── profile/          # User profile, 2FA, and security settings
│   ├── series/           # TV series and seasons catalog
│   ├── watch/            # Video streaming player and player controls
│   ├── layout.tsx        # Root layout, fonts, and Schema.org JSON-LD SEO
│   ├── sitemap.ts        # Dynamic XML sitemap generator
│   └── robots.ts         # Search engine crawler policies
├── components/           # Reusable UI & Glassmorphic Components
│   ├── auth-prompt-modal.tsx  # Custom glassmorphic authentication prompt
│   ├── custom-dialog-modal.tsx# Custom action & deletion confirmation dialog
│   ├── navbar.tsx        # Responsive navigation header
│   └── footer.tsx        # Modern comprehensive footer
├── lib/                  # Core Utilities, API Clients & Database
│   ├── anilist/          # AniList GraphQL queries and hooks
│   ├── db/               # Neon PostgreSQL Drizzle ORM schemas
│   ├── i18n/             # Multi-language translation dictionaries
│   ├── mongodb.ts        # MongoDB Atlas singleton client
│   ├── tmdb/             # TMDB REST client and custom hooks
│   └── site.ts           # Canonical URL and site metadata
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js:** `v20.x` or higher
- **npm** or **pnpm**

### 1. Clone the repository
```bash
git clone https://github.com/Shouvikdasprojects/7media.git
cd 7media
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:

```env
# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Better Auth Secret & Base URL
BETTER_AUTH_SECRET=your_auth_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Neon PostgreSQL Database
DATABASE_URL=postgresql://user:password@ep-host.aws.neon.tech/neondb?sslmode=require

# MongoDB Atlas (Chat & Direct Messages)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=7media_chat

# TMDB API
TMDB_API_KEY=your_tmdb_v3_api_key
TMDB_READ_ACCESS_TOKEN=your_tmdb_v4_read_access_token

# Email Delivery (Resend / SMTP)
RESEND_API_KEY=your_resend_api_key
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🧪 Build & Production

```bash
# Typecheck
npx tsc --noEmit

# Production Build
npm run build

# Start Production Server
npm start
```

---

## 📜 Legal & Open Data Disclaimer

7MEDIA does not host, upload, or store any video media on its servers. All metadata, imagery, and synopsis are provided via **The Movie Database (TMDB)** and **AniList GraphQL** open APIs. Video players link exclusively to third-party public embeds.

---

<div align="center">
Made with ❤️ for cinema & anime fans worldwide • © 2026 7MEDIA Inc.
</div>
