'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('7MEDIA Runtime Error Boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-foreground selection:bg-primary/30">
      <div className="relative max-w-lg w-full rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-8 md:p-10 text-center shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(229,9,20,0.35)]">
          <AlertTriangle size={32} />
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
          Cinema Stream Recovered
        </span>
        <h1 className="text-2xl md:text-3xl font-black font-display uppercase tracking-tight text-white mt-1 mb-3">
          Something went wrong
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-8">
          The requested media stream or service encountered a temporary glitch. You can retry loading the page or return to the main lobby.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <RefreshCcw size={15} />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Home size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
