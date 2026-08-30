'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import {
  MessageSquare,
  Globe2,
  Users,
  Send,
  Trash2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  User,
  ArrowLeft,
  Crown,
  Film,
  Smile,
  CheckCheck,
  AlertCircle,
  Loader2,
  PlusCircle,
  MoreVertical,
  Mail,
  ChevronRight,
  Tv,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useSession } from '@/lib/auth-client'
import {
  getGlobalChatMessages,
  postGlobalChatMessage,
  deleteGlobalChatMessage,
  getDirectMessageThreads,
  getDirectMessagesWithUser,
  sendDirectMessage,
  getAdminUserInfo,
} from '@/app/actions/chat'
import { verifyIsAdmin } from '@/app/actions/admin'

const QUICK_EMOJIS = ['🍿', '🔥', '❤️', '🎬', '🚀', '😂', '👏', '⚡', '💯', '🎉']

export default function ChatPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'global' | 'dm'>('global')
  const [isAdmin, setIsAdmin] = useState(false)

  // -------------------------------------------------------------
  // GLOBAL CHAT STATE
  // -------------------------------------------------------------
  const [globalInput, setGlobalInput] = useState('')
  const [guestName, setGuestName] = useState('Guest')
  const [mediaTagInput, setMediaTagInput] = useState('')
  const [showMediaTagBox, setShowMediaTagBox] = useState(false)
  const [isSendingGlobal, setIsSendingGlobal] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const globalMessagesEndRef = useRef<HTMLDivElement>(null)

  // Global Chat SWR Polling (every 3.5s)
  const {
    data: globalData,
    mutate: mutateGlobal,
    isLoading: isGlobalLoading,
  } = useSWR('global_chat_messages', () => getGlobalChatMessages(70), {
    refreshInterval: 3500,
    revalidateOnFocus: true,
  })

  // -------------------------------------------------------------
  // DIRECT MESSAGING (DM) STATE
  // -------------------------------------------------------------
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [dmInput, setDmInput] = useState('')
  const [isSendingDm, setIsSendingDm] = useState(false)
  const [dmSearchQuery, setDmSearchQuery] = useState('')
  const [showMobileDmList, setShowMobileDmList] = useState(true)
  const dmMessagesEndRef = useRef<HTMLDivElement>(null)

  // Threads SWR Polling (every 4s)
  const {
    data: threadsData,
    mutate: mutateThreads,
  } = useSWR(session?.user ? 'dm_threads' : null, () => getDirectMessageThreads(), {
    refreshInterval: 4000,
  })

  // Active DM Conversation SWR Polling (every 2.5s)
  const {
    data: activeDmData,
    mutate: mutateActiveDm,
    isLoading: isActiveDmLoading,
  } = useSWR(
    session?.user && selectedPartnerId ? `dm_convo_${selectedPartnerId}` : null,
    () => getDirectMessagesWithUser(selectedPartnerId!),
    {
      refreshInterval: 2500,
      revalidateOnFocus: true,
    }
  )

  // Check Admin Role
  useEffect(() => {
    if (session?.user) {
      verifyIsAdmin().then((res) => setIsAdmin(Boolean(res?.isAdmin)))
    } else {
      setIsAdmin(false)
      try {
        const savedGuest = localStorage.getItem('7media_chat_guest_name')
        if (savedGuest) setGuestName(savedGuest)
      } catch {}
    }
  }, [session?.user])

  // Select first thread by default when threads load
  useEffect(() => {
    if (threadsData?.threads && threadsData.threads.length > 0 && !selectedPartnerId) {
      setSelectedPartnerId(threadsData.threads[0].partnerId)
    }
  }, [threadsData?.threads, selectedPartnerId])

  // Auto-scroll global messages
  useEffect(() => {
    if (activeTab === 'global' && globalData?.messages) {
      globalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [globalData?.messages?.length, activeTab])

  // Auto-scroll DM messages
  useEffect(() => {
    if (activeTab === 'dm' && activeDmData?.messages) {
      dmMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeDmData?.messages?.length, activeTab, selectedPartnerId])

  // -------------------------------------------------------------
  // GLOBAL CHAT ACTIONS
  // -------------------------------------------------------------
  const handleSendGlobal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!globalInput.trim() || isSendingGlobal) return

    const messageText = globalInput.trim()
    const tag = mediaTagInput.trim() || null

    setGlobalInput('')
    setMediaTagInput('')
    setShowMediaTagBox(false)
    setGlobalError(null)
    setIsSendingGlobal(true)

    // Save guest handle
    if (!session?.user && guestName) {
      try {
        localStorage.setItem('7media_chat_guest_name', guestName)
      } catch {}
    }

    try {
      const res = await postGlobalChatMessage({
        content: messageText,
        mediaTag: tag,
        guestName,
      })

      if (!res.success) {
        setGlobalError(res.error || 'Failed to send message.')
      } else {
        await mutateGlobal()
      }
    } catch {
      setGlobalError('Connection error. Please try again.')
    } finally {
      setIsSendingGlobal(false)
    }
  }

  const handleDeleteGlobal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    await deleteGlobalChatMessage(id)
    mutateGlobal()
  }

  const startDmWithUser = (targetUserId: string) => {
    if (!session?.user) {
      alert('Please sign in to send direct messages to users or admin.')
      return
    }
    setSelectedPartnerId(targetUserId)
    setActiveTab('dm')
    setShowMobileDmList(false)
  }

  // -------------------------------------------------------------
  // DIRECT MESSAGING ACTIONS
  // -------------------------------------------------------------
  const handleSendDm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!dmInput.trim() || !selectedPartnerId || isSendingDm) return

    const messageText = dmInput.trim()
    setDmInput('')
    setIsSendingDm(true)

    try {
      const res = await sendDirectMessage({
        receiverId: selectedPartnerId,
        content: messageText,
      })

      if (res.success) {
        await mutateActiveDm()
        await mutateThreads()
      } else {
        alert(res.error || 'Failed to deliver message.')
      }
    } catch {
      alert('Failed to send direct message. Please check network.')
    } finally {
      setIsSendingDm(false)
    }
  }

  const filteredThreads = (threadsData?.threads || []).filter((t: any) =>
    t.partnerName.toLowerCase().includes(dmSearchQuery.toLowerCase()) ||
    t.lastMessage.toLowerCase().includes(dmSearchQuery.toLowerCase())
  )

  const currentPartner: any =
    threadsData?.threads?.find((t: any) => t.partnerId === selectedPartnerId) ||
    activeDmData?.targetUser

  const partnerName = currentPartner?.partnerName || currentPartner?.name || 'Direct Message'
  const partnerImage = currentPartner?.partnerImage || currentPartner?.image || null
  const partnerRole = currentPartner?.partnerRole || currentPartner?.role || 'user'

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      <Navbar />

      <main className="flex-1 px-3 sm:px-6 lg:px-10 pb-16 pt-24 md:pt-28 max-w-7xl mx-auto w-full">
        {/* Page Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary mb-1.5">
              <Sparkles size={16} />
              <span>7MEDIA Live Hub</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
              Community &amp; Chat
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold tracking-normal uppercase">
                  <Crown size={12} /> Admin Mode
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Talk cinema with viewers globally or send direct messages and support inquiries to Admin.
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-2 bg-secondary/80 p-1.5 rounded-2xl border border-border shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'global'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
              }`}
            >
              <Globe2 size={16} />
              <span>Global Lounge</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!session?.user) {
                  alert('Please sign in to access 1-on-1 Direct Messages and Admin Support.')
                  return
                }
                setActiveTab('dm')
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'dm'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
              }`}
            >
              <MessageSquare size={16} />
              <span>Direct Messages</span>
              {threadsData?.threads?.some((t: any) => t.unreadCount > 0) && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: GLOBAL CINEMA LOUNGE                                               */}
        {/* ========================================================================= */}
        {activeTab === 'global' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Chat Stream (3 Columns on Large Screens) */}
            <div className="lg:col-span-3 flex flex-col h-[70vh] rounded-3xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Chat Stream Header */}
              <div className="px-5 py-3.5 border-b border-border/80 bg-secondary/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Live Global Feed
                  </span>
                  <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                    {globalData?.messages?.length || 0} messages
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Users size={13} className="text-emerald-400" /> Open to all cinephiles
                </span>
              </div>

              {/* Chat Messages Scroll Container */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin">
                {isGlobalLoading && (!globalData?.messages || globalData.messages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Loader2 size={28} className="animate-spin text-primary" />
                    <p className="text-xs font-semibold">Connecting to Global Cinema Lounge...</p>
                  </div>
                ) : globalData?.messages?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                      <Globe2 size={28} className="text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">No messages yet</h3>
                    <p className="text-xs max-w-xs mt-1">
                      Be the first to drop a movie recommendation, review, or say hello!
                    </p>
                  </div>
                ) : (
                  globalData?.messages?.map((msg: any) => {
                    const isMe = session?.user && msg.userId === session.user.id
                    const isMsgAdmin = msg.userRole === 'admin'

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-1 ${
                          isMe ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {/* User Avatar */}
                        <div
                          className={`w-9 h-9 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center border font-bold text-xs ${
                            isMsgAdmin
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : isMe
                              ? 'bg-primary/20 border-primary/40 text-primary'
                              : 'bg-secondary border-border text-foreground'
                          }`}
                        >
                          {msg.userImage && msg.userImage.startsWith('http') ? (
                            <img src={msg.userImage} alt={msg.userName} className="w-full h-full object-cover" />
                          ) : isMsgAdmin ? (
                            <Crown size={18} className="text-amber-400" />
                          ) : (
                            <span>{msg.userName?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>

                        {/* Message Bubble & Metadata */}
                        <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end text-right' : ''}`}>
                          {/* Sender Info Bar */}
                          <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className="text-xs font-bold text-foreground">
                              {msg.userName}
                            </span>

                            {isMsgAdmin && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black tracking-wider uppercase shadow-sm">
                                <Crown size={10} /> Admin 👑
                              </span>
                            )}

                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* Actions on Message */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {/* 1-Click Direct Message Button */}
                              {session?.user && msg.userId && msg.userId !== session.user.id && (
                                <button
                                  type="button"
                                  onClick={() => startDmWithUser(msg.userId)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition text-[11px] flex items-center gap-1"
                                  title="Send Direct Message"
                                >
                                  <MessageSquare size={12} />
                                  <span className="hidden sm:inline">DM</span>
                                </button>
                              )}

                              {/* Delete message (Admin or Author) */}
                              {(isAdmin || isMe) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGlobal(msg.id)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                                  title="Delete Message"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Message Content Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md break-words ${
                              isMsgAdmin
                                ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 text-zinc-100'
                                : isMe
                                ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                                : 'bg-secondary/90 border border-border text-foreground rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Optional Media Recommendation Tag */}
                            {msg.mediaTag && (
                              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-accent">
                                <Film size={14} />
                                <span>{msg.mediaTag}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={globalMessagesEndRef} />
              </div>

              {/* Quick Emoji Bar */}
              <div className="px-4 py-2 border-t border-border/60 bg-secondary/20 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Quick:</span>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGlobalInput((prev) => prev + emoji)}
                    className="p-1.5 rounded-xl hover:bg-secondary text-sm transition active:scale-90 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div className="p-3 sm:p-4 border-t border-border bg-card/95">
                {globalError && (
                  <div className="mb-2 p-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{globalError}</span>
                  </div>
                )}

                {/* Media Tag Input Modal / Accordion */}
                {showMediaTagBox && (
                  <div className="mb-2 p-2.5 rounded-2xl bg-secondary/80 border border-border flex items-center gap-2">
                    <Film size={15} className="text-primary shrink-0" />
                    <input
                      type="text"
                      value={mediaTagInput}
                      onChange={(e) => setMediaTagInput(e.target.value)}
                      placeholder="Enter Movie/Anime Name (e.g. Inception, Attack on Titan)..."
                      className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaTagBox(false)}
                      className="text-xs text-muted-foreground hover:text-foreground font-bold px-2"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* Unauthenticated Guest Handle Banner */}
                {!session?.user && (
                  <div className="mb-2.5 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground text-[11px] uppercase font-bold">Posting as:</span>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your Guest Name"
                      maxLength={25}
                      className="px-2.5 py-1 rounded-xl bg-secondary border border-border text-xs text-foreground font-bold outline-none w-36"
                    />
                    <Link href="/sign-in" className="text-primary hover:underline text-[11px] font-bold ml-auto">
                      Sign in for Verified Badge →
                    </Link>
                  </div>
                )}

                <form onSubmit={handleSendGlobal} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaTagBox((prev) => !prev)}
                    className={`p-2.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
                      showMediaTagBox || mediaTagInput
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground hover:text-foreground border-border'
                    }`}
                    title="Attach Movie/Anime Recommendation Tag"
                  >
                    <Film size={17} />
                  </button>

                  <input
                    type="text"
                    required
                    value={globalInput}
                    onChange={(e) => setGlobalInput(e.target.value)}
                    placeholder="Type a message to the 7MEDIA community (Press Enter to send)..."
                    maxLength={1000}
                    className="flex-1 h-12 rounded-2xl border border-border bg-secondary/60 px-4 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                  />

                  <button
                    type="submit"
                    disabled={isSendingGlobal || !globalInput.trim()}
                    className="h-12 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSendingGlobal ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Guidelines & Direct Support Link */}
            <div className="space-y-4">
              <div className="p-5 rounded-3xl border border-border bg-card/70 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <ShieldCheck size={16} />
                  <span>Lounge Guidelines</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <li>• Keep discussions friendly and respectful.</li>
                  <li>• Use the Movie Tag button to recommend titles.</li>
                  <li>• Spoilers are prohibited without warning.</li>
                  <li>• Click the DM button next to any user to message them privately.</li>
                </ul>
              </div>

              <div className="p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 via-zinc-900/80 to-zinc-950 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Crown size={16} />
                  <span>Admin Direct Support</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Have a private inquiry, bug report, or title request? Message Admin directly in 1-on-1 chat.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!session?.user) {
                      alert('Please sign in to send direct messages to Admin Support.')
                      return
                    }
                    setActiveTab('dm')
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Open Direct Messages</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 1-ON-1 DIRECT MESSAGES & ADMIN SUPPORT                             */}
        {/* ========================================================================= */}
        {activeTab === 'dm' && (
          <div className="h-[75vh] rounded-3xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col md:flex-row">
            {/* Left Column: Conversation Threads List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-border bg-secondary/30 flex flex-col ${
                !showMobileDmList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search Header */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {isAdmin ? 'Admin Conversations' : 'Your Messages'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-full border border-border">
                    {threadsData?.threads?.length || 0} chats
                  </span>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={dmSearchQuery}
                    onChange={(e) => setDmSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-border text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                {filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    <Mail size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-bold">No conversations found</p>
                    <p className="text-[11px] mt-1">Start chatting with users from the Global Lounge or message Admin.</p>
                  </div>
                ) : (
                  filteredThreads.map((thread: any) => {
                    const isSelected = selectedPartnerId === thread.partnerId
                    const isPartnerAdmin = thread.partnerRole === 'admin'

                    return (
                      <button
                        key={thread.partnerId}
                        type="button"
                        onClick={() => {
                          setSelectedPartnerId(thread.partnerId)
                          setShowMobileDmList(false)
                        }}
                        className={`w-full p-4 flex items-center gap-3 text-left transition active:bg-secondary/80 cursor-pointer ${
                          isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-card/50'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center border font-bold text-xs ${
                            isPartnerAdmin
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                              : 'bg-secondary border-border text-foreground'
                          }`}
                        >
                          {thread.partnerImage && thread.partnerImage.startsWith('http') ? (
                            <img src={thread.partnerImage} alt={thread.partnerName} className="w-full h-full object-cover" />
                          ) : isPartnerAdmin ? (
                            <Crown size={18} className="text-amber-400" />
                          ) : (
                            <span>{thread.partnerName?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {thread.partnerName}
                            </span>
                            {thread.lastTimestamp && thread.lastTimestamp !== 0 && (
                              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                {new Date(thread.lastTimestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                        </div>

                        {/* Unread Badge */}
                        {thread.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black shrink-0">
                            {thread.unreadCount}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right Column: Active DM Chat Window */}
            <div
              className={`flex-1 flex flex-col bg-card/90 ${
                showMobileDmList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedPartnerId ? (
                <>
                  {/* Chat Header */}
                  <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-secondary/40">
                    <div className="flex items-center gap-3">
                      {/* Mobile Back Button */}
                      <button
                        type="button"
                        onClick={() => setShowMobileDmList(true)}
                        className="md:hidden p-1.5 rounded-xl hover:bg-secondary text-muted-foreground"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      <div className="w-9 h-9 rounded-2xl bg-secondary border border-border flex items-center justify-center font-bold text-xs overflow-hidden">
                        {partnerImage && partnerImage.startsWith('http') ? (
                          <img src={partnerImage} alt={partnerName} className="w-full h-full object-cover" />
                        ) : partnerRole === 'admin' ? (
                          <Crown size={16} className="text-amber-400" />
                        ) : (
                          <span>{partnerName?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-foreground">
                            {partnerName}
                          </h3>
                          {partnerRole === 'admin' && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black uppercase">
                              <Crown size={9} /> Verified Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Direct 1-on-1 Channel
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 scrollbar-thin">
                    {isActiveDmLoading && (!activeDmData?.messages || activeDmData.messages.length === 0) ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <p className="text-xs font-semibold">Loading conversation...</p>
                      </div>
                    ) : activeDmData?.messages?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                          <MessageSquare size={24} />
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Start of Conversation</h4>
                        <p className="text-xs max-w-xs text-muted-foreground">
                          Send a message to begin your direct conversation.
                        </p>
                      </div>
                    ) : (
                      activeDmData?.messages?.map((msg: any) => {
                        const isMe = msg.senderId === activeDmData?.currentUserId

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md break-words ${
                                isMe
                                  ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                                  : 'bg-secondary/90 border border-border text-foreground rounded-tl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground font-mono">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && <CheckCheck size={12} className={msg.isRead ? 'text-cyan-400' : 'opacity-40'} />}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={dmMessagesEndRef} />
                  </div>

                  {/* Message Input Field */}
                  <div className="p-3 sm:p-4 border-t border-border bg-card">
                    <form onSubmit={handleSendDm} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={dmInput}
                        onChange={(e) => setDmInput(e.target.value)}
                        placeholder={`Reply to ${partnerName}...`}
                        maxLength={2000}
                        className="flex-1 h-12 rounded-2xl border border-border bg-secondary/60 px-4 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                      />

                      <button
                        type="submit"
                        disabled={isSendingDm || !dmInput.trim()}
                        className="h-12 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSendingDm ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Send size={15} />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8">
                  <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-primary mb-3">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Select a conversation</h3>
                  <p className="text-xs max-w-xs mt-1">
                    Choose an existing chat thread or start a new message to Admin Support.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
