'use client'

import { useState } from 'react'
import { ShieldCheck, X, MessageCircle, Send, Phone } from 'lucide-react'

export function SafetyBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <section className="px-4 md:px-8 lg:px-12 py-4">
      <div className="max-w-[1880px] mx-auto flex flex-col lg:flex-row items-stretch gap-4">
        {/* Safety notice */}
        <div className="flex-1 flex items-start gap-3 bg-card border border-border rounded-2xl px-5 py-4 relative">
          <ShieldCheck size={20} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-muted-foreground leading-relaxed pr-8">
            <span className="font-semibold text-foreground">You&apos;re safe here</span> — 100%
            free, no sign-up needed, no VPN. Anything asking you to &quot;verify&quot;, pay, or
            install something is a third-party ad — close and ignore it.{' '}
            <a href="/faq" className="text-accent hover:underline font-medium">
              Spot ads →
            </a>
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Hub */}
        <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-2xl px-5 py-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Watch with Friends</span>{' '}
            <span className="text-muted-foreground">&amp; explore together</span>
          </p>
          <div className="flex items-center gap-2">
            <a
              href="/party"
              className="px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-all active:scale-95 shadow-sm"
            >
              Watch Party
            </a>
            <a
              href="/contact"
              className="px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/80 border border-border transition-all active:scale-95"
            >
              Support Desk
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
