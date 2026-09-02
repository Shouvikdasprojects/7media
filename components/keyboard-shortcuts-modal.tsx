'use client'

import { useState, useEffect } from 'react'
import { X, Keyboard, Sparkles, Command } from 'lucide-react'

const SHORTCUTS = [
  { key: 'Space / K', label: 'Play / Pause Video', category: 'Playback' },
  { key: 'F', label: 'Toggle Fullscreen Mode', category: 'Playback' },
  { key: 'M', label: 'Mute / Unmute Audio', category: 'Audio' },
  { key: '← / →', label: 'Seek 10 Seconds Backward / Forward', category: 'Seeking' },
  { key: '↑ / ↓', label: 'Volume Up / Down (5%)', category: 'Audio' },
  { key: 'C', label: 'Toggle Subtitles & Closed Captions', category: 'Subtitles' },
  { key: 'S', label: 'Quick Global Search', category: 'Navigation' },
  { key: '?', label: 'Open Keyboard Shortcuts Guide', category: 'System' },
  { key: 'Esc', label: 'Close Active Modal / Exit Fullscreen', category: 'System' },
]

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/20">
            <Keyboard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                Power Cinephile
              </span>
            </div>
            <h3 className="text-xl font-black font-display text-white mt-0.5">
              Cinema Keyboard Shortcuts
            </h3>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-white/10"
            >
              <span className="text-xs text-zinc-300 font-medium">{s.label}</span>
              <kbd className="px-2.5 py-1 rounded-xl bg-zinc-800 border border-white/15 text-[11px] font-mono font-black text-primary shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/15 text-zinc-300 font-mono text-[10px]">?</kbd> anywhere to open</span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary hover:underline font-bold cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}