'use client'

import { useEffect } from 'react'
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react'

interface CustomDialogModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'info' | 'success' | 'warning'
}

export function CustomDialogModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
}: CustomDialogModalProps) {
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

  const isDanger = type === 'danger'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900 via-black to-zinc-950 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200 text-center"
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-2xl mx-auto mb-3.5 flex items-center justify-center border shadow-lg ${
            isDanger
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : 'bg-primary/15 border-primary/30 text-primary shadow-[0_0_20px_rgba(229,9,20,0.3)]'
          }`}
        >
          {isDanger ? <Trash2 size={22} /> : <Info size={22} />}
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
        <p className="text-xs text-zinc-300 leading-relaxed mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-300 transition active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>

          {onConfirm && (
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30'
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
