'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  MessageSquare,
  Globe2,
  Users,
  Send,
  Trash2,
  Sparkles,
  ShieldCheck,
  Search,
  ArrowLeft,
  Crown,
  Film,
  Smile,
  CheckCheck,
  Loader2,
  PlusCircle,
  Mail,
  ChevronRight,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
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
import { AuthPromptModal } from '@/components/auth-prompt-modal'
import { CustomDialogModal } from '@/components/custom-dialog-modal'

const QUICK_EMOJIS = ['🍿', '🔥', '❤️', '🎬', '🚀', '😂', '👏', '⚡', '💯', '🎉']

export default function ChatPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'global' | 'dm'>('global')
  const [isAdmin, setIsAdmin] = useState(false)

  // Modals & Toast State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalFeature, setAuthModalFeature] = useState('1-on-1 Direct Messages')
  const [authModalDescription, setAuthModalDescription] = useState('Sign in to chat privately with other viewers and access Admin Support.')
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message })
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current))
    }, 4000)
  }

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

  // DM Threads Polling (every 4s)
  const {
    data: threadsData,
    mutate: mutateThreads,
    isLoading: isThreadsLoading,
  } = useSWR(
    session?.user ? 'dm_threads' : null,
    () => getDirectMessageThreads(),
    {
      refreshInterval: 4000,
      revalidateOnFocus: true,
    }
  )

  // Active DM Conversation Polling (every 2.5s)
  const {
    data: activeDmData,
    mutate: mutateActiveDm,
    isLoading: isActiveDmLoading,
  } = useSWR(
    selectedPartnerId && session?.user ? ['dm_conversation', selectedPartnerId] : null,
    () => getDirectMessagesWithUser(selectedPartnerId!),
    {
      refreshInterval: 2500,
      revalidateOnFocus: true,
    }
  )

  // Check Admin status on mount
  useEffect(() => {
    async function checkRole() {
      if (session?.user) {
        const res = await verifyIsAdmin()
        setIsAdmin(res.isAdmin)
      } else {
        setIsAdmin(false)
      }
    }
    checkRole()
  }, [session])

  // Select Admin Support thread by default if no active partner and user is regular user
  useEffect(() => {
    if (activeTab === 'dm' && !selectedPartnerId && threadsData?.threads?.length) {
      const defaultPartner = threadsData.threads[0]
      setSelectedPartnerId(defaultPartner.partnerId)
    }
  }, [activeTab, selectedPartnerId, threadsData])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === 'global') {
      globalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [globalData?.messages?.length, activeTab])

  useEffect(() => {
    if (activeTab === 'dm' && selectedPartnerId) {
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
    const mediaTag = mediaTagInput.trim() || null

    setGlobalInput('')
    setMediaTagInput('')
    setShowMediaTagBox(false)
    setIsSendingGlobal(true)
    setGlobalError(null)

    try {
      const res = await postGlobalChatMessage({
        content: messageText,
        mediaTag,
        guestName: !session?.user ? guestName : undefined,
      })

      if (!res.success) {
        setGlobalError(res.error || 'Failed to send message.')
        showToast(res.error || 'Failed to send message.', 'error')
      } else {
        await mutateGlobal()
      }
    } catch {
      setGlobalError('Connection error. Please try again.')
      showToast('Connection error. Please try again.', 'error')
    } finally {
      setIsSendingGlobal(false)
    }
  }

  const handleDeleteGlobal = async (id: string) => {
    await deleteGlobalChatMessage(id)
    showToast('Message removed successfully.', 'success')
    mutateGlobal()
  }

  const startDmWithUser = (targetUserId: string) => {
    if (!session?.user) {
      setAuthModalFeature('1-on-1 Direct Messaging')
      setAuthModalDescription('Sign in to message this user directly or receive replies from fellow cinephiles.')
      setAuthModalOpen(true)
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
        showToast(res.error || 'Failed to deliver message.', 'error')
      }
    } catch {
      showToast('Failed to send direct message. Please check network.', 'error')
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

      {/* Floating Animated Custom Toast */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[120] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-zinc-900/90 border-white/20 text-white'
            }`}
          >
            {toast.type === 'error' && <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-primary shrink-0" />}
            
            <p className="text-xs font-medium flex-1 leading-snug">{toast.message}</p>

            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Custom Auth Required Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        feature={authModalFeature}
        description={authModalDescription}
      />

      {/* Custom Delete Confirmation Modal */}
      <CustomDialogModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDeleteGlobal(deleteConfirmId)
        }}
        type="danger"
        title="Delete Message"
        message="Are you sure you want to permanently delete this chat message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
      />

      <main className="flex-1 px-3 sm:px-6 lg:px-10 pb-16 pt-24 md:pt-28 max-w-7xl mx-auto w-full">
        {/* Page Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary mb-1.5">
              <Sparkles size={16} />
              <span>7MEDIA Live Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-foreground uppercase">
              Community &amp; Chat
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Talk cinema with viewers globally or send direct messages and support inquiries to Admin.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-secondary/80 border border-border shrink-0 self-start sm:self-auto">
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
                  setAuthModalFeature('1-on-1 Direct Messages')
                  setAuthModalDescription('Sign in to access your private conversations and message Admin Support directly.')
                  setAuthModalOpen(true)
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
        {/* TAB 1: GLOBAL COMMUNITY LOUNGE                                            */}
        {/* ========================================================================= */}
        {activeTab === 'global' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in duration-200">
            {/* Left 3 Columns: Main Chat Stream */}
            <div className="lg:col-span-3 flex flex-col h-[680px] rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Chat Stream Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-secondary/40">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Live Global Feed
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {globalData?.messages?.length || 0} messages
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe2 size={14} className="text-primary" />
                  <span className="hidden sm:inline">Open to all cinephiles</span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin">
                {isGlobalLoading && !globalData?.messages?.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Syncing Global Lounge...</p>
                  </div>
                ) : globalData?.messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                    <Globe2 size={40} className="text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-bold text-foreground">No messages yet</p>
                    <p className="text-xs max-w-xs mt-1">
                      Be the first to drop a movie recommendation, review, or say hello!
                    </p>
                  </div>
                ) : (
                  globalData?.messages?.map((msg: any) => {
                    const isMsgAuthor = session?.user?.id && session.user.id === msg.userId
                    const isMsgAdmin = msg.userRole === 'admin'

                    return (
                      <div
                        key={msg.id}
                        className={`group flex items-start gap-3 transition-all ${
                          isMsgAuthor ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden font-bold text-xs">
                            {msg.userImage && msg.userImage.startsWith('http') ? (
                              <img src={msg.userImage} alt={msg.userName} className="w-full h-full object-cover" />
                            ) : isMsgAdmin ? (
                              <Crown size={16} className="text-amber-400" />
                            ) : (
                              <span>{msg.userName[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          {isMsgAdmin && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-black text-[9px] shadow">
                              👑
                            </span>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] space-y-1.5 ${
                            isMsgAuthor ? 'items-end text-right' : 'items-start text-left'
                          }`}
                        >
                          {/* Author Header */}
                          <div
                            className={`flex items-center gap-1.5 text-[11px] ${
                              isMsgAuthor ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="font-bold text-foreground truncate max-w-[140px]">
                              {msg.userName}
                            </span>

                            {isMsgAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                                <Crown size={9} /> Admin
                              </span>
                            )}

                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Direct Message Shortcut */}
                            {msg.userId && msg.userId !== session?.user?.id && (
                              <button
                                type="button"
                                onClick={() => startDmWithUser(msg.userId)}
                                title={`Send private message to ${msg.userName}`}
                                className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-primary cursor-pointer"
                              >
                                <Mail size={12} />
                              </button>
                            )}

                            {/* Delete Button (for Admin or Author) */}
                            {(isAdmin || isMsgAuthor) && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(msg.id)}
                                title="Delete message"
                                className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-rose-500/20 rounded-md text-muted-foreground hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          {/* Tagged Title Chip */}
                          {msg.mediaTag && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
                              <Film size={12} />
                              <span>{msg.mediaTag}</span>
                            </div>
                          )}

                          {/* Message Content Bubble */}
                          <div
                            className={`p-3.5 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                              isMsgAuthor
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : isMsgAdmin
                                ? 'bg-amber-950/30 border border-amber-500/30 text-amber-100 rounded-tl-none'
                                : 'bg-secondary/80 border border-border text-foreground rounded-tl-none'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={globalMessagesEndRef} />
              </div>

              {/* Quick Emojis Bar */}
              <div className="px-4 py-2 border-t border-border/50 bg-secondary/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Quick:
                </span>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGlobalInput((prev) => prev + emoji)}
                    className="p-1 rounded-lg hover:bg-secondary text-sm transition-transform active:scale-125 cursor-pointer shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-3 sm:p-4 border-t border-border bg-card">
                {/* Media Tag Input Box */}
                {showMediaTagBox && (
                  <div className="mb-3 p-3 rounded-2xl bg-secondary/50 border border-border space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5 text-primary">
                        <Film size={13} /> Tag a Movie or Series Recommendation
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMediaTagBox(false)}
                        className="hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Interstellar (2014) or Attack on Titan"
                      value={mediaTagInput}
                      onChange={(e) => setMediaTagInput(e.target.value)}
                      maxLength={150}
                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                    />
                  </div>
                )}

                {/* Guest Name Setter (if unauthenticated) */}
                {!session?.user && (
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Posting as:</span>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your nickname"
                        maxLength={25}
                        className="h-7 w-32 rounded-lg border border-border bg-secondary/70 px-2 text-xs font-bold text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalFeature('Verified Cinephile Badge')
                        setAuthModalDescription('Sign in to display your verified profile avatar, unlock persistent history, and direct message viewers.')
                        setAuthModalOpen(true)
                      }}
                      className="text-primary hover:underline font-bold text-[11px]"
                    >
                      Sign In for Verified Badge →
                    </button>
                  </div>
                )}

                {/* Main Input Form */}
                <form onSubmit={handleSendGlobal} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaTagBox((p) => !p)}
                    title="Recommend a Movie/Show tag"
                    className={`h-11 w-11 rounded-2xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      showMediaTagBox || mediaTagInput
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Film size={18} />
                  </button>

                  <input
                    type="text"
                    required
                    value={globalInput}
                    onChange={(e) => setGlobalInput(e.target.value)}
                    placeholder="Type a message to the 7MEDIA community (Press Enter to send)..."
                    maxLength={1000}
                    className="flex-1 h-11 rounded-2xl border border-border bg-secondary/60 px-4 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                  />

                  <button
                    type="submit"
                    disabled={isSendingGlobal || !globalInput.trim()}
                    className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
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

            {/* Right Column: Community Guidelines & Admin Desk */}
            <div className="space-y-4">
              <div className="p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-3">
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
                      setAuthModalFeature('Admin Direct Support')
                      setAuthModalDescription('Sign in to reach 7MEDIA Admin Support directly and track your inquiries.')
                      setAuthModalOpen(true)
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
          <div className="h-[720px] rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl flex overflow-hidden animate-in fade-in duration-200">
            {/* Conversation Threads Sidebar */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-border/80 flex flex-col bg-secondary/30 ${
                !showMobileDmList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                      {isAdmin ? 'All User Inboxes 👑' : 'Direct Messages'}
                    </h2>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase">
                        Admin Mode
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground font-semibold">
                    {filteredThreads.length} threads
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={dmSearchQuery}
                    onChange={(e) => setDmSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-9 rounded-xl border border-border bg-background/80 pl-9 pr-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                {isThreadsLoading ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                    <p className="text-xs">Loading conversations...</p>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Mail size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-bold text-foreground">No conversations found</p>
                    <p className="text-[11px] leading-relaxed">
                      Start a chat with Admin Support or click DM on any message in Global Lounge.
                    </p>
                  </div>
                ) : (
                  filteredThreads.map((thread: any) => {
                    const isSelected = thread.partnerId === selectedPartnerId

                    return (
                      <button
                        key={thread.partnerId}
                        type="button"
                        onClick={() => {
                          setSelectedPartnerId(thread.partnerId)
                          setShowMobileDmList(false)
                        }}
                        className={`w-full p-4 flex items-center gap-3 text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-primary/15 border-l-4 border-l-primary'
                            : 'hover:bg-secondary/60'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center font-bold text-xs overflow-hidden">
                            {thread.partnerImage && thread.partnerImage.startsWith('http') ? (
                              <img src={thread.partnerImage} alt={thread.partnerName} className="w-full h-full object-cover" />
                            ) : thread.partnerRole === 'admin' ? (
                              <Crown size={18} className="text-amber-400" />
                            ) : (
                              <span>{thread.partnerName?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          {thread.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-black text-[9px] shadow animate-pulse">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                              {thread.partnerName}
                              {thread.partnerRole === 'admin' && (
                                <Crown size={12} className="text-amber-400 shrink-0" />
                              )}
                            </h3>
                            {thread.lastTimestamp && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(thread.lastTimestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {thread.lastMessage || 'Click to open conversation'}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Active Conversation Main View */}
            <div
              className={`flex-1 flex flex-col bg-background/50 ${
                showMobileDmList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedPartnerId ? (
                <>
                  {/* Conversation Top Header */}
                  <div className="px-5 py-3.5 border-b border-border/80 bg-secondary/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                    {isActiveDmLoading && !activeDmData?.messages?.length ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-xs font-bold uppercase tracking-wider">Loading conversation...</p>
                      </div>
                    ) : activeDmData?.messages?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                        <Mail size={40} className="text-muted-foreground/30 mb-3" />
                        <h4 className="text-sm font-bold text-foreground">No messages in this thread</h4>
                        <p className="text-xs max-w-xs mt-1">
                          Send your first message below to begin direct communication.
                        </p>
                      </div>
                    ) : (
                      activeDmData?.messages?.map((msg: any) => {
                        const isMine = msg.senderId === session?.user?.id

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isMine ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                                isMine
                                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                                  : 'bg-secondary/80 border border-border text-foreground rounded-tl-none'
                              }`}
                            >
                              {msg.content}
                            </div>

                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground px-1">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMine && (
                                <span title={msg.isRead ? 'Read' : 'Delivered'}>
                                  <CheckCheck
                                    size={12}
                                    className={msg.isRead ? 'text-cyan-400' : 'text-muted-foreground'}
                                  />
                                </span>
                              )}
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
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <MessageSquare size={48} className="text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-bold text-foreground uppercase tracking-wider">
                    Select a Conversation
                  </h3>
                  <p className="text-xs max-w-sm mt-1">
                    Choose a thread from the list on the left to start reading and replying to messages.
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
