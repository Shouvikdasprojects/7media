'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useSession } from '@/lib/auth-client'
import {
  verifyIsAdmin,
  getAdminStats,
  getAdminUsersList,
  getAdminContactMessages,
  replyToContactMessage,
  deleteContactMessage,
  sendSystemBroadcast,
} from '@/app/actions/admin'
import {
  ShieldAlert,
  Users,
  Inbox,
  Radio,
  BarChart3,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Shield,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = useSession()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'inbox' | 'broadcast'>('overview')

  // Stats
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Users
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)

  // Inbox
  const [messages, setMessages] = useState<any[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [activeMessage, setActiveMessage] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastType, setBroadcastType] = useState<'info' | 'release' | 'system' | 'social'>('system')
  const [broadcastLink, setBroadcastLink] = useState('')
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false)

  // Toast / Notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // 1. Initial Admin Verification
  useEffect(() => {
    async function checkAuth() {
      const res = await verifyIsAdmin()
      if (!res.isAdmin) {
        setIsAdmin(false)
      } else {
        setIsAdmin(true)
        loadStats()
        loadUsers()
        loadInbox()
      }
    }
    if (!sessionLoading) {
      checkAuth()
    }
  }, [sessionLoading])

  const loadStats = async () => {
    setStatsLoading(true)
    const res = await getAdminStats()
    setStatsLoading(false)
    if (res.success) setStats(res.stats)
  }

  const loadUsers = async (search?: string) => {
    setUsersLoading(true)
    const res = await getAdminUsersList({ search })
    setUsersLoading(false)
    if (res.success) setUsers(res.users || [])
  }

  const loadInbox = async () => {
    setInboxLoading(true)
    const res = await getAdminContactMessages()
    setInboxLoading(false)
    if (res.success) setMessages(res.messages || [])
  }

  const handleSearchUsers = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(userSearch)
  }

  const handleOpenReplyModal = (msg: any) => {
    setActiveMessage(msg)
    setReplyText(msg.replyText || '')
    setReplyModalOpen(true)
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeMessage || !replyText.trim()) return

    setIsSendingReply(true)
    const res = await replyToContactMessage({ id: activeMessage.id, replyText: replyText.trim() })
    setIsSendingReply(false)

    if (res.success) {
      showToast(res.message || 'Reply dispatched via 7media.support@gmail.com!')
      setReplyModalOpen(false)
      loadInbox()
    } else {
      showToast(res.error || 'Failed to dispatch reply', 'error')
    }
  }

  const handleDeleteMsg = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    const res = await deleteContactMessage(id)
    if (res.success) {
      showToast('Message deleted.')
      loadInbox()
    } else {
      showToast('Failed to delete message', 'error')
    }
  }

  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return

    setIsPublishingBroadcast(true)
    const res = await sendSystemBroadcast({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: broadcastType,
      link: broadcastLink.trim(),
    })
    setIsPublishingBroadcast(false)

    if (res.success) {
      showToast('Global notification broadcast published!')
      setBroadcastTitle('')
      setBroadcastMessage('')
      setBroadcastLink('')
    } else {
      showToast(res.error || 'Failed to publish broadcast', 'error')
    }
  }

  if (sessionLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground">Verifying 7MEDIA Admin Privileges...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl border border-destructive/30 bg-destructive/10 text-center space-y-4 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-black font-display uppercase tracking-tight text-foreground">Access Restricted</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This Control Panel is strictly reserved for authenticated 7MEDIA Platform Administrators (<code>shouvikdaswork@gmail.com</code>).
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition shadow-md"
            >
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Toast alert */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-bold animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-2.5 ${
              toast.type === 'error'
                ? 'bg-destructive/90 text-destructive-foreground border-destructive/50'
                : 'bg-emerald-600/90 text-white border-emerald-500/50'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Admin Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-rose-600 to-amber-500 p-0.5 shadow-lg shadow-primary/20">
              <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center text-primary">
                <ShieldCheck size={28} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-foreground">
                  7MEDIA Admin Panel
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                  Master Root
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Global Network Oversight, Contact Desk Dispatch &amp; Community Control
              </p>
            </div>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadStats()
                loadUsers()
                loadInbox()
                showToast('Dashboard reloaded.')
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className={statsLoading || usersLoading || inboxLoading ? 'animate-spin' : ''} />
              <span>Sync Live Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-border/50 no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 size={15} />
            <span>Overview &amp; Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={15} />
            <span>Users &amp; Auth</span>
            {stats && <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-full text-[10px]">{stats.totalUsers}</span>}
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'inbox'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Inbox size={15} />
            <span>Contact Desk</span>
            {stats?.unreadMessages > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {stats.unreadMessages} NEW
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio size={15} />
            <span>Broadcast Alerts</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                  <Users size={18} className="text-primary" />
                </div>
                <p className="text-3xl font-black font-display text-foreground">{stats?.totalUsers ?? '...'}</p>
                <p className="text-[11px] text-muted-foreground">Registered on 7MEDIA</p>
              </div>

              <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">2FA Protected</span>
                  <ShieldCheck size={18} className="text-emerald-400" />
                </div>
                <p className="text-3xl font-black font-display text-emerald-400">{stats?.twoFactorActive ?? '...'}</p>
                <p className="text-[11px] text-muted-foreground">Active Two-Factor Accounts</p>
              </div>

              <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Catalogs</span>
                  <Sparkles size={18} className="text-amber-400" />
                </div>
                <p className="text-3xl font-black font-display text-foreground">{stats?.totalCatalogs ?? '...'}</p>
                <p className="text-[11px] text-muted-foreground">User custom lists</p>
              </div>

              <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Contact Inquiries</span>
                  <Inbox size={18} className="text-rose-400" />
                </div>
                <p className="text-3xl font-black font-display text-foreground">{stats?.totalMessages ?? '...'}</p>
                <p className="text-[11px] text-rose-400 font-bold">{stats?.unreadMessages ?? 0} Pending unread</p>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-black font-display uppercase tracking-wider text-foreground">
                Production Health &amp; Gateway Nodes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Cloudflare Edge Gateway</p>
                    <p className="text-[11px] text-muted-foreground">7media.pages.dev (Active)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Neon PostgreSQL Database</p>
                    <p className="text-[11px] text-muted-foreground">Pooler Connected (Active)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Gmail SMTP Dispatcher</p>
                    <p className="text-[11px] text-muted-foreground">7media.support@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search Bar */}
            <form onSubmit={handleSearchUsers} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border bg-card/70 text-xs font-medium text-foreground outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="px-5 h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Users Table */}
            <div className="rounded-3xl border border-border bg-card/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground border-b border-border uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Email Verified</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-secondary/30 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                              {u.image ? (
                                <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-xs">{u.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                              )}
                            </div>
                            <span className="font-bold text-foreground">{u.name || 'Anonymous User'}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-muted-foreground">{u.email}</td>
                        <td className="p-4">
                          {u.emailVerified ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              u.role === 'admin'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-secondary text-muted-foreground border border-border'
                            }`}
                          >
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACT INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black font-display uppercase tracking-tight text-foreground">
                Contact Desk Inquiries ({messages.length})
              </h2>
              <button
                onClick={loadInbox}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RefreshCw size={13} className={inboxLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-6 rounded-3xl border transition space-y-4 ${
                    msg.status === 'unread'
                      ? 'bg-card border-primary/40 shadow-lg shadow-primary/5'
                      : 'bg-card/60 border-border opacity-90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-secondary/80 flex items-center justify-center text-foreground font-bold">
                        {msg.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{msg.name}</h4>
                        <p className="text-xs font-mono text-muted-foreground">{msg.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          msg.status === 'unread'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : msg.status === 'replied'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-secondary text-muted-foreground border border-border'
                        }`}
                      >
                        {msg.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                      Topic: {msg.topic}
                    </p>
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-secondary/30 p-3.5 rounded-2xl border border-border/40">
                      {msg.message}
                    </p>
                  </div>

                  {msg.replyText && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Dispatched Reply:
                      </p>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap">{msg.replyText}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleOpenReplyModal(msg)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-sm cursor-pointer"
                    >
                      <Mail size={13} />
                      <span>{msg.replyText ? 'Send Another Reply' : 'Reply via Email'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMsg(msg.id)}
                      className="p-2 rounded-xl border border-border hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition cursor-pointer"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="p-12 rounded-3xl border border-border bg-card/60 text-center space-y-2">
                  <Inbox size={32} className="mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm font-bold text-foreground">Inbox is Empty</p>
                  <p className="text-xs text-muted-foreground">No inquiries submitted from the contact desk yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="p-8 rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-black font-display uppercase tracking-tight text-foreground flex items-center gap-2">
                  <Radio size={20} className="text-primary animate-pulse" />
                  <span>Publish System Broadcast</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Dispatch an instant live notification banner to all registered users on 7MEDIA.
                </p>
              </div>

              <form onSubmit={handlePublishBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Anime Season Added / Server Maintenance"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-secondary/40 text-xs font-medium text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Notification Type
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-secondary/40 text-xs font-medium text-foreground outline-none focus:border-primary"
                  >
                    <option value="system">System / Maintenance</option>
                    <option value="release">New Release / Content</option>
                    <option value="info">General Info</option>
                    <option value="social">Community &amp; Watch Party</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Target Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /movies or /party"
                    value={broadcastLink}
                    onChange={(e) => setBroadcastLink(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-secondary/40 text-xs font-medium text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Message Content
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write the message that users will see in their notification drawer..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-border bg-secondary/40 text-xs font-medium text-foreground outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPublishingBroadcast}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPublishingBroadcast ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Broadcast to All Users</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Reply Modal */}
      {replyModalOpen && activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl border border-border bg-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Reply to {activeMessage.name}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">{activeMessage.email}</p>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground">
              <strong>Topic:</strong> {activeMessage.topic}
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <textarea
                required
                rows={5}
                placeholder="Type your official support response here. It will be delivered from 7media.support@gmail.com..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-border bg-secondary/40 text-xs text-foreground outline-none focus:border-primary leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Send Support Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
