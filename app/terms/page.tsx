import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertCircle, Scale } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Terms of Service · 7MEDIA',
  description: 'Terms of Service, acceptable use policy, and user agreement for 7MEDIA platform.',
}

export default function TermsPage() {
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
        <div className="mb-10 border-b border-border pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent mb-2">
            <Scale size={16} />
            <span>Legal Framework</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Last Updated: August 2026. Please read these terms carefully before exploring or using the 7MEDIA streaming discovery ecosystem.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Section 1 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent text-xs font-black">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or utilizing 7MEDIA (“the Service”, “Platform”), you affirm that you are at least 13 years old and unconditionally agree to comply with and be bound by these Terms of Service and all applicable local, national, and international laws.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent text-xs font-black">2</span>
              Nature of the Service &amp; Media Cataloging
            </h2>
            <p>
              7MEDIA is an open-access entertainment discovery, trailer playback, cataloging, and synchronized watch party utility. 
            </p>
            <div className="p-4 rounded-2xl bg-secondary/80 border border-border/80 text-xs space-y-1.5 text-zinc-300">
              <p className="font-bold text-accent">Notice on Video Content &amp; Media Hosting:</p>
              <p>
                7MEDIA does NOT upload, store, encode, or host copyrighted media files or unauthorized live broadcasts on its infrastructure. All cinematic metadata, cast biographies, posters, and backdrops are legitimately indexed through the public APIs of The Movie Database (TMDB) and AniList.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent text-xs font-black">3</span>
              User Accounts, Watchlists, &amp; Synchronized Rooms
            </h2>
            <p>
              When creating an account or hosting a Watch Party Room, you are responsible for maintaining the confidentiality of your credentials and for all activities that take place under your session.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              <li>You agree not to disrupt, spam, or transmit malicious code in live party chat rooms.</li>
              <li>You agree not to attempt unauthorized access to restricted server databases.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent text-xs font-black">4</span>
              Intellectual Property Rights
            </h2>
            <p>
              All trademarks, movie titles, TV logos, and character designs are the exclusive property of their respective copyright holders, studios, and production networks (e.g. Netflix, Warner Bros, Disney, Sony, Toei Animation, MAPPA, etc.). 
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent text-xs font-black">5</span>
              Limitation of Liability &amp; Termination
            </h2>
            <p>
              The Service is provided on an “AS IS” and “AS AVAILABLE” basis. 7MEDIA disclaims all warranties, express or implied, regarding reliability, uptime, or availability of third-party streaming providers.
            </p>
          </section>
        </div>

        {/* Contact Strip */}
        <div className="mt-12 p-6 rounded-3xl border border-accent/30 bg-accent/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-foreground">Have questions regarding our Terms?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reach out to our compliance team anytime.</p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition hover:bg-primary/90 active:scale-95 shadow-md"
          >
            Contact Legal Team
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
