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
  Flame,
  Star,
  Radio,
  Copy,
  Heart,
  Share2,
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

const QUICK_EMOJIS = ['🍿', '🔥', '❤️', '🎬', '🚀', '😂', '👏', '⚡', '💯', '🎉', '👾', '💎', '🌟', '🤯']
const SAMPLE_RECOMMENDATIONS = ['Interstellar', 'Attack on Titan', 'Oppenheimer', 'Solo Leveling', 'Spirited Away', 'The Dark Knight']

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
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const globalContainerRef = useRef<HTMLDivElement>(null)

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
  const dmContainerRef = useRef<HTMLDivElement>(null)

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

  // Scroll strictly INSIDE the chat container without shifting webpage / footer
  useEffect(() => {
    if (activeTab === 'global' && globalContainerRef.current) {
      globalContainerRef.current.scrollTop = globalContainerRef.current.scrollHeight
    }
  }, [globalData?.messages?.length, activeTab])

  useEffect(() => {
    if (activeTab === 'dm' && selectedPartnerId && dmContainerRef.current) {
      dmContainerRef.current.scrollTop = dmContainerRef.current.scrollHeight
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

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    showToast('Message copied to clipboard!', 'info')
    setTimeout(() => setCopiedMsgId(null), 2000)
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
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] -z-10" />
      <div className="pointer-events-none fixed bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[160px] -z-10" />
      <div className="pointer-events-none fixed top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-600/10 blur-[130px] -z-10" />

      <Navbar />

      {/* Floating Animated Custom Toast */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[120] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/30'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30'
                : 'bg-zinc-900/90 border-white/20 text-white'
            }`}
          >
            {toast.type === 'error' && <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles size={18} className="text-primary shrink-0" />}
            
            <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>

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
        {/* Page Top Header with Neon Accents */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.25em] text-primary mb-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="bg-gradient-to-r from-primary via-rose-400 to-amber-300 bg-clip-text text-transparent">
                7MEDIA Realtime Cinema Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white uppercase flex items-center gap-3">
              <span>Community &amp; Lounge</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold tracking-wider align-middle hidden sm:inline-flex items-center gap-1">
                <Radio size={12} className="animate-pulse" /> Live
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
              Connect with fellow cinephiles, share live movie recommendations, or chat 1-on-1 with Admin Support.
            </p>
          </div>

          {/* Luxury Navigation Pill Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl shrink-0 self-start sm:self-auto shadow-xl">
            <button
              type="button"
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'global'
                  ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-lg shadow-primary/30 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Globe2 size={16} className={activeTab === 'global' ? 'text-white' : 'text-primary'} />
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
              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'dm'
                  ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-lg shadow-primary/30 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <MessageSquare size={16} className={activeTab === 'dm' ? 'text-white' : 'text-primary'} />
              <span>Direct Messages</span>
              {threadsData?.threads?.some((t: any) => t.unreadCount > 0) && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
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
            <div className="lg:col-span-3 flex flex-col h-[700px] rounded-3xl border border-white/10 bg-zinc-950/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Chat Stream Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-zinc-900/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      Live Community Stream
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400">
                      {globalData?.messages?.length || 0} messages synced in realtime
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 bg-zinc-900/80 border border-white/10 px-3 py-1.5 rounded-xl shadow-inner">
                  <Flame size={14} className="text-primary animate-pulse" />
                  <span className="hidden sm:inline">Open to All Viewers</span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div ref={globalContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin">
                {isGlobalLoading && !globalData?.messages?.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-300">Connecting to Cinema Lounge...</p>
                  </div>
                ) : globalData?.messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-400">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-3 text-primary shadow-xl">
                      <Globe2 size={32} />
                    </div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">No messages yet</p>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                      Be the first to drop a movie recommendation, review a trending anime, or say hello!
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
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center overflow-hidden font-black text-xs shadow-md ${
                              isMsgAdmin
                                ? 'bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 text-black border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                : isMsgAuthor
                                ? 'bg-gradient-to-br from-primary to-rose-700 text-white border border-primary/50'
                                : 'bg-zinc-800/90 text-zinc-200 border border-white/10'
                            }`}
                          >
                            {msg.userImage && msg.userImage.startsWith('http') ? (
                              <img src={msg.userImage} alt={msg.userName} className="w-full h-full object-cover" />
                            ) : isMsgAdmin ? (
                              <Crown size={18} className="text-black" />
                            ) : (
                              <span>{msg.userName[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          {isMsgAdmin && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black text-[9px] font-bold shadow-lg">
                              👑
                            </span>
                          )}
                        </div>

                        {/* Message Bubble Column */}
                        <div
                          className={`max-w-[84%] sm:max-w-[72%] space-y-1.5 ${
                            isMsgAuthor ? 'items-end text-right' : 'items-start text-left'
                          }`}
                        >
                          {/* Author Header */}
                          <div
                            className={`flex items-center gap-1.5 text-[11px] ${
                              isMsgAuthor ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="font-bold text-zinc-200 truncate max-w-[150px]">
                              {msg.userName}
                            </span>

                            {isMsgAdmin ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase tracking-wider shadow-sm">
                                <Crown size={10} /> Verified Admin
                              </span>
                            ) : msg.userId ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 text-[8px] font-bold uppercase">
                                Cinephile
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-zinc-800/60 text-zinc-500 text-[8px] font-bold uppercase">
                                Guest
                              </span>
                            )}

                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Quick Action Tools */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                              {/* Copy text */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                title="Copy text"
                                className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                              >
                                <Copy size={11} />
                              </button>

                              {/* Direct Message Shortcut */}
                              {msg.userId && msg.userId !== session?.user?.id && (
                                <button
                                  type="button"
                                  onClick={() => startDmWithUser(msg.userId)}
                                  title={`Send private message to ${msg.userName}`}
                                  className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-primary transition cursor-pointer"
                                >
                                  <Mail size={11} />
                                </button>
                              )}

                              {/* Delete Button (for Admin or Author) */}
                              {(isAdmin || isMsgAuthor) && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(msg.id)}
                                  title="Delete message"
                                  className="p-1 hover:bg-rose-500/20 rounded-md text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Tagged Title Chip */}
                          {msg.mediaTag && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/15 border border-primary/35 text-rose-300 text-xs font-bold shadow-sm backdrop-blur-md">
                              <Film size={12} className="text-primary" />
                              <span>{msg.mediaTag}</span>
                            </div>
                          )}

                          {/* Message Content Bubble */}
                          <div
                            className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md transition-all ${
                              isMsgAuthor
                                ? 'bg-gradient-to-br from-primary to-rose-700 text-white rounded-tr-none shadow-primary/20'
                                : isMsgAdmin
                                ? 'bg-gradient-to-br from-amber-950/70 via-zinc-900/90 to-amber-950/40 border border-amber-500/40 text-amber-100 rounded-tl-none shadow-amber-950/40'
                                : 'bg-zinc-900/90 border border-white/10 text-zinc-200 rounded-tl-none hover:border-white/20'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Quick Emojis Bar */}
              <div className="px-4 py-2 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 shrink-0 flex items-center gap-1 mr-1">
                  <Sparkles size={11} className="text-primary" /> React:
                </span>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGlobalInput((prev) => prev + emoji)}
                    className="p-1.5 rounded-xl hover:bg-zinc-800/80 text-sm transition-all hover:scale-125 active:scale-95 cursor-pointer shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl">
                {/* Media Tag Input Box */}
                {showMediaTagBox && (
                  <div className="mb-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-primary/30 space-y-2.5 animate-in slide-in-from-bottom-2 duration-200 shadow-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                      <span className="flex items-center gap-1.5 text-primary">
                        <Film size={14} /> Tag a Movie or Series Recommendation
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMediaTagBox(false)}
                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. Interstellar (2014) or Solo Leveling"
                      value={mediaTagInput}
                      onChange={(e) => setMediaTagInput(e.target.value)}
                      maxLength={150}
                      className="w-full h-9 rounded-xl border border-white/15 bg-zinc-950 px-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-primary transition"
                    />

                    {/* Quick suggestion pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Popular:</span>
                      {SAMPLE_RECOMMENDATIONS.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => setMediaTagInput(title)}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-primary/20 border border-white/5 hover:border-primary/40 text-[10px] text-zinc-300 hover:text-primary transition"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guest Name Setter (if unauthenticated) */}
                {!session?.user && (
                  <div className="mb-2.5 flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-medium">Posting as:</span>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your nickname"
                        maxLength={25}
                        className="h-7 w-32 rounded-lg border border-white/15 bg-zinc-900 px-2 text-xs font-bold text-white outline-none focus:border-primary transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalFeature('Verified Cinephile Badge')
                        setAuthModalDescription('Sign in to display your verified profile avatar, unlock persistent history, and direct message viewers.')
                        setAuthModalOpen(true)
                      }}
                      className="text-primary hover:text-rose-400 transition font-bold text-[11px] flex items-center gap-1"
                    >
                      Sign In for Verified Badge <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {/* Main Input Form */}
                <form onSubmit={handleSendGlobal} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaTagBox((p) => !p)}
                    title="Recommend a Movie/Show tag"
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      showMediaTagBox || mediaTagInput
                        ? 'bg-primary/25 border-primary text-primary shadow-[0_0_15px_rgba(229,9,20,0.3)]'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                    className="flex-1 h-12 rounded-2xl border border-white/15 bg-zinc-900/90 px-4 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition focus:border-primary focus:bg-zinc-900 focus:ring-2 focus:ring-primary/20 shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={isSendingGlobal || !globalInput.trim()}
                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-primary to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer shrink-0"
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
              {/* Admin Support VIP Card */}
              <div className="p-5 rounded-3xl border border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-zinc-900/90 to-zinc-950 shadow-[0_10px_30px_rgba(245,158,11,0.15)] space-y-3.5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-amber-400">
                  <Crown size={17} className="text-amber-400 animate-bounce" />
                  <span>Admin Direct Support</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Need title requests, error reports, or private assistance? Chat directly with 7MEDIA administrators in real-time.
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
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={14} className="text-black" />
                  <span>Open Direct Messages</span>
                </button>
              </div>

              {/* Guidelines Card */}
              <div className="p-5 rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                  <ShieldCheck size={16} />
                  <span>Lounge Guidelines</span>
                </div>
                <ul className="text-xs text-zinc-400 space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Respect fellow viewers and creators.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Tag movies/anime using the 🎬 button.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>No spoilers without clear warnings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Click the ✉️ icon on any message to DM privately.</span>
                  </li>
                </ul>
              </div>

              {/* Live Community Perks Card */}
              <div className="p-5 rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl space-y-2.5 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                  <Star size={15} className="text-yellow-400" />
                  <span>Cinephile Perks</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sign in to get verified badges, customize your crimson avatar, and participate in synchronized Watch Parties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 1-ON-1 DIRECT MESSAGES & ADMIN SUPPORT                             */}
        {/* ========================================================================= */}
        {activeTab === 'dm' && (
          <div className="h-[720px] rounded-3xl border border-white/10 bg-zinc-950/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex overflow-hidden animate-in fade-in duration-200">
            {/* Conversation Threads Sidebar */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-zinc-900/40 backdrop-blur-md ${
                !showMobileDmList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      {isAdmin ? 'All User Inboxes 👑' : 'Direct Messages'}
                    </h2>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase">
                        Admin Mode
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-zinc-400 font-bold bg-zinc-800/60 px-2 py-0.5 rounded-lg border border-white/5">
                    {filteredThreads.length}
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={dmSearchQuery}
                    onChange={(e) => setDmSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-10 rounded-xl border border-white/15 bg-zinc-950/90 pl-10 pr-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-primary transition"
                  />
                  {dmSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDmSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
                {isThreadsLoading ? (
                  <div className="p-8 text-center text-zinc-400 space-y-2">
                    <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Loading conversations...</p>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-600">
                      <Mail size={22} />
                    </div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">No conversations found</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      Start a chat with Admin Support or click the DM icon on any message in Global Lounge.
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
                            ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-l-4 border-l-primary'
                            : 'hover:bg-zinc-800/40'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs overflow-hidden shadow-md ${
                              thread.partnerRole === 'admin'
                                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black border border-amber-300'
                                : 'bg-zinc-800 text-zinc-200 border border-white/10'
                            }`}
                          >
                            {thread.partnerImage && thread.partnerImage.startsWith('http') ? (
                              <img src={thread.partnerImage} alt={thread.partnerName} className="w-full h-full object-cover" />
                            ) : thread.partnerRole === 'admin' ? (
                              <Crown size={18} className="text-black" />
                            ) : (
                              <span>{thread.partnerName?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          {thread.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-primary text-white font-black text-[9px] shadow-[0_0_8px_rgba(229,9,20,0.8)] animate-pulse">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              {thread.partnerName}
                              {thread.partnerRole === 'admin' && (
                                <Crown size={12} className="text-amber-400 shrink-0" />
                              )}
                            </h3>
                            {thread.lastTimestamp && (
                              <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                {new Date(thread.lastTimestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 truncate">
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
              className={`flex-1 flex flex-col bg-zinc-950/50 ${
                showMobileDmList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedPartnerId ? (
                <>
                  {/* Conversation Top Header */}
                  <div className="px-5 py-3.5 border-b border-white/10 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowMobileDmList(true)}
                        className="md:hidden p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs overflow-hidden shadow-md ${
                          partnerRole === 'admin'
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black border border-amber-300'
                            : 'bg-zinc-800 text-zinc-200 border border-white/10'
                        }`}
                      >
                        {partnerImage && partnerImage.startsWith('http') ? (
                          <img src={partnerImage} alt={partnerName} className="w-full h-full object-cover" />
                        ) : partnerRole === 'admin' ? (
                          <Crown size={16} className="text-black" />
                        ) : (
                          <span>{partnerName?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-black text-white">
                            {partnerName}
                          </h3>
                          {partnerRole === 'admin' && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase">
                              <Crown size={9} /> Verified Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" /> Direct 1-on-1 Channel
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div ref={dmContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 scrollbar-thin">
                    {isActiveDmLoading && !activeDmData?.messages?.length ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-xs font-bold uppercase tracking-wider">Syncing thread...</p>
                      </div>
                    ) : activeDmData?.messages?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 p-6">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-600 mb-3">
                          <Mail size={26} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">No messages in this thread</h4>
                        <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                          Send your message below to begin direct communication.
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
                              className={`max-w-[82%] sm:max-w-[70%] p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md ${
                                isMine
                                  ? 'bg-gradient-to-br from-primary to-rose-700 text-white rounded-tr-none shadow-primary/20'
                                  : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-none'
                              }`}
                            >
                              {msg.content}
                            </div>

                            <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 px-1 font-mono">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMine && (
                                <span title={msg.isRead ? 'Read' : 'Delivered'}>
                                  <CheckCheck
                                    size={13}
                                    className={msg.isRead ? 'text-cyan-400' : 'text-zinc-600'}
                                  />
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Message Input Field */}
                  <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl">
                    <form onSubmit={handleSendDm} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={dmInput}
                        onChange={(e) => setDmInput(e.target.value)}
                        placeholder={`Reply to ${partnerName}...`}
                        maxLength={2000}
                        className="flex-1 h-12 rounded-2xl border border-white/15 bg-zinc-900/90 px-4 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition focus:border-primary focus:bg-zinc-900 focus:ring-2 focus:ring-primary/20 shadow-inner"
                      />

                      <button
                        type="submit"
                        disabled={isSendingDm || !dmInput.trim()}
                        className="h-12 px-6 rounded-2xl bg-gradient-to-r from-primary to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer shrink-0"
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
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-3 text-zinc-600 shadow-xl">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Select a Conversation
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                    Choose a thread from the list on the left to read and reply to messages.
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
