import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Database, Globe } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Privacy Policy · 7MEDIA',
  description: 'Learn how 7MEDIA respects your data privacy, local browser storage, and zero-tracking philosophy.',
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 pb-20 pt-28 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8 border-b border-border pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent mb-2">
            <ShieldCheck size={16} />
            <span>User Protection</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            We believe your entertainment habits belong to you. 7MEDIA is built with a zero invasive tracking and privacy-first architecture.
          </p>
        </div>

        {/* Legal Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <Link
            href="/terms"
            className="px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap bg-primary text-primary-foreground shadow-md"
          >
            Privacy Policy
          </Link>
          <Link
            href="/dmca"
            className="px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            DMCA Protocol
          </Link>
          <Link
            href="/disclaimer"
            className="px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Legal Disclaimer
          </Link>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Section 1 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Database size={18} className="text-accent" />
              1. Information We Collect &amp; Store
            </h2>
            <p>
              7MEDIA only processes data strictly essential for powering your cinematic experience:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 text-xs space-y-1">
                <p className="font-bold text-foreground">💾 Local Browser Storage</p>
                <p className="text-muted-foreground">
                  Recently Viewed titles, Watch History, and UI Theme preferences are stored directly on your personal device (localStorage).
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 text-xs space-y-1">
                <p className="font-bold text-foreground">🔐 Account Data (Optional)</p>
                <p className="text-muted-foreground">
                  If you sign up, your email and encrypted password or OAuth tokens are safely secured via BetterAuth &amp; PostgreSQL.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <EyeOff size={18} className="text-accent" />
              2. Zero Third-Party Ad Trackers
            </h2>
            <p>
              We do NOT sell, rent, monetize, or transmit your viewing history, search queries, or personal information to third-party ad networks, data brokers, or marketing syndicates.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe size={18} className="text-accent" />
              3. Cookies &amp; Theme Storage
            </h2>
            <p>
              We use lightweight functional cookies solely for preserving your active UI theme (<code className="text-accent">7media-theme</code>) and session authentication token.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock size={18} className="text-accent" />
              4. 1-Click Data Erasure (Right to be Forgotten)
            </h2>
            <p>
              You have complete autonomy over your data. You can instantly clear your entire watch history, recently viewed list, and reset all preferences with one click in the{' '}
              <Link href="/settings#privacy" className="text-accent underline font-bold">
                Privacy Controls
              </Link>{' '}
              section.
            </p>
          </section>
        </div>

        {/* Action Link */}
        <div className="mt-12 p-6 rounded-3xl border border-border bg-card/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-foreground">Manage your privacy preferences right now</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle history saving and reset stored data.</p>
          </div>
          <Link
            href="/settings#privacy"
            className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs uppercase tracking-wider transition active:scale-95"
          >
            Open Privacy Settings
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
