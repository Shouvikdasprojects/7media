import Link from 'next/link'
import { ArrowLeft, Shield, Mail, CheckCircle2, FileText, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'DMCA & Copyright Compliance · 7MEDIA',
  description: 'DMCA guidelines, safe harbor declaration, and copyright agent contact details for 7MEDIA.',
}

export default function DmcaPage() {
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
            <Shield size={16} />
            <span>Copyright Policy</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            DMCA &amp; Copyright Compliance
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            7MEDIA strictly respects intellectual property laws, the Digital Millennium Copyright Act (17 U.S.C. § 512), and international copyright conventions.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Statement */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-4">
            <h2 className="text-base font-bold text-foreground">
              1. Non-Hosting Media Declaration &amp; Architecture
            </h2>
            <p>
              7MEDIA operates strictly as an entertainment indexer and meta-discovery directory. 
            </p>
            <div className="p-4 rounded-2xl bg-secondary/80 border border-border/80 text-xs space-y-2 text-zinc-300">
              <p className="font-bold text-foreground">Key Technical Disclosures:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>We do not store, host, convert, or distribute copyrighted video or audio files on our servers.</li>
                <li>All media artwork, cast portraits, and synopsis summaries are fetched programmatically via open metadata APIs from <strong className="text-foreground">The Movie Database (TMDB)</strong> and <strong className="text-foreground">AniList</strong>.</li>
                <li>All video players embed official YouTube trailers and link to legitimate licensed streaming providers (Netflix, Prime Video, Disney+, Apple TV+, etc.).</li>
              </ul>
            </div>
          </section>

          {/* Filing Notice */}
          <section className="p-6 rounded-3xl border border-border bg-card/60 space-y-4">
            <h2 className="text-base font-bold text-foreground">
              2. How to File a DMCA Takedown Notice
            </h2>
            <p>
              If you are a verified copyright owner or authorized representative and believe that any metadata, link, or image hosted on 7MEDIA infringes upon your copyright, please provide our designated DMCA agent with the following:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground pl-2">
              <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>The exact URL / link on 7MEDIA where the material is located.</li>
              <li>Your contact details (Full Name, Address, Phone Number, and Official Email).</li>
              <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement, made under penalty of perjury, that the information in your notice is accurate.</li>
            </ol>
          </section>

          {/* Designated Agent */}
          <section className="p-6 rounded-3xl border border-accent/40 bg-accent/10 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail size={18} className="text-accent" />
              3. Designated DMCA Compliance Contact
            </h2>
            <p className="text-xs text-muted-foreground">
              Please submit all takedown notices directly through our official Contact &amp; Support desk. We review and process verified claims within 24–48 business hours.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition hover:bg-primary/90 active:scale-95 shadow-md"
              >
                <Mail size={14} /> Submit DMCA Takedown Notice
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
