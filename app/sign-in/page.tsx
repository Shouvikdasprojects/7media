import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AuthForm } from '@/components/auth-form'
import { Logo } from '@/components/logo'
import { Sparkles, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Sign In | 7MEDIA',
  description: 'Sign in to your 7MEDIA account to sync your watchlist, favorite anime, and continue watching across devices.',
}

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center px-4 py-28 md:py-32">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-3xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-7">
              <div className="mb-4 flex justify-center"><Logo size="lg" href="/" /></div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground font-display uppercase tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
                Sign in to access your personal watchlist and synced progress.
              </p>
            </div>

            {/* Auth Form */}
            <AuthForm mode="sign-in" />

            {/* Switch to Sign Up */}
            <div className="mt-6 border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="font-bold text-primary hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={13} />
              <span>Back to home / Continue as guest</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
