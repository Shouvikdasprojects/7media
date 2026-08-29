'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Users, Tv, Sparkles, Plus, ArrowRight, Play, Shield, MessageCircle, Heart } from 'lucide-react'

export default function PartyLandingPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [hostName, setHostName] = useState('')
  const [roomTitle, setRoomTitle] = useState('Friday Movie Night')

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    const randomCode = `7M-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    router.push(`/party/${randomCode}?host=${encodeURIComponent(hostName || 'Cinephile')}&title=${encodeURIComponent(roomTitle)}`)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    const cleanCode = joinCode.trim().toUpperCase()
    router.push(`/party/${cleanCode}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-32 pb-20 max-w-6xl mx-auto w-full">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent mb-4">
            <Users size={14} />
            <span>Virtual Cinema · Watch Together</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display uppercase tracking-tight text-white text-glow">
            7Media Watch Party
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mt-3 leading-relaxed">
            Create a private synchronized cinema room, invite friends with a code, and watch movies together with live emoji reactions and chat.
          </p>
        </div>

        {/* Create & Join Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Box 1: Create a Room */}
          <div className="rounded-3xl border border-white/15 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-3 rounded-2xl bg-accent/20 text-accent border border-accent/30">
                  <Plus size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Create a Room
                  </h3>
                  <p className="text-xs text-zinc-400">Host your own watch party</p>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 mt-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="e.g. Alex (Host)"
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Party Room Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="e.g. Anime Binge Night"
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-accent focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent hover:bg-accent/90 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white transition active:scale-95 shadow-lg shadow-accent/25 mt-4"
                >
                  <span>Launch Watch Party</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Box 2: Join with Code */}
          <div className="rounded-3xl border border-white/15 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Tv size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Join a Room
                  </h3>
                  <p className="text-xs text-zinc-400">Enter a code from your friend</p>
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4 mt-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Party Room Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7M-K8X9P"
                    className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 py-3 text-sm text-white uppercase font-mono tracking-widest placeholder:text-zinc-500 placeholder:normal-case placeholder:font-sans focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-4 text-xs text-zinc-400 space-y-2">
                  <p className="flex items-center gap-2 text-zinc-300 font-bold">
                    <Shield size={14} className="text-cyan-400" />
                    <span>Instant &amp; Free</span>
                  </p>
                  <p>No account required to join your friends. Real-time sync and chat supported on all devices.</p>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition active:scale-95 shadow-lg shadow-cyan-500/25 mt-4"
                >
                  <span>Enter Room</span>
                  <Play size={16} fill="currentColor" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
          <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 text-center">
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3">
              <Play size={18} fill="currentColor" />
            </div>
            <h4 className="text-sm font-bold text-white">Synchronized Playback</h4>
            <p className="text-xs text-zinc-400 mt-1">Host controls play, pause, and seeking for everyone in the room.</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 text-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={18} />
            </div>
            <h4 className="text-sm font-bold text-white">Live Party Chat</h4>
            <p className="text-xs text-zinc-400 mt-1">Chat in real-time, discuss scenes, and share theories.</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 text-center">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-3">
              <Heart size={18} />
            </div>
            <h4 className="text-sm font-bold text-white">Float Emojis</h4>
            <p className="text-xs text-zinc-400 mt-1">Spam fire, popcorn, and heart emoji reactions across the screen.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
