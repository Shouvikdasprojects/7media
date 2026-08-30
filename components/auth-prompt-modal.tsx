'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Lock, Sparkles, X, UserPlus, LogIn, ShieldCheck, MessageSquare } from 'lucide-react'

interface AuthPromptModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  feature?: string
}

export function AuthPromptModal({
  isOpen,
  onClose,
  title = 'Sign In Required',
  description = 'Sign in or create your free 7MEDIA account to unlock full interactive community features, direct messages, and cloud syncing.',
  feature = 'Community & Direct Messaging',
}: AuthPromptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-black/95 to-zinc-950 p-6 sm:p-8 shadow-[0_0_60px_rgba(229,9,20,0.25)] backdrop-blur-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-primary to-transparent blur-sm" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Icon & Feature Pill */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(229,9,20,0.3)]">
            <Lock size={22} />
          </div>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Sparkles size={13} /> {feature}
          </span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white mb-2">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href="/sign-in"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider transition shadow-lg shadow-primary/30 active:scale-95 cursor-pointer"
          >
            <LogIn size={16} />
            <span>Sign In to Account</span>
          </Link>

          <Link
            href="/sign-up"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-secondary/80 hover:bg-secondary border border-white/15 text-foreground font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Create Free 7MEDIA Account</span>
          </Link>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" /> Free · 100% Secure
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white transition font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
