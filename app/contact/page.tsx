'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message.')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      <Navbar />

      <main className="flex-1 px-4 pb-20 pt-28 md:px-8 lg:px-12 max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10 border-b border-border pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent mb-2">
            <Mail size={16} />
            <span>Support Desk</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Contact &amp; Support
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Have feedback, bug reports, feature requests, or DMCA compliance questions? Drop a message below and our team will get back to you.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-3xl border border-border bg-card/60 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-400" /> Direct Support Desk
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Submit your inquiry using the secure form below. Our support team reviews all incoming messages and replies directly to your provided email address.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-border bg-card/60 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Sparkles size={15} /> DMCA &amp; Legal Notices
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Copyright and compliance inquiries are prioritized and processed promptly by our legal desk within 24–48 hours.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card/80 shadow-xl">
          {submitted ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Inquiry Sent Successfully!</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Thank you for contacting 7MEDIA. Your inquiry has been forwarded directly to our support team and we will respond to your email promptly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' })
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold uppercase tracking-wider text-foreground transition active:scale-95 cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shouvik Roy"
                    className="h-12 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Inquiry Topic / Subject
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Choose a preset or type your own
                  </span>
                </div>

                {/* Quick Topic Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    'General Inquiry',
                    'Bug Report',
                    'Feature Request',
                    'Player Issue',
                    'DMCA Notice',
                    'Partnership',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, subject: preset })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
                        formData.subject === preset
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                          : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Custom Editable Topic Input */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Type your own custom topic or edit preset..."
                    maxLength={100}
                    className="h-12 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your question, issue, or suggestion..."
                  className="w-full rounded-xl border border-border bg-secondary/60 p-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98] cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Transmitting Message...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
