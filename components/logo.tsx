'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge' | 'image'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
  glow?: boolean
  showIcon?: boolean
}

export function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  className = '',
  glow = true,
  showIcon = true,
}: LogoProps) {
  const sizeClasses = {
    sm: {
      wrap: 'gap-2',
      iconBox: 'w-7 h-7 rounded-xl',
      sevenM: 'text-base sm:text-lg',
      edia: 'text-[10px] sm:text-[11px] tracking-widest',
      sub: 'hidden',
    },
    md: {
      wrap: 'gap-2.5',
      iconBox: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl',
      sevenM: 'text-xl sm:text-2xl',
      edia: 'text-xs sm:text-sm tracking-[0.2em]',
      sub: 'text-[8px] tracking-[0.3em]',
    },
    lg: {
      wrap: 'gap-3',
      iconBox: 'w-12 h-12 rounded-2xl',
      sevenM: 'text-3xl sm:text-4xl',
      edia: 'text-lg sm:text-xl tracking-[0.25em]',
      sub: 'text-[10px] tracking-[0.35em]',
    },
    xl: {
      wrap: 'gap-4',
      iconBox: 'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl',
      sevenM: 'text-5xl md:text-6xl',
      edia: 'text-2xl md:text-3xl tracking-[0.3em]',
      sub: 'text-xs tracking-[0.4em]',
    },
  }[size]

  const emblemGraphic = (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden bg-zinc-950 border border-primary/40 shadow-lg shadow-primary/25 transition-transform group-hover:scale-105 ${sizeClasses.iconBox}`}
    >
      <img
        src="/logo.png"
        alt="7MEDIA Emblem"
        className="w-full h-full object-cover rounded-inherit"
      />
      <div className="absolute inset-0 rounded-inherit ring-1 ring-inset ring-white/20 pointer-events-none" />
    </div>
  )

  const content = (
    <div
      className={`inline-flex items-center select-none font-display transition-transform active:scale-95 group ${sizeClasses.wrap} ${className}`}
    >
      {variant === 'icon' ? (
        emblemGraphic
      ) : variant === 'badge' ? (
        // Capsule Badge with Glow
        <div className="flex items-center gap-2.5 rounded-full bg-black/85 border border-primary/40 px-3.5 py-1.5 shadow-lg shadow-primary/20 backdrop-blur-xl group-hover:border-primary transition-all">
          {emblemGraphic}
          <div className="flex flex-col text-left">
            <div className="flex items-baseline leading-none">
              <span className={`font-black text-accent ${sizeClasses.sevenM} ${glow ? 'text-glow' : ''}`}>
                7M
              </span>
              <span className={`font-black text-white ${sizeClasses.edia} ${glow ? 'text-glow' : ''}`}>
                EDIA
              </span>
            </div>
          </div>
        </div>
      ) : variant === 'image' ? (
        <div className={`relative overflow-hidden rounded-3xl border border-primary/30 shadow-2xl shadow-primary/30 ${sizeClasses.iconBox}`}>
          <img src="/logo.png" alt="7MEDIA Logo" className="w-full h-full object-cover" />
        </div>
      ) : (
        // Full Wordmark with 3D Emblem
        <div className="flex items-center gap-2.5">
          {showIcon && emblemGraphic}
          <div className="flex flex-col text-left">
            <div className="flex items-baseline leading-none group-hover:scale-[1.02] transition-transform">
              <span
                className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-500 to-rose-400 leading-none ${sizeClasses.sevenM} ${
                  glow ? 'drop-shadow-[0_0_15px_rgba(229,9,20,0.6)]' : ''
                }`}
              >
                7M
              </span>
              <span
                className={`font-black text-white font-display uppercase tracking-widest leading-none ${sizeClasses.edia}`}
              >
                EDIA
              </span>
            </div>
            {(size === 'lg' || size === 'xl') && (
              <span className={`font-bold text-accent uppercase ${sizeClasses.sub} mt-1 opacity-90`}>
                CINEMATIC ECOSYSTEM
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} aria-label="7MEDIA Home" className="cursor-pointer">
        {content}
      </Link>
    )
  }

  return content
}
