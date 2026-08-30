import Link from 'next/link'
import { ArrowLeft, Scale, ShieldAlert, CheckCircle2, FileText, Mail, ExternalLink, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Legal Disclaimer · 7MEDIA',
  description: 'Official legal disclaimer, third-party content policies, trademark disclosures, and non-hosting declaration for 7MEDIA platform.',
}

export default function DisclaimerPage() {
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
            <Scale size={16} />
            <span>Compliance &amp; Disclaimers</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Legal Disclaimer
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Important regulatory disclosures, safe-harbor protections, trademark acknowledgments, and operational boundaries of the 7MEDIA ecosystem.
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
            className="px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
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
            className="px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap bg-primary text-primary-foreground shadow-md"
          >
            Legal Disclaimer
          </Link>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Section 1: Non-Hosting Statement */}
          <section className="p-6 sm:p-8 rounded-3xl border border-border bg-card/60 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <ShieldAlert size={20} className="text-accent" />
              1. Non-Hosting &amp; Open Indexing Declaration
            </h2>
            <p>
              <strong>7MEDIA</strong> operates strictly as an advanced, programmatic entertainment metadata discovery engine and cinema aggregator. 
            </p>
            <div className="p-5 rounded-2xl bg-secondary/70 border border-border text-xs space-y-2 text-zinc-300">
              <p className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" /> Key Technical Assurances:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground pl-1">
                <li>7MEDIA does NOT own, manage, encode, upload, or host copyrighted multimedia video or audio streams on its servers.</li>
                <li>All media synopsis data, release schedules, poster graphics, cast biographies, and episodic lists are queried dynamically from the open public APIs of <strong>The Movie Database (TMDB)</strong> and <strong>AniList</strong>.</li>
                <li>All official trailers are delivered directly via YouTube’s official embedded iframe player in compliance with YouTube API Terms of Service.</li>
                <li>Third-party stream providers linked or indexed within the application operate completely autonomously under their own respective server architectures and jurisdictions.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Intellectual Property & Trademarks */}
          <section className="p-6 sm:p-8 rounded-3xl border border-border bg-card/60 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <Sparkles size={20} className="text-amber-400" />
              2. Intellectual Property &amp; Trademarks
            </h2>
            <p>
              All trademarks, studio logos, character likenesses, franchise titles, and copyrighted materials displayed across 7MEDIA belong exclusively to their respective copyright holders, production studios, and licensing entities (including but not limited to Netflix, Warner Bros. Discovery, The Walt Disney Company, Sony Pictures, Paramount, Universal Pictures, Toei Animation, MAPPA, Ufotable, and Wit Studio).
            </p>
            <p className="text-xs text-muted-foreground">
              Reference to any specific commercial product, process, studio, or service by trade name, trademark, or manufacturer does not constitute or imply its endorsement, sponsorship, or recommendation by 7MEDIA or its developers.
            </p>
          </section>

          {/* Section 3: Safe Harbor & Copyright Compliance */}
          <section className="p-6 sm:p-8 rounded-3xl border border-border bg-card/60 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <FileText size={20} className="text-cyan-400" />
              3. DMCA &amp; Safe Harbor Provisions
            </h2>
            <p>
              7MEDIA complies fully with the <strong>Digital Millennium Copyright Act (17 U.S.C. § 512)</strong> and the European Union E-Commerce Directive (2000/31/EC). In our capacity as an information indexing intermediary:
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We respond promptly to valid, formal takedown notices submitted by certified rights holders. If any index reference or thumbnail on 7MEDIA is found to infringe upon your copyrighted material, please submit a verified notification through our DMCA protocol page.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/dmca"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition hover:bg-primary/90 active:scale-95 shadow-md"
              >
                View DMCA Protocol
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                Contact Legal Desk
              </Link>
            </div>
          </section>

          {/* Section 4: Limitation of Liability */}
          <section className="p-6 sm:p-8 rounded-3xl border border-border bg-card/60 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <Scale size={20} className="text-emerald-400" />
              4. Limitation of Liability &amp; "As-Is" Provision
            </h2>
            <p>
              The 7MEDIA service is provided strictly on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. 7MEDIA and its developers (Shouvik Das) shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use of, or inability to use, this discovery directory.
            </p>
          </section>

          {/* Contact Pill */}
          <div className="p-6 rounded-3xl border border-primary/25 bg-gradient-to-r from-card/90 via-card/60 to-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Official Legal Desk Inquiries</h4>
              <p className="text-xs text-muted-foreground">For compliance correspondence, contact: <strong>7media.support@gmail.com</strong></p>
            </div>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs transition active:scale-95 shrink-0"
            >
              Submit Inquiry
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
