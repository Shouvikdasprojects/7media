'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, ShieldCheck, KeyRound, X, RefreshCw, Shield, HelpCircle } from 'lucide-react'
import { requestPasswordReset, resetPasswordWithCode, requestSignupOtp, verifySignupOtpAndCreateAccount } from '@/app/actions/profile'
import { initiate2FALoginChallenge, verify2FALoginChallenge } from '@/app/actions/two-factor'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  })

  // Sign up OTP Step State
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form')
  const [signupOtp, setSignupOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // 2FA Login Challenge State
  const [is2FALoginRequired, setIs2FALoginRequired] = useState(false)
  const [twoFactorUserId, setTwoFactorUserId] = useState('')
  const [twoFactorMaskedEmail, setTwoFactorMaskedEmail] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorUseBackup, setTwoFactorUseBackup] = useState(false)

  // Resend OTP Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPass, setForgotNewPass] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setSocialLoading(provider)
    setError(null)
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: '/',
      })
      if (res?.error) {
        throw new Error(
          res.error.message ||
            `${provider === 'google' ? 'Google' : 'GitHub'} OAuth is ready for credentials. You can also sign in or register with Email & Password below.`
        )
      }
    } catch (err: any) {
      setError(
        err?.message ||
          `${provider === 'google' ? 'Google' : 'GitHub'} OAuth requires client credentials in environment variables. You can sign in with Email & Password below.`
      )
      setSocialLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    try {
      if (mode === 'sign-in') {
        if (!is2FALoginRequired) {
          // 1. Check if 2FA is required for this account
          const challenge = await initiate2FALoginChallenge({ email, password })

          if (challenge.invalidPassword) {
            throw new Error('Invalid email or password. Please check your credentials.')
          }

          if (challenge.requires2FA && challenge.userId) {
            setIs2FALoginRequired(true)
            setTwoFactorUserId(challenge.userId)
            setTwoFactorMaskedEmail(challenge.maskedEmail || email)
            setResendCooldown(60)
            setIsLoading(false)
            return
          }

          // 2. Direct Sign-In (if 2FA not enabled)
          const { error: signInError } = await authClient.signIn.email({
            email,
            password,
          })
          if (signInError) {
            throw new Error(signInError.message || 'Invalid email or password. Please check your credentials.')
          }
          router.push('/')
          router.refresh()
        } else {
          // 3. Complete 2FA Verification (OTP or Backup Code)
          const clean2FACode = twoFactorCode.trim().replace(/\s+/g, '')
          if (!clean2FACode) {
            throw new Error(
              twoFactorUseBackup
                ? 'Please enter your 8-digit emergency backup code.'
                : 'Please enter the 6-digit login security code sent to your email.'
            )
          }

          const verifyRes = await verify2FALoginChallenge({
            userId: twoFactorUserId,
            code: clean2FACode,
            isBackupCode: twoFactorUseBackup,
          })

          if (!verifyRes.success) {
            throw new Error(verifyRes.error || '2FA verification failed.')
          }

          // Complete login session
          const { error: signInError } = await authClient.signIn.email({
            email,
            password,
          })

          if (signInError) {
            throw new Error(signInError.message || 'Failed to complete sign-in.')
          }

          router.push('/')
          router.refresh()
        }
      } else {
        // Sign up flow
        if (signupStep === 'form') {
          if (!formData.name.trim()) {
            throw new Error('Please enter your full name.')
          }
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long.')
          }
          if (password !== formData.confirmPassword) {
            throw new Error('Passwords do not match.')
          }

          const otpRes = await requestSignupOtp({
            name: formData.name.trim(),
            email,
            password,
          })

          if (!otpRes.success) {
            throw new Error(otpRes.error || 'Failed to send verification email.')
          }

          setSignupStep('otp')
          setResendCooldown(60)
          setIsLoading(false)
          return
        } else {
          // Step 2: Verify OTP and Register
          if (!signupOtp.trim() || signupOtp.trim().length !== 6) {
            throw new Error('Please enter the 6-digit verification code sent to your email.')
          }

          const verifyRes = await verifySignupOtpAndCreateAccount({
            name: formData.name.trim(),
            email,
            password,
            code: signupOtp.trim(),
          })

          if (!verifyRes.success) {
            throw new Error(verifyRes.error || 'Verification failed.')
          }

          // Automatically sign in the newly verified user
          const { error: signInError } = await authClient.signIn.email({
            email,
            password,
          })

          if (signInError) {
            router.push('/sign-in')
            return
          }

          try {
            localStorage.setItem('7media_avatar', 'crimson')
          } catch {}

          router.push('/')
          router.refresh()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* 1-Click Social Sign-In Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google 1-Click */}
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={socialLoading !== null || isLoading}
          className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-zinc-900/80 px-4 text-xs font-bold text-white transition hover:bg-zinc-800 hover:border-white/30 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {socialLoading === 'google' ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>

        {/* GitHub 1-Click */}
        <button
          type="button"
          onClick={() => handleSocialLogin('github')}
          disabled={socialLoading !== null || isLoading}
          className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-zinc-900/80 px-4 text-xs font-bold text-white transition hover:bg-zinc-800 hover:border-white/30 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {socialLoading === 'github' ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-white/10" />
        <span className="absolute bg-zinc-950 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Or with Email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive animate-in fade-in">
            <span>{error}</span>
          </div>
        )}

        {mode === 'sign-in' && is2FALoginRequired ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200 py-1">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                Two-Factor Security
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                {twoFactorUseBackup ? (
                  <>Enter one of your <strong className="text-white">8-digit emergency backup recovery codes</strong> to unlock your account:</>
                ) : (
                  <>
                    A 6-digit login security code was sent to{' '}
                    <strong className="text-white font-mono">{twoFactorMaskedEmail}</strong>. Enter it below to approve sign-in:
                  </>
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                {twoFactorUseBackup ? '8-Digit Backup Recovery Code' : '6-Digit Security Code'}
              </label>
              <input
                type="text"
                maxLength={twoFactorUseBackup ? 8 : 6}
                value={twoFactorCode}
                onChange={(e) => {
                  setTwoFactorCode(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                placeholder={twoFactorUseBackup ? '12345678' : '123456'}
                autoFocus
                required
                className={`h-14 w-full rounded-2xl border border-white/20 bg-secondary/80 text-center font-mono text-2xl font-bold text-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/30 ${
                  twoFactorUseBackup ? 'tracking-[0.25em]' : 'tracking-[0.4em]'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (twoFactorUseBackup ? twoFactorCode.length !== 8 : twoFactorCode.length !== 6)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50 touch-manipulation active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Verify &amp; Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorUseBackup(!twoFactorUseBackup)
                    setTwoFactorCode('')
                    setError(null)
                  }}
                  className="font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound size={13} />
                  <span>{twoFactorUseBackup ? 'Use 6-Digit Email Code' : 'Use 8-Digit Backup Code'}</span>
                </button>

                {!twoFactorUseBackup && (
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={async () => {
                      setIsLoading(true)
                      setError(null)
                      const challenge = await initiate2FALoginChallenge({
                        email: formData.email.trim().toLowerCase(),
                        password: formData.password,
                      })
                      setIsLoading(false)
                      if (challenge.requires2FA) {
                        setResendCooldown(60)
                      } else {
                        setError('Failed to resend login code.')
                      }
                    }}
                    className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                  >
                    {resendCooldown > 0 ? (
                      <span>Resend in {resendCooldown}s</span>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        <span>Resend code</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIs2FALoginRequired(false)
                  setTwoFactorCode('')
                  setError(null)
                }}
                className="text-center text-xs text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                Cancel and use another account
              </button>
            </div>
          </div>
        ) : mode === 'sign-up' && signupStep === 'otp' ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200 py-1">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_25px_rgba(229,9,20,0.3)]">
                <KeyRound size={28} />
              </div>
              <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                Verify Your Email
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                An activation code has been sent from our verification desk to{' '}
                <strong className="text-white font-mono">{formData.email}</strong>. Enter the 6-digit code below:
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                6-Digit Activation Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={signupOtp}
                onChange={(e) => {
                  setSignupOtp(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                placeholder="123456"
                autoFocus
                required
                className="h-14 w-full rounded-2xl border border-white/20 bg-secondary/80 text-center font-mono text-2xl font-bold tracking-[0.4em] text-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || signupOtp.length !== 6}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50 touch-manipulation active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying &amp; Activating...</span>
                </>
              ) : (
                <>
                  <span>Verify &amp; Activate Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <button
                type="button"
                onClick={() => {
                  setSignupStep('form')
                  setError(null)
                }}
                className="font-semibold hover:text-foreground transition underline cursor-pointer"
              >
                Change details
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={async () => {
                  setIsLoading(true)
                  setError(null)
                  const res = await requestSignupOtp({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                  })
                  setIsLoading(false)
                  if (res.success) {
                    setResendCooldown(60)
                  } else {
                    setError(res.error || 'Failed to resend code.')
                  }
                }}
                className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>Resend code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                {mode === 'sign-in' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(formData.email)
                      setForgotMsg(null)
                      setForgotStep('email')
                      setForgotOpen(true)
                    }}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
              disabled={isLoading || socialLoading !== null}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50 touch-manipulation active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'sign-in' ? 'Sign In with Email' : 'Send Verification Code'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </>
        )}

        {/* Feature Badges */}
        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-400" /> Free Forever
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-primary" /> 256-Bit Encrypted
          </span>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* FORGOT / RESET PASSWORD MODAL DIALOG                                      */}
      {/* ========================================================================= */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(229,9,20,0.3)]">
                  <KeyRound size={18} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Reset Password
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {forgotStep === 'email' ? 'Enter your email for a 6-digit code' : 'Verify code & set new password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {forgotMsg && (
              <div
                className={`mb-4 flex flex-col gap-2 rounded-2xl border p-3.5 text-xs font-semibold animate-in fade-in ${
                  forgotMsg.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-destructive/40 bg-destructive/10 text-destructive'
                }`}
              >
                <div className="flex items-start gap-2">
                  {forgotMsg.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldCheck size={16} className="shrink-0 mt-0.5" />}
                  <span>{forgotMsg.text}</span>
                </div>
                {forgotMsg.type === 'error' && (
                  <div className="pt-1">
                    <Link
                      href="/sign-up"
                      onClick={() => setForgotOpen(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary px-3.5 py-1.5 rounded-xl hover:bg-primary/90 transition shadow-md cursor-pointer"
                    >
                      <User size={13} />
                      <span>Create Free Account</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {forgotStep === 'email' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!forgotEmail.trim()) return
                  setForgotLoading(true)
                  setForgotMsg(null)
                  try {
                    const res = await requestPasswordReset(forgotEmail)
                    if (res.success) {
                      setForgotMsg({ type: 'success', text: res.message || '6-digit code sent to your email!' })
                      setForgotStep('code')
                    } else {
                      setForgotMsg({ type: 'error', text: res.error || 'Failed to send reset code.' })
                    }
                  } catch (err: any) {
                    setForgotMsg({ type: 'error', text: err?.message || 'Network error sending reset code.' })
                  } finally {
                    setForgotLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/90 transition shadow-lg disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span>Send 6-Digit Reset Code</span>
                </button>
              </form>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!forgotCode.trim() || forgotNewPass.length < 6) return
                  setForgotLoading(true)
                  setForgotMsg(null)
                  try {
                    const res = await resetPasswordWithCode({
                      email: forgotEmail,
                      code: forgotCode.trim(),
                      newPassword: forgotNewPass,
                    })
                    if (res.success) {
                      setForgotMsg({
                        type: 'success',
                        text: 'Password reset successful! You can now sign in.',
                      })
                      setTimeout(() => {
                        setForgotOpen(false)
                      }, 2000)
                    } else {
                      setForgotMsg({ type: 'error', text: res.error || 'Failed to reset password.' })
                    }
                  } catch (err: any) {
                    setForgotMsg({ type: 'error', text: err?.message || 'Network error resetting password.' })
                  } finally {
                    setForgotLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-center font-mono text-xl font-bold tracking-widest text-white placeholder-zinc-600 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="password"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="flex-1 h-11 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {forgotLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Confirm Reset</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
