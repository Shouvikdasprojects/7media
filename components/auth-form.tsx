'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        })
        if (signInError) {
          throw new Error(signInError.message || 'Invalid email or password. Please check your credentials.')
        }
      } else {
        if (!formData.name.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.')
        }
        if (password !== formData.confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: formData.name.trim(),
        })
        if (signUpError) {
          throw new Error(signUpError.message || 'Failed to create account. Email may already be in use.')
        }
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive animate-in fade-in">
          <span>{error}</span>
        </div>
      )}

      {/* Name (Sign Up Only) */}
      {mode === 'sign-up' && (
        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Shouvik Roy"
              required
              className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-11 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {mode === 'sign-up' && (
          <p className="mt-1 text-[11px] text-muted-foreground">Must be at least 6 characters</p>
        )}
      </div>

      {/* Confirm Password (Sign Up Only) */}
      {mode === 'sign-up' && (
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50 touch-manipulation active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Please wait...</span>
          </>
        ) : (
          <>
            <span>{mode === 'sign-in' ? 'Sign In to 7MEDIA' : 'Create Free Account'}</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {/* Feature Badges */}
      <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={13} className="text-emerald-400" /> Free Forever
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-primary" /> Secure Auth
        </span>
      </div>
    </form>
  )
}
