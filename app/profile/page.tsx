'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useSession, signOut, authClient } from '@/lib/auth-client'
import {
  getUserProfileDetails,
  updateUserProfile,
  changeUserPassword,
  requestPasswordReset,
  resetPasswordWithCode,
  requestAccountDeletionOtp,
  confirmDeleteUserAccountWithOtp,
} from '@/app/actions/profile'
import {
  get2FAStatus,
  requestEnable2FA,
  confirmEnable2FA,
  requestDisable2FA,
  confirmDisable2FA,
  regenerateBackupCodes,
  update2FADeliveryEmail,
} from '@/app/actions/two-factor'
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Mail,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Camera,
  LogOut,
  Sparkles,
  Bookmark,
  FolderHeart,
  History,
  Trophy,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  UploadCloud,
  Check,
  Copy,
  Download,
  Edit3,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'

const AVATAR_PRESETS = [
  { id: 'crimson', name: 'Crimson 7', emoji: '🎬', bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'anime', name: 'Anime Protagonist', emoji: '⚡', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'cyber', name: 'Cyber Neon', emoji: '🌌', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'director', name: 'Film Director', emoji: '🎥', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'shadow', name: 'Mystic Shadow', emoji: '🕶️', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'star', name: 'Golden Star', emoji: '⭐', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'retro', name: 'Retro Reel', emoji: '📼', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'popcorn', name: 'Cinephile', emoji: '🍿', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession()

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'connected' | 'danger'>('profile')
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Profile Edit State
  const [name, setName] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState('crimson')
  const [customPhotoUrl, setCustomPhotoUrl] = useState('')
  const [isPhotoTabCustom, setIsPhotoTabCustom] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [isChangingPass, setIsChangingPass] = useState(false)

  // Password Reset State
  const [resetSent, setResetSent] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [resetNewPass, setResetNewPass] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // 2FA State & Modals
  const [twoFactorState, setTwoFactorState] = useState<{
    enabled: boolean
    deliveryEmail: string
    backupCodesCount: number
    backupCodes: string[]
  }>({
    enabled: false,
    deliveryEmail: '',
    backupCodesCount: 0,
    backupCodes: [],
  })

  const [enable2FAModalOpen, setEnable2FAModalOpen] = useState(false)
  const [enable2FAStep, setEnable2FAStep] = useState<'request' | 'verify' | 'codes'>('request')
  const [enable2FAEmail, setEnable2FAEmail] = useState('')
  const [enable2FACode, setEnable2FACode] = useState('')
  const [enable2FAResendCooldown, setEnable2FAResendCooldown] = useState(0)

  const [disable2FAModalOpen, setDisable2FAModalOpen] = useState(false)
  const [disable2FACode, setDisable2FACode] = useState('')

  const [viewCodesModalOpen, setViewCodesModalOpen] = useState(false)
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false)
  const [changeEmailInput, setChangeEmailInput] = useState('')

  const [is2FAActionLoading, setIs2FAActionLoading] = useState(false)
  const [copiedCodesNotice, setCopiedCodesNotice] = useState(false)

  // Account Deletion State (2-Step Email OTP Flow)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm')
  const [deleteTargetEmail, setDeleteTargetEmail] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteOtp, setDeleteOtp] = useState('')
  const [deleteResendCooldown, setDeleteResendCooldown] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Status Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  // Resend Countdowns
  useEffect(() => {
    if (enable2FAResendCooldown <= 0) return
    const timer = setInterval(() => {
      setEnable2FAResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [enable2FAResendCooldown])

  useEffect(() => {
    if (deleteResendCooldown <= 0) return
    const timer = setInterval(() => {
      setDeleteResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [deleteResendCooldown])

  // Fetch initial profile stats and info
  useEffect(() => {
    getUserProfileDetails().then((res) => {
      if (res.authenticated && res.user) {
        setProfileData(res)
        setName(res.user.name || '')
        setEnable2FAEmail(res.user.email || '')
        setDeleteTargetEmail(res.user.email || '')
        if (res.user.image?.startsWith('http')) {
          setCustomPhotoUrl(res.user.image)
          setIsPhotoTabCustom(true)
        } else if (res.user.image) {
          setSelectedAvatarId(res.user.image)
        }
      }
      setLoading(false)
    })

    // Fetch 2FA Status from PostgreSQL
    get2FAStatus().then((status) => {
      if (status.authenticated) {
        setTwoFactorState({
          enabled: status.enabled,
          deliveryEmail: status.deliveryEmail || '',
          backupCodesCount: status.backupCodesCount || 0,
          backupCodes: status.backupCodes || [],
        })
        if (status.deliveryEmail) {
          setEnable2FAEmail(status.deliveryEmail)
        }
      }
    })
  }, [session?.user])

  useEffect(() => {
    document.title = 'My Profile & Security | 7MEDIA'
  }, [])

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notify('Please enter a valid display name', 'error')
      return
    }

    setIsUpdatingProfile(true)
    const finalImage = isPhotoTabCustom && customPhotoUrl.trim() ? customPhotoUrl.trim() : selectedAvatarId

    const res = await updateUserProfile({
      name: name.trim(),
      image: finalImage,
    })

    setIsUpdatingProfile(false)
    if (res.success) {
      notify('Profile details updated successfully!')
      try {
        localStorage.setItem('7media_avatar', finalImage)
        window.dispatchEvent(new CustomEvent('7media-avatar-changed', { detail: finalImage }))
      } catch {}
      router.refresh()
    } else {
      notify(res.error || 'Failed to update profile', 'error')
    }
  }

  // Handle Custom Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      notify('Image size must be less than 2MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCustomPhotoUrl(reader.result)
        setIsPhotoTabCustom(true)
        notify('Custom photo selected! Click Save Changes to apply.')
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      notify('New password must be at least 6 characters long', 'error')
      return
    }
    if (newPassword !== confirmNewPassword) {
      notify('New passwords do not match', 'error')
      return
    }

    setIsChangingPass(true)
    const res = await changeUserPassword({
      currentPassword: currentPassword || undefined,
      newPassword,
    })
    setIsChangingPass(false)

    if (res.success) {
      notify('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } else {
      notify(res.error || 'Failed to change password', 'error')
    }
  }

  // Handle Password Reset Request
  const handleSendResetEmail = async () => {
    const userEmail = session?.user?.email || profileData?.user?.email
    if (!userEmail) {
      notify('No email address found on account', 'error')
      return
    }

    setIsSendingReset(true)
    const res = await requestPasswordReset(userEmail)
    setIsSendingReset(false)

    if (res.success) {
      setResetSent(true)
      notify('6-digit reset code sent to your email!')
    } else {
      notify(res.error || 'Failed to send reset code', 'error')
    }
  }

  // Handle Password Reset Completion
  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const userEmail = session?.user?.email || profileData?.user?.email
    if (!userEmail) return

    if (!resetCode.trim()) {
      notify('Please enter the 6-digit code', 'error')
      return
    }
    if (resetNewPass.length < 6) {
      notify('Password must be at least 6 characters', 'error')
      return
    }

    setIsResetting(true)
    const res = await resetPasswordWithCode({
      email: userEmail,
      code: resetCode.trim(),
      newPassword: resetNewPass,
    })
    setIsResetting(false)

    if (res.success) {
      notify('Password has been successfully reset! You can now log in with your new password.')
      setResetSent(false)
      setResetCode('')
      setResetNewPass('')
    } else {
      notify(res.error || 'Failed to reset password', 'error')
    }
  }

  // =========================================================================
  // 2FA HANDLERS
  // =========================================================================

  // Step 1: Request 2FA Enable OTP
  const handleStartEnable2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIs2FAActionLoading(true)
    const res = await requestEnable2FA({ deliveryEmail: enable2FAEmail })
    setIs2FAActionLoading(false)

    if (res.success) {
      setEnable2FAStep('verify')
      setEnable2FAResendCooldown(60)
      notify(res.message || 'Activation code sent to your email!')
    } else {
      notify(res.error || 'Failed to send activation code', 'error')
    }
  }

  // Step 2: Confirm 2FA Enable OTP & Receive 6 Backup Codes
  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enable2FACode.trim() || enable2FACode.trim().length !== 6) {
      notify('Please enter the 6-digit activation code', 'error')
      return
    }

    setIs2FAActionLoading(true)
    const res = await confirmEnable2FA({ code: enable2FACode.trim() })
    setIs2FAActionLoading(false)

    if (res.success && res.backupCodes) {
      setTwoFactorState({
        enabled: true,
        deliveryEmail: res.deliveryEmail || enable2FAEmail,
        backupCodesCount: res.backupCodes.length,
        backupCodes: res.backupCodes,
      })
      setEnable2FAStep('codes')
      notify('Two-Factor Authentication activated successfully!')
    } else {
      notify(res.error || 'Failed to activate 2FA', 'error')
    }
  }

  // Request Disable 2FA
  const handleStartDisable2FA = async () => {
    setIs2FAActionLoading(true)
    const res = await requestDisable2FA()
    setIs2FAActionLoading(false)

    if (res.success) {
      setDisable2FAModalOpen(true)
      setDisable2FACode('')
      notify(res.message || 'Confirmation code sent to your 2FA email!')
    } else {
      notify(res.error || 'Failed to send confirmation code', 'error')
    }
  }

  // Confirm Disable 2FA
  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disable2FACode.trim()) {
      notify('Please enter the 6-digit confirmation code', 'error')
      return
    }

    setIs2FAActionLoading(true)
    const res = await confirmDisable2FA({ code: disable2FACode.trim() })
    setIs2FAActionLoading(false)

    if (res.success) {
      setTwoFactorState((prev) => ({ ...prev, enabled: false, backupCodes: [], backupCodesCount: 0 }))
      setDisable2FAModalOpen(false)
      notify('Two-Factor Authentication disabled.')
    } else {
      notify(res.error || 'Failed to disable 2FA', 'error')
    }
  }

  // Regenerate Backup Codes
  const handleRegenerateCodes = async () => {
    if (!confirm('Are you sure you want to regenerate your 6 backup recovery codes? Any previous backup codes will be immediately invalidated.')) {
      return
    }

    setIs2FAActionLoading(true)
    const res = await regenerateBackupCodes()
    setIs2FAActionLoading(false)

    if (res.success && res.backupCodes) {
      setTwoFactorState((prev) => ({
        ...prev,
        backupCodesCount: res.backupCodes!.length,
        backupCodes: res.backupCodes!,
      }))
      setViewCodesModalOpen(true)
      notify('6 new emergency backup codes generated!')
    } else {
      notify(res.error || 'Failed to regenerate backup codes', 'error')
    }
  }

  // Update 2FA Delivery Email
  const handleSaveDeliveryEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeEmailInput.trim()) {
      notify('Please enter a valid email address', 'error')
      return
    }

    setIs2FAActionLoading(true)
    const res = await update2FADeliveryEmail({ email: changeEmailInput.trim() })
    setIs2FAActionLoading(false)

    if (res.success) {
      setTwoFactorState((prev) => ({ ...prev, deliveryEmail: res.deliveryEmail || changeEmailInput.trim() }))
      setChangeEmailModalOpen(false)
      notify(res.message || '2FA delivery email updated!')
    } else {
      notify(res.error || 'Failed to update 2FA delivery email', 'error')
    }
  }

  // Copy Backup Codes
  const copyAllBackupCodes = (codes: string[]) => {
    const text = `7MEDIA Two-Factor Authentication - Emergency Backup Codes\nAccount: ${twoFactorState.deliveryEmail || session?.user?.email || '7MEDIA User'}\nGenerated: ${new Date().toLocaleString()}\n\nEach 8-digit code can unlock your account if you lose access to your email.\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedCodesNotice(true)
    setTimeout(() => setCopiedCodesNotice(false), 3000)
    notify('Backup codes copied to clipboard!')
  }

  // Download Backup Codes
  const downloadBackupCodesAsTxt = (codes: string[]) => {
    const text = `7MEDIA Two-Factor Authentication - Emergency Backup Codes\nAccount: ${twoFactorState.deliveryEmail || session?.user?.email || '7MEDIA User'}\nGenerated: ${new Date().toLocaleString()}\n\nEach 8-digit code can unlock your account if you lose access to your email.\nWhenever a code is used, a replacement code will be added.\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `7media-2fa-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    notify('Backup codes downloaded as .txt file!')
  }

  // =========================================================================
  // ACCOUNT DELETION HANDLERS (2-STEP EMAIL OTP FLOW)
  // =========================================================================

  // Step 1: Send Account Deletion OTP
  const handleStartDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      notify('Please type DELETE in capital letters to confirm', 'error')
      return
    }

    if (!deleteTargetEmail.trim()) {
      notify('Please enter a valid email address for authorization', 'error')
      return
    }

    setIsDeleting(true)
    const res = await requestAccountDeletionOtp({ targetEmail: deleteTargetEmail.trim() })
    setIsDeleting(false)

    if (res.success) {
      setDeleteStep('otp')
      setDeleteResendCooldown(60)
      notify(res.message || '6-digit deletion authorization code sent!')
    } else {
      notify(res.error || 'Failed to send deletion code', 'error')
    }
  }

  // Step 2: Confirm Account Deletion with 6-digit OTP
  const handleFinalizeDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deleteOtp.trim() || deleteOtp.trim().length !== 6) {
      notify('Please enter the 6-digit deletion code', 'error')
      return
    }

    setIsDeleting(true)
    const res = await confirmDeleteUserAccountWithOtp({ code: deleteOtp.trim() })
    setIsDeleting(false)

    if (res.success) {
      notify('Your account and all associated data have been permanently deleted.')
      await signOut()
      router.push('/')
      router.refresh()
    } else {
      notify(res.error || 'Failed to delete account', 'error')
    }
  }

  if (isSessionLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Loading Profile...
          </p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-2xl font-black font-display uppercase tracking-tight">
            Sign In Required
          </h1>
          <p className="text-xs text-muted-foreground">
            Please sign in to access your customized profile settings, 2FA security controls, and cinema preferences.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            Sign In to 7MEDIA
          </Link>
        </div>
      </div>
    )
  }

  const activeAvatarObj = AVATAR_PRESETS.find((a) => a.id === selectedAvatarId) || AVATAR_PRESETS[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Floating Status Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 duration-200 ${
            notification.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-300'
              : 'border-destructive/40 bg-destructive/90 text-destructive-foreground'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition mb-2"
            >
              <ArrowLeft size={14} /> Back to Cinema
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-foreground flex items-center gap-3">
              <span>Account Hub</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary border border-primary/30 px-2.5 py-0.5 rounded-full bg-primary/10">
                VIP Access
              </span>
            </h1>
          </div>

          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition active:scale-95 cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* User Hero Banner */}
        <div className="relative rounded-3xl border border-border bg-gradient-to-r from-card via-card/80 to-card/50 p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Badge */}
            <div className="relative group">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl border-2 shadow-2xl transition-transform duration-300 group-hover:scale-105 overflow-hidden ${
                  isPhotoTabCustom && customPhotoUrl
                    ? 'border-primary bg-zinc-900'
                    : `${activeAvatarObj.bg} border-border`
                }`}
              >
                {isPhotoTabCustom && customPhotoUrl ? (
                  <img
                    src={customPhotoUrl}
                    alt={name || session.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{activeAvatarObj.emoji}</span>
                )}
              </div>
            </div>

            {/* Profile Bio */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-2xl font-black font-display tracking-tight text-foreground">
                  {name || session.user.name || 'Cinephile'}
                </h2>
                {twoFactorState.enabled ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> 2FA Secured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <ShieldAlert size={11} /> Basic Security
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-2">
                <Mail size={13} /> {session.user.email}
              </p>

              {/* Quick Activity Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 mt-4 pt-4 border-t border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <Bookmark size={15} className="text-primary" />
                  <span className="font-bold text-foreground">{profileData?.watchlistCount ?? 0}</span>
                  <span className="text-muted-foreground">Watchlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderHeart size={15} className="text-amber-400" />
                  <span className="font-bold text-foreground">{profileData?.customCatalogsCount ?? 0}</span>
                  <span className="text-muted-foreground">Catalogs</span>
                </div>
                <div className="flex items-center gap-2">
                  <History size={15} className="text-cyan-400" />
                  <span className="font-bold text-foreground">{profileData?.historyCount ?? 0}</span>
                  <span className="text-muted-foreground">History</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={15} className="text-yellow-400" />
                  <span className="font-bold text-foreground">{profileData?.reactionsCount ?? 0}</span>
                  <span className="text-muted-foreground">Reactions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <User size={15} />
            <span>Profile &amp; Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Lock size={15} />
            <span>Security &amp; 2FA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connected')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'connected'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Globe size={15} />
            <span>Connected Providers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-destructive text-destructive-foreground shadow-md'
                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
            }`}
          >
            <Trash2 size={15} />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: PROFILE & AVATAR CUSTOMIZATION                                     */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="rounded-3xl border border-border bg-card/70 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
              <div>
                <h2 className="text-xl font-black font-display uppercase tracking-tight text-foreground">
                  Personal Information
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize how your cinema profile appears across Watch Parties and reviews.
                </p>
              </div>

              {/* Display Name */}
              <div className="max-w-md">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Profile Avatar
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPhotoTabCustom(false)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                        !isPhotoTabCustom ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPhotoTabCustom(true)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                        isPhotoTabCustom ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Custom Photo
                    </button>
                  </div>
                </div>

                {!isPhotoTabCustom ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = selectedAvatarId === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedAvatarId(preset.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(229,9,20,0.25)] ring-2 ring-primary/40'
                              : 'border-border bg-secondary/40 hover:bg-secondary hover:border-white/20'
                          }`}
                        >
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${preset.bg}`}>
                            {preset.emoji}
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-foreground truncate">{preset.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {isSelected ? 'Active' : 'Select'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-border bg-secondary/30 space-y-4 max-w-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {customPhotoUrl ? (
                          <img src={customPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="text-muted-foreground" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Upload Custom Image</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, or WebP up to 2MB</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="flex-1 w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition cursor-pointer">
                        <UploadCloud size={16} />
                        <span>Choose File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {customPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomPhotoUrl('')
                            setIsPhotoTabCustom(false)
                          }}
                          className="px-4 h-11 rounded-xl border border-destructive/30 bg-destructive/10 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-border flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SECURITY & TWO-FACTOR AUTHENTICATION (2FA)                         */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="rounded-3xl border border-border bg-card/70 p-6 md:p-8 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black font-display uppercase tracking-tight text-foreground">
                      Password &amp; Credentials
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Update your account security key with end-to-end 256-bit scrypt hashing.
                    </p>
                  </div>
                  <KeyRound className="text-primary hidden sm:block" size={24} />
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Current Password (optional for OAuth)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-11 text-sm text-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isChangingPass ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>

                {/* Password Reset Section */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Forgot or want to reset password via Email?</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        We&apos;ll dispatch a secure 6-digit OTP from <strong className="text-foreground font-mono">7media.support@gmail.com</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      disabled={isSendingReset}
                      className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-secondary transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingReset ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      <span>Send Reset Code</span>
                    </button>
                  </div>

                  {resetSent && (
                    <form onSubmit={handleResetWithCode} className="mt-5 p-4 rounded-2xl bg-secondary/40 border border-primary/30 space-y-3 max-w-md animate-in fade-in">
                      <p className="text-xs font-bold text-primary">Enter the 6-digit code received on your email:</p>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="e.g. 849201"
                        maxLength={6}
                        required
                        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-center text-lg font-mono font-bold tracking-widest text-foreground outline-none focus:border-primary"
                      />
                      <input
                        type="password"
                        value={resetNewPass}
                        onChange={(e) => setResetNewPass(e.target.value)}
                        placeholder="Enter new password"
                        minLength={6}
                        required
                        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={isResetting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
                      >
                        {isResetting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        <span>Confirm Reset</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Two-Factor Authentication (2FA) Complete Card */}
              <div className="rounded-3xl border border-border bg-card/70 p-6 md:p-8 shadow-xl backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3.5 rounded-2xl border shrink-0 ${
                        twoFactorState.enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      <Shield size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-black font-display uppercase tracking-tight text-foreground">
                          Two-Factor Authentication (2FA)
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            twoFactorState.enabled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {twoFactorState.enabled ? 'Active Protection' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                        Every sign-in attempt requires a 6-digit email OTP dispatched from{' '}
                        <strong className="text-foreground font-mono">7media.support@gmail.com</strong> or an 8-digit emergency backup recovery code.
                      </p>
                    </div>
                  </div>

                  {!twoFactorState.enabled ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEnable2FAStep('request')
                        setEnable2FACode('')
                        setEnable2FAModalOpen(true)
                      }}
                      className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/30 active:scale-95 cursor-pointer"
                    >
                      <ShieldCheck size={16} />
                      <span>Enable 2FA</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartDisable2FA}
                      disabled={is2FAActionLoading}
                      className="shrink-0 flex items-center gap-2 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                    >
                      {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                      <span>Disable 2FA</span>
                    </button>
                  )}
                </div>

                {/* 2FA Activated Details Dashboard */}
                {twoFactorState.enabled && (
                  <div className="pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    {/* Delivery Email Box */}
                    <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Delivery Email</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setChangeEmailInput(twoFactorState.deliveryEmail)
                            setChangeEmailModalOpen(true)
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Change</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono font-bold text-foreground truncate bg-card/60 px-3 py-2 rounded-xl border border-border/60">
                        {twoFactorState.deliveryEmail || session.user.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        All 2FA login security alerts &amp; OTPs are dispatched here.
                      </p>
                    </div>

                    {/* Emergency Backup Codes Box */}
                    <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <KeyRound size={16} className="text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Backup Recovery Codes</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          {twoFactorState.backupCodesCount || 6} / 6 Active
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewCodesModalOpen(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary transition active:scale-95 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View 6 Codes</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRegenerateCodes}
                          disabled={is2FAActionLoading}
                          className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition active:scale-95 cursor-pointer"
                          title="Regenerate all 6 codes"
                        >
                          <RefreshCw size={13} className={is2FAActionLoading ? 'animate-spin' : ''} />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Each 8-digit code can be used to unlock your account if email OTP is delayed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CONNECTED PROVIDERS                                                */}
          {/* ========================================================================= */}
          {activeTab === 'connected' && (
            <div className="rounded-3xl border border-border bg-card/70 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-black font-display uppercase tracking-tight text-foreground">
                  Connected Providers
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Link social providers for instant 1-click authentication across desktop and mobile.
                </p>
              </div>

              {/* Google Provider Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-secondary/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Google OAuth</p>
                    <p className="text-[11px] text-muted-foreground">
                      {profileData?.providers?.includes('google') ? 'Connected to Google Account' : 'Ready to link'}
                    </p>
                  </div>
                </div>

                {profileData?.providers?.includes('google') ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={12} />
                    <span>Linked &amp; Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/profile' })}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:text-white transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Link Google
                  </button>
                )}
              </div>

              {/* GitHub Provider Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-secondary/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">GitHub OAuth</p>
                    <p className="text-[11px] text-muted-foreground">
                      {profileData?.providers?.includes('github') ? 'Connected to GitHub Account' : 'Ready to link'}
                    </p>
                  </div>
                </div>

                {profileData?.providers?.includes('github') ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={12} />
                    <span>Linked &amp; Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/profile' })}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:text-white transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Link GitHub
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DANGER ZONE (PERMANENT ACCOUNT DELETION VIA EMAIL OTP)             */}
          {/* ========================================================================= */}
          {activeTab === 'danger' && (
            <div className="rounded-3xl border border-destructive/30 bg-card/70 p-6 md:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-destructive/15 text-destructive border border-destructive/25 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-destructive">
                    Permanent Account Deletion
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                    Once deleted, your account cannot be recovered. All saved watchlists, custom folders, 2FA configurations, history, and reactions will be permanently purged from the database.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-foreground">Delete your 7MEDIA account and data</p>
                  <p className="text-[11px] text-muted-foreground">Requires email OTP authorization to finalize.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep('confirm')
                    setDeleteConfirmText('')
                    setDeleteOtp('')
                    setDeleteModalOpen(true)
                  }}
                  className="rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive-foreground hover:bg-destructive/90 transition shadow-md active:scale-95 cursor-pointer"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ENABLE 2FA WIZARD (EMAIL ➔ OTP ➔ 6 BACKUP CODES)                */}
      {/* ========================================================================= */}
      {enable2FAModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (enable2FAStep !== 'codes') setEnable2FAModalOpen(false)
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    {enable2FAStep === 'codes' ? 'Emergency Backup Codes' : 'Setup Two-Factor (2FA)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {enable2FAStep === 'request'
                      ? 'Confirm delivery email'
                      : enable2FAStep === 'verify'
                      ? 'Verify 6-digit security code'
                      : 'Save your 6 backup codes safely'}
                  </p>
                </div>
              </div>
              {enable2FAStep !== 'codes' && (
                <button
                  type="button"
                  onClick={() => setEnable2FAModalOpen(false)}
                  className="p-2 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Step 1: Confirm Delivery Email */}
            {enable2FAStep === 'request' && (
              <form onSubmit={handleStartEnable2FA} className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  We will send 6-digit login verification codes and security alerts from <strong className="text-white font-mono">7media.support@gmail.com</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    2FA Delivery Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="email"
                      value={enable2FAEmail}
                      onChange={(e) => setEnable2FAEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">You can customize this to any trusted email address.</p>
                </div>

                <button
                  type="submit"
                  disabled={is2FAActionLoading}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span>Send 6-Digit Activation Code</span>
                </button>
              </form>
            )}

            {/* Step 2: Enter 6-Digit OTP */}
            {enable2FAStep === 'verify' && (
              <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Enter the 6-digit activation code sent to <strong className="text-white font-mono">{enable2FAEmail}</strong>:
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                    6-Digit Activation Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enable2FACode}
                    onChange={(e) => setEnable2FACode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="h-14 w-full rounded-2xl border border-white/20 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={is2FAActionLoading || enable2FACode.length !== 6}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Verify &amp; Activate 2FA</span>
                </button>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setEnable2FAStep('request')}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={enable2FAResendCooldown > 0 || is2FAActionLoading}
                    onClick={() => handleStartEnable2FA()}
                    className="font-semibold text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {enable2FAResendCooldown > 0 ? `Resend in ${enable2FAResendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Present 6 8-Digit Backup Codes */}
            {enable2FAStep === 'codes' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed">
                  ⚠️ <strong>Save these 6 backup recovery codes immediately.</strong> If you ever lose access to your email or OTP delivery fails, any of these 8-digit codes can unlock your account. Each code can be used once.
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-zinc-900/90 border border-white/10">
                  {twoFactorState.backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-xl border border-white/5 font-mono text-sm font-bold text-white tracking-widest"
                    >
                      <span className="text-zinc-500 text-xs mr-2">{idx + 1}.</span>
                      <span className="text-emerald-400">{code}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => copyAllBackupCodes(twoFactorState.backupCodes)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  >
                    <Copy size={14} />
                    <span>{copiedCodesNotice ? 'Copied!' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBackupCodesAsTxt(twoFactorState.backupCodes)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download .TXT</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEnable2FAModalOpen(false)}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/90 transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <Check size={16} />
                  <span>I have saved my backup codes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW / MANAGE 6 BACKUP CODES                                     */}
      {/* ========================================================================= */}
      {viewCodesModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewCodesModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Emergency Backup Codes
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {twoFactorState.backupCodes.length} / 6 codes remaining
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewCodesModalOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Use any of these 8-digit codes to sign in if you do not receive the email OTP. Whenever you use a code, a new replacement code is automatically generated!
            </p>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-zinc-900/90 border border-white/10 mb-5">
              {twoFactorState.backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-xl border border-white/5 font-mono text-sm font-bold text-white tracking-widest"
                >
                  <span className="text-zinc-500 text-xs mr-2">{idx + 1}.</span>
                  <span className="text-amber-400">{code}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => copyAllBackupCodes(twoFactorState.backupCodes)}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
              >
                <Copy size={14} />
                <span>{copiedCodesNotice ? 'Copied!' : 'Copy All'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadBackupCodesAsTxt(twoFactorState.backupCodes)}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                <span>Download .TXT</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRegenerateCodes}
              disabled={is2FAActionLoading}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-amber-500/30 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
            >
              <RefreshCw size={14} className={is2FAActionLoading ? 'animate-spin' : ''} />
              <span>Regenerate 6 New Codes</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DISABLE 2FA CONFIRMATION (WITH OTP)                              */}
      {/* ========================================================================= */}
      {disable2FAModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDisable2FAModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-destructive/40 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-destructive">
                <ShieldAlert size={26} />
                <h3 className="text-xl font-black font-display uppercase tracking-tight">
                  Disable 2FA Protection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisable2FAModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                For security, enter the 6-digit confirmation code dispatched to{' '}
                <strong className="text-white font-mono">{twoFactorState.deliveryEmail}</strong>:
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={disable2FACode}
                  onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="h-12 w-full rounded-xl border border-destructive/40 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-widest text-white outline-none focus:border-destructive"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisable2FAModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={is2FAActionLoading || disable2FACode.length !== 6}
                  className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-destructive/90 transition disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm Disable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CHANGE 2FA DELIVERY EMAIL                                        */}
      {/* ========================================================================= */}
      {changeEmailModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setChangeEmailModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Mail className="text-primary" size={22} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                  Update 2FA Delivery Email
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChangeEmailModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryEmail} className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Enter the email address where login security verification OTP codes will be sent.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  New 2FA Email
                </label>
                <input
                  type="email"
                  value={changeEmailInput}
                  onChange={(e) => setChangeEmailInput(e.target.value)}
                  placeholder="security@example.com"
                  required
                  className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangeEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={is2FAActionLoading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: 2-STEP ACCOUNT DELETION WITH EMAIL OTP & CUSTOM DESTINATION      */}
      {/* ========================================================================= */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-destructive/40 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle size={28} />
                <h3 className="text-xl font-black font-display uppercase tracking-tight">
                  {deleteStep === 'confirm' ? 'Delete 7MEDIA Account' : 'Verify Deletion Authorization'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: WARNING & EMAIL DESTINATION CHOICE */}
            {deleteStep === 'confirm' ? (
              <form onSubmit={handleStartDeleteRequest} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive-foreground text-xs leading-relaxed">
                  ⚠️ <strong>Irreversible Action:</strong> Deleting your account will immediately and permanently erase all your saved watchlists, custom folders, ratings, history, and 2FA credentials.
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Authorization Code Destination Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="email"
                      value={deleteTargetEmail}
                      onChange={(e) => setDeleteTargetEmail(e.target.value)}
                      placeholder="account@example.com"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-destructive"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Enter the email address where the 6-digit deletion authorization code will be sent.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Type <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    required
                    className="h-12 w-full rounded-xl border border-destructive/40 bg-zinc-900 px-4 text-sm text-white font-mono placeholder-zinc-600 outline-none focus:border-destructive"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                    className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-destructive/90 transition shadow-lg shadow-destructive/25 disabled:opacity-40 cursor-pointer"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    <span>Send Deletion Code</span>
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: 6-DIGIT DELETION OTP CONFIRMATION */
              <form onSubmit={handleFinalizeDeleteAccount} className="space-y-4 animate-in fade-in">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A 6-digit deletion authorization code has been sent from <strong className="text-white font-mono">7media.support@gmail.com</strong> to <strong className="text-white font-mono">{deleteTargetEmail}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                    6-Digit Deletion Authorization Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="h-14 w-full rounded-2xl border border-destructive/50 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-destructive shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeleteStep('confirm')}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={deleteResendCooldown > 0 || isDeleting}
                    onClick={() => requestAccountDeletionOtp({ targetEmail: deleteTargetEmail.trim() })}
                    className="font-semibold text-destructive hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {deleteResendCooldown > 0 ? `Resend in ${deleteResendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || deleteOtp.length !== 6}
                    className="flex items-center gap-2 rounded-xl bg-destructive px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-destructive/90 transition shadow-lg shadow-destructive/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    <span>Permanently Terminate Account</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
