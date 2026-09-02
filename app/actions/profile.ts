'use server'

import { db } from '@/lib/db'
import { user, account, session as sessionTable, catalogs, watchlist, progress, reactions, verification, userTwoFactor } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { hashPassword, verifyPassword } from 'better-auth/crypto'
import { sendEmail } from '@/lib/email'
import { buildPremiumEmailHtml } from '@/lib/email-templates'
import { checkRateLimit } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/utils'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function getUserProfileDetails() {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return {
      authenticated: false,
      user: null,
      stats: {
        watchlistCount: 0,
        catalogsCount: 0,
        historyCount: 0,
        reactionsCount: 0,
      },
      providers: [] as string[],
      hasPassword: false,
    }
  }

  try {
    // 1. Fetch connected provider accounts
    const userAccounts = await db
      .select({
        providerId: account.providerId,
        password: account.password,
      })
      .from(account)
      .where(eq(account.userId, currentUser.id))

    const providers = userAccounts.map((a) => a.providerId)
    const hasPassword = userAccounts.some((a) => a.providerId === 'credential' && Boolean(a.password))

    // 2. Fetch stats
    const [wlCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(watchlist)
      .where(eq(watchlist.userId, currentUser.id))

    const [catCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogs)
      .where(eq(catalogs.userId, currentUser.id))

    const [progCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(progress)
      .where(eq(progress.userId, currentUser.id))

    const [reactCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reactions)
      .where(eq(reactions.userId, currentUser.id))

    // 3. Fetch latest user record from DB
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1)

    return {
      authenticated: true,
      user: {
        id: currentUser.id,
        name: dbUser?.name || currentUser.name,
        email: dbUser?.email || currentUser.email,
        image: dbUser?.image || currentUser.image || null,
        createdAt: dbUser?.createdAt ? dbUser.createdAt.toISOString() : null,
      },
      stats: {
        watchlistCount: wlCount?.count || 0,
        catalogsCount: Math.max(catCount?.count || 0, 7),
        historyCount: progCount?.count || 0,
        reactionsCount: reactCount?.count || 0,
      },
      providers,
      hasPassword,
    }
  } catch (err) {
    console.error('Error fetching user profile details:', err)
    return {
      authenticated: true,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image || null,
        createdAt: null,
      },
      stats: {
        watchlistCount: 0,
        catalogsCount: 7,
        historyCount: 0,
        reactionsCount: 0,
      },
      providers: ['credential'],
      hasPassword: true,
    }
  }
}

export async function updateUserProfile(data: { name: string; image?: string | null }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized. Please sign in.' }

  const cleanName = data.name.trim()
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters long.' }
  }
  if (cleanName.length > 50) {
    return { success: false, error: 'Name cannot exceed 50 characters.' }
  }

  try {
    await db
      .update(user)
      .set({
        name: cleanName,
        image: data.image !== undefined ? data.image : undefined,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUser.id))

    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath('/')

    return {
      success: true,
      user: {
        name: cleanName,
        image: data.image || null,
      },
    }
  } catch (err) {
    console.error('Error updating user profile:', err)
    return { success: false, error: 'Failed to update profile. Please try again.' }
  }
}

export async function changeUserPassword(data: { currentPassword?: string; newPassword: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized. Please sign in.' }

  if (!data.newPassword || data.newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' }
  }

  try {
    const existingAccounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, currentUser.id), eq(account.providerId, 'credential')))
      .limit(1)

    const credentialAccount = existingAccounts[0]

    // If an existing credential password exists, verify current password
    if (credentialAccount && credentialAccount.password) {
      if (!data.currentPassword) {
        return { success: false, error: 'Please enter your current password.' }
      }
      const isMatch = await verifyPassword({
        hash: credentialAccount.password,
        password: data.currentPassword,
      })
      if (!isMatch) {
        return { success: false, error: 'Current password is incorrect.' }
      }
    }

    const hashedPassword = await hashPassword(data.newPassword)

    if (credentialAccount) {
      await db
        .update(account)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.id, credentialAccount.id))
    } else {
      await db.insert(account).values({
        id: `acc_${currentUser.id}_cred_${Date.now()}`,
        accountId: currentUser.id,
        providerId: 'credential',
        userId: currentUser.id,
        password: hashedPassword,
      })
    }

    return { success: true }
  } catch (err) {
    console.error('Error changing user password:', err)
    return { success: false, error: 'Failed to change password. Please try again.' }
  }
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, cleanEmail))
      .limit(1)

    if (existingUsers.length === 0) {
      return {
        success: false,
        notFound: true,
        error: 'No account found with this email address. Please make sure you typed it correctly or create a new free account.',
      }
    }

    const targetUser = existingUsers[0]
    const userName = targetUser.name || 'Cinephile'

    // Generate a secure 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Delete older reset codes for this email
    await db.delete(verification).where(eq(verification.identifier, cleanEmail))

    // Insert new verification code
    await db.insert(verification).values({
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      identifier: cleanEmail,
      value: resetCode,
      expiresAt,
    })

    // Send email via timeout-safe transporter
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: `${resetCode} is your 7MEDIA password reset code`,
      text: `Hello ${userName},\n\nYour 7MEDIA password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes. If you did not request this, you can safely ignore this email.\n\n7MEDIA Support Desk`,
      fromName: '7MEDIA',
      html: buildPremiumEmailHtml({
        badgeTitle: 'PASSWORD RECOVERY',
        heading: 'Reset Your Password',
        recipientName: userName,
        message: 'We received an authorized request to reset the password for your 7MEDIA account. Enter the 6-digit security code below into the reset prompt to create your new password:',
        code: resetCode,
        codeLabel: 'Password Reset Code',
        expiresInText: '15 minutes',
        securityTip: 'If you did not request a password reset, you can safely disregard this notification. Your current password remains fully protected.',
      }),
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send password reset email. Please try again.' }
    }

    return {
      success: true,
      message: `A 6-digit password reset code has been sent to ${cleanEmail}.`,
    }
  } catch (err) {
    console.error('Error requesting password reset:', err)
    return { success: false, error: 'Failed to send reset code. Please try again.' }
  }
}

export async function resetPasswordWithCode(data: { email: string; code: string; newPassword: string }) {
  const cleanEmail = data.email.trim().toLowerCase()
  const cleanCode = data.code.trim()

  if (!cleanEmail || !cleanCode) {
    return { success: false, error: 'Please enter both your email and the 6-digit code.' }
  }

  // Anti-Brute-Force Rate Limiter: Max 5 attempts per 15 minutes per email
  const rateLimitResult = checkRateLimit(`pwd-reset:${cleanEmail}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Too many incorrect attempts. For your security, password reset is locked for 15 minutes.',
    }
  }

  if (!data.newPassword || data.newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' }
  }

  try {
    const records = await db
      .select()
      .from(verification)
      .where(and(eq(verification.identifier, cleanEmail), eq(verification.value, cleanCode)))
      .limit(1)

    if (records.length === 0) {
      return { success: false, error: 'Invalid or expired reset code.' }
    }

    const record = records[0]
    if (record.expiresAt && record.expiresAt < new Date()) {
      await db.delete(verification).where(eq(verification.id, record.id))
      return { success: false, error: 'This reset code has expired. Please request a new one.' }
    }

    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1)
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email.' }
    }

    const targetUser = users[0]
    const hashedPassword = await hashPassword(data.newPassword)

    const existingAccounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, targetUser.id), eq(account.providerId, 'credential')))
      .limit(1)

    if (existingAccounts.length > 0) {
      await db
        .update(account)
        .set({ password: hashedPassword, issuer: 'local:credential', updatedAt: new Date() })
        .where(eq(account.id, existingAccounts[0].id))
    } else {
      await db.insert(account).values({
        id: `acc_${targetUser.id}_cred_${Date.now()}`,
        accountId: targetUser.id,
        providerId: 'credential',
        issuer: 'local:credential',
        userId: targetUser.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Delete used verification token
    await db.delete(verification).where(eq(verification.id, record.id))

    return { success: true }
  } catch (err) {
    console.error('Error resetting password with code:', err)
    return { success: false, error: 'Failed to reset password. Please try again.' }
  }
}

// ============================================================================
// ACCOUNT DELETION WITH EMAIL OTP VERIFICATION
// ============================================================================

export async function requestAccountDeletionOtp(data?: { targetEmail?: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized. Please sign in.' }

  const chosenEmail = data?.targetEmail?.trim().toLowerCase() || currentUser.email
  if (!chosenEmail || !EMAIL_REGEX.test(chosenEmail)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpIdentifier = `delete-account-otp:${currentUser.id}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

    await db.delete(verification).where(eq(verification.identifier, otpIdentifier))
    await db.insert(verification).values({
      id: `ver_del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      identifier: otpIdentifier,
      value: `${otpCode}:${chosenEmail}`,
      expiresAt,
    })

    const emailResult = await sendEmail({
      to: chosenEmail,
      subject: `${otpCode} is your 7MEDIA deletion code`,
      text: `Hello ${currentUser.name || 'User'},\n\nYour 7MEDIA account deletion confirmation code is: ${otpCode}\n\nThis code will expire in 15 minutes. If you did not request this, please change your password immediately.\n\n7MEDIA Support Desk`,
      fromName: '7MEDIA',
      html: buildPremiumEmailHtml({
        badgeTitle: 'CRITICAL SECURITY ACTION',
        heading: 'Permanent Account Deletion',
        recipientName: currentUser.name || 'User',
        message: 'A request has been authorized to permanently delete your 7MEDIA account and purge all your saved watchlists, custom folders, watch progress, and personal preferences from the database. Enter the 6-digit confirmation code below to authorize deletion:',
        code: otpCode,
        codeLabel: 'Deletion Authorization Code',
        expiresInText: '15 minutes',
        securityTip: 'If you did NOT initiate this deletion, do not share this code with anyone and change your password immediately to protect your account.',
        accentColor: '#EF4444',
      }),
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to dispatch deletion authorization email. Please try again.' }
    }

    return {
      success: true,
      targetEmail: chosenEmail,
      message: `A 6-digit deletion authorization code has been sent to ${chosenEmail}.`,
    }
  } catch (err) {
    console.error('Error requesting account deletion OTP:', err)
    return { success: false, error: 'Failed to send deletion code. Please try again.' }
  }
}

export async function confirmDeleteUserAccountWithOtp(data: { code: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Unauthorized. Please sign in.' }

  const cleanCode = data.code?.trim()
  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit deletion code.' }
  }

  try {
    const otpIdentifier = `delete-account-otp:${currentUser.id}`
    const [record] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, otpIdentifier))
      .limit(1)

    if (!record) {
      return { success: false, error: 'No deletion request found. Please request a new code.' }
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, record.id))
      return { success: false, error: 'Deletion code expired. Please request a new code.' }
    }

    const [storedCode] = record.value.split(':')
    if (storedCode !== cleanCode) {
      return { success: false, error: 'Invalid deletion code. Please try again.' }
    }

    // 1. Cascade delete all records
    await db.delete(catalogs).where(eq(catalogs.userId, currentUser.id))
    await db.delete(watchlist).where(eq(watchlist.userId, currentUser.id))
    await db.delete(progress).where(eq(progress.userId, currentUser.id))
    await db.delete(reactions).where(eq(reactions.userId, currentUser.id))
    await db.delete(sessionTable).where(eq(sessionTable.userId, currentUser.id))
    await db.delete(account).where(eq(account.userId, currentUser.id))
    await db.delete(userTwoFactor).where(eq(userTwoFactor.userId, currentUser.id))
    await db.delete(user).where(eq(user.id, currentUser.id))

    // 2. Clean up OTP
    await db.delete(verification).where(eq(verification.id, record.id))

    return { success: true, message: 'Account permanently deleted.' }
  } catch (err) {
    console.error('Error deleting user account with OTP:', err)
    return { success: false, error: 'Failed to delete account. Please try again.' }
  }
}

export async function deleteUserAccount(data?: { code?: string }) {
  if (data?.code) {
    return confirmDeleteUserAccountWithOtp({ code: data.code })
  }
  return confirmDeleteUserAccountWithOtp({ code: '' })
}

// ============================================================================
// SIGNUP EMAIL OTP VERIFICATION
// ============================================================================

export async function requestSignupOtp(data: { name: string; email: string; password?: string }) {
  try {
    const cleanName = data.name?.trim()
    const cleanEmail = data.email?.trim().toLowerCase()

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter your full name (minimum 2 characters).' }
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    // 1. Check if user already exists
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, cleanEmail))
      .limit(1)

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
      }
    }

    // 2. Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpIdentifier = `signup-otp:${cleanEmail}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // 3. Remove older pending OTPs for this email
    await db.delete(verification).where(eq(verification.identifier, otpIdentifier))

    // 4. Save new OTP to verification table
    await db.insert(verification).values({
      id: `ver_signup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      identifier: otpIdentifier,
      value: otpCode,
      expiresAt,
    })

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: `${otpCode} is your 7MEDIA verification code`,
      text: `Hello ${cleanName},\n\nWelcome to 7MEDIA! Your 6-digit verification code is: ${otpCode}\n\nThis code will expire in 15 minutes. Enter this code to complete your registration.\n\n7MEDIA Support Desk`,
      fromName: '7MEDIA',
      html: buildPremiumEmailHtml({
        badgeTitle: 'ACCOUNT ACTIVATION',
        heading: `Welcome to 7MEDIA, ${escapeHtml(cleanName)}!`,
        subheading: 'Premium Cinematic Network',
        recipientName: cleanName,
        message: 'Thank you for joining 7MEDIA. To activate your account and access synced watchlists, customized catalogs, and streaming features across all devices, enter the 6-digit verification code below:',
        code: otpCode,
        codeLabel: 'Account Activation Code',
        expiresInText: '15 minutes',
        securityTip: 'If you did not initiate this registration on 7MEDIA, you can safely disregard this message.',
      }),
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send verification code. Please try again.' }
    }

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
    }
  } catch (err) {
    console.error('Error in requestSignupOtp:', err)
    return { success: false, error: 'Failed to send verification code. Please try again.' }
  }
}

export async function verifySignupOtpAndCreateAccount(data: {
  name: string
  email: string
  password: string
  code: string
}) {
  try {
    const cleanName = data.name?.trim()
    const cleanEmail = data.email?.trim().toLowerCase()
    const cleanCode = data.code?.trim()

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please provide a valid name.' }
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return { success: false, error: 'Please provide a valid email.' }
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }
    if (!cleanCode || cleanCode.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit code.' }
    }

    const otpIdentifier = `signup-otp:${cleanEmail}`

    // 1. Verify code from database
    const [record] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, otpIdentifier))
      .limit(1)

    if (!record) {
      return {
        success: false,
        error: 'No verification code found for this email. Please request a new code.',
      }
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, record.id))
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      }
    }

    if (record.value !== cleanCode) {
      return {
        success: false,
        error: 'Invalid verification code. Please check and try again.',
      }
    }

    // 2. Check if user was created while verifying
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, cleanEmail))
      .limit(1)

    if (existing) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in.',
      }
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(data.password)
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // 4. Create User Record
    await db.insert(user).values({
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      emailVerified: true,
      image: 'crimson',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // 5. Create Credential Account Record
    await db.insert(account).values({
      id: `acc_${newUserId}_cred`,
      accountId: newUserId,
      providerId: 'credential',
      issuer: 'local:credential',
      userId: newUserId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // 6. Delete used OTP
    await db.delete(verification).where(eq(verification.id, record.id))

    return {
      success: true,
      message: 'Account verified and created successfully!',
    }
  } catch (err) {
    console.error('Error in verifySignupOtpAndCreateAccount:', err)
    return { success: false, error: 'Failed to verify account. Please try again.' }
  }
}
