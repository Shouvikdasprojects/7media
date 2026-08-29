'use client'

import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
  glow?: boolean
}

export function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  className = '',
  glow = true,
}: LogoProps) {
  const sizeClasses = {
    sm: {
      wrap: 'h-7',
      sevenM: 'text-lg',
      edia: 'text-[11px] tracking-wider',
      icon: 'w-7 h-7',
    },
    md: {
      wrap: 'h-9',
      sevenM: 'text-2xl',
      edia: 'text-sm tracking-widest',
      icon: 'w-9 h-9',
    },
    lg: {
      wrap: 'h-12',
      sevenM: 'text-4xl',
      edia: 'text-xl tracking-[0.25em]',
      icon: 'w-12 h-12',
    },
    xl: {
      wrap: 'h-16',
      sevenM: 'text-5xl md:text-6xl',
      edia: 'text-2xl md:text-3xl tracking-[0.3em]',
      icon: 'w-16 h-16',
    },
  }[size]

  const content = (
    <div
      className={`inline-flex items-center gap-0.5 select-none font-display transition-transform active:scale-95 group ${className}`}
    >
      {variant === 'icon' ? (
        // Icon Only Badge
        <div
          className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-black via-card to-black border border-primary/40 shadow-lg shadow-primary/20 p-2 ${sizeClasses.icon}`}
        >
          <span
            className={`font-black text-accent leading-none ${sizeClasses.sevenM} ${
              glow ? 'text-glow' : ''
            }`}
          >
            7M
          </span>
        </div>
      ) : variant === 'badge' ? (
        // Capsule Badge with Glow
        <div
          className="flex items-center gap-1.5 rounded-full bg-black/80 border border-primary/40 px-3.5 py-1.5 shadow-lg shadow-primary/20 backdrop-blur-xl"
        >
          <span
            className={`font-black text-accent leading-none ${sizeClasses.sevenM} ${
              glow ? 'text-glow' : ''
            }`}
          >
            7M
          </span>
          <span
            className={`font-black text-accent font-display uppercase ${sizeClasses.edia} ${
              glow ? 'text-glow' : ''
            }`}
          >
            EDIA
          </span>
        </div>
      ) : (
        // Full Wordmark
        <div className="flex items-baseline gap-0.5">
          <span
            className={`font-black text-accent leading-none group-hover:scale-105 transition-transform ${sizeClasses.sevenM} ${
              glow ? 'text-glow' : ''
            }`}
          >
            7M
          </span>
          <span
            className={`font-black text-accent font-display uppercase ${sizeClasses.edia} ${
              glow ? 'text-glow' : ''
            }`}
          >
            EDIA
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} aria-label="7MEDIA Home">
        {content}
      </Link>
    )
  }

  return content
}
