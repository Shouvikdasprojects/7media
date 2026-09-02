'use server'

import { db } from '@/lib/db'
import { user, account, verification, userTwoFactor } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { and, eq, sql } from 'drizzle-orm'
import { verifyPassword } from 'better-auth/crypto'
import { sendEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

// Ensure user_two_factor table exists in PostgreSQL
export async function ensureTwoFactorTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_two_factor (
        id text PRIMARY KEY,
        "userId" text NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
        enabled boolean NOT NULL DEFAULT false,
        "deliveryEmail" text,
        "backupCodes" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );
    `)
  } catch (err) {
    console.error('Error ensuring user_two_factor table:', err)
  }
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

function generate8DigitCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

function generateInitialBackupCodes(count = 6): string[] {
  const codes = new Set<string>()
  while (codes.size < count) {
    codes.add(generate8DigitCode())
  }
  return Array.from(codes)
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.length > 2 ? local.slice(0, 2) + '•••' + local.slice(-1) : local.slice(0, 1) + '••'
  return `${visible}@${domain}`
}

async function sendSmtpEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  return sendEmail({
    to,
    subject,
    html,
    text,
    fromName: '7MEDIA',
  })
}

// ============================================================================
// 1. GET 2FA STATUS
// ============================================================================
export async function get2FAStatus() {
  const currentUser = await getSessionUser()
  if (!currentUser) {
    return {
      authenticated: false,
      enabled: false,
      deliveryEmail: '',
      backupCodesCount: 0,
      backupCodes: [] as string[],
    }
  }

  await ensureTwoFactorTable()

  try {
    const [record] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, currentUser.id))
      .limit(1)

    if (!record || !record.enabled) {
      return {
        authenticated: true,
        enabled: false,
        deliveryEmail: currentUser.email,
        backupCodesCount: 0,
        backupCodes: [] as string[],
      }
    }

    let codes: string[] = []
    try {
      codes = JSON.parse(record.backupCodes)
    } catch {}

    return {
      authenticated: true,
      enabled: true,
      deliveryEmail: record.deliveryEmail || currentUser.email,
      backupCodesCount: codes.length,
      backupCodes: codes,
    }
  } catch (err) {
    console.error('Error in get2FAStatus:', err)
    return {
      authenticated: true,
      enabled: false,
      deliveryEmail: currentUser.email,
      backupCodesCount: 0,
      backupCodes: [] as string[],
    }
  }
}

// ============================================================================
// 2. REQUEST ENABLE 2FA (Dispatches 6-Digit OTP to Delivery Email)
// ============================================================================
export async function requestEnable2FA(data?: { deliveryEmail?: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Please sign in first.' }

  await ensureTwoFactorTable()

  const targetEmail = data?.deliveryEmail?.trim().toLowerCase() || currentUser.email
  if (!EMAIL_REGEX.test(targetEmail)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpIdentifier = `2fa-enable-otp:${currentUser.id}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15m

    await db.delete(verification).where(eq(verification.identifier, otpIdentifier))
    await db.insert(verification).values({
      id: `ver_2fa_en_${Date.now()}`,
      identifier: otpIdentifier,
      value: `${otpCode}:${targetEmail}`,
      expiresAt,
    })

    const emailResult = await sendSmtpEmail({
      to: targetEmail,
      subject: `${otpCode} is your 7MEDIA verification code`,
      text: `Your 7MEDIA two-factor authentication verification code is: ${otpCode}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please secure your account.\n\n7MEDIA Support Desk`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
            ${otpCode} is your 7MEDIA security code. Valid for 15 minutes.
          </div>
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color: #0f172a; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px;">7MEDIA</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Security Verification</p>
            </div>
            <div style="padding: 32px 28px; color: #334155;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Two-Factor Authentication Setup</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                We received a request to enable Two-Factor Authentication for your 7MEDIA account. Enter the verification code below to complete setup:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #cbd5e1;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 6px;">Security Code</div>
                <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #e11d48; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">${otpCode}</div>
              </div>
              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 20px 0 0 0;">
                This code will expire in <strong>15 minutes</strong>. If you did not request this, please ignore this email or change your password.
              </p>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} 7MEDIA Streaming Network • Direct Support: 7media.support@gmail.com
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send 2FA activation code to your email. Please try again.' }
    }

    return {
      success: true,
      message: `A 6-digit activation code has been sent to ${targetEmail}.`,
    }
  } catch (err) {
    console.error('Error in requestEnable2FA:', err)
    return { success: false, error: 'Failed to send activation code. Please try again.' }
  }
}

// ============================================================================
// 3. CONFIRM ENABLE 2FA (Generates 6 8-digit Backup Codes)
// ============================================================================
export async function confirmEnable2FA(data: { code: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Please sign in first.' }

  await ensureTwoFactorTable()

  const cleanCode = data.code?.trim()
  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit code.' }
  }

  try {
    const otpIdentifier = `2fa-enable-otp:${currentUser.id}`
    const [record] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, otpIdentifier))
      .limit(1)

    if (!record) {
      return { success: false, error: 'No activation code found. Please request a new code.' }
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, record.id))
      return { success: false, error: 'Activation code expired. Please request a new code.' }
    }

    const [storedCode, targetEmail] = record.value.split(':')
    if (storedCode !== cleanCode) {
      return { success: false, error: 'Invalid activation code. Please try again.' }
    }

    // Generate 6 8-digit backup codes
    const backupCodes = generateInitialBackupCodes(6)
    const finalEmail = targetEmail || currentUser.email

    await db
      .insert(userTwoFactor)
      .values({
        id: `2fa_${currentUser.id}`,
        userId: currentUser.id,
        enabled: true,
        deliveryEmail: finalEmail,
        backupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userTwoFactor.userId,
        set: {
          enabled: true,
          deliveryEmail: finalEmail,
          backupCodes: JSON.stringify(backupCodes),
          updatedAt: new Date(),
        },
      })

    await db.delete(verification).where(eq(verification.id, record.id))

    return {
      success: true,
      backupCodes,
      deliveryEmail: finalEmail,
      message: 'Two-Factor Authentication has been successfully enabled!',
    }
  } catch (err) {
    console.error('Error in confirmEnable2FA:', err)
    return { success: false, error: 'Failed to enable Two-Factor Authentication.' }
  }
}

// ============================================================================
// 4. REQUEST DISABLE 2FA (Dispatches confirmation OTP)
// ============================================================================
export async function requestDisable2FA() {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Please sign in first.' }

  await ensureTwoFactorTable()

  try {
    const [statusRecord] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, currentUser.id))
      .limit(1)

    if (!statusRecord || !statusRecord.enabled) {
      return { success: false, error: 'Two-Factor Authentication is not currently enabled.' }
    }

    const targetEmail = statusRecord.deliveryEmail || currentUser.email
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpIdentifier = `2fa-disable-otp:${currentUser.id}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await db.delete(verification).where(eq(verification.identifier, otpIdentifier))
    await db.insert(verification).values({
      id: `ver_2fa_dis_${Date.now()}`,
      identifier: otpIdentifier,
      value: otpCode,
      expiresAt,
    })

    const emailResult = await sendSmtpEmail({
      to: targetEmail,
      subject: `${otpCode} is your 7MEDIA security code`,
      text: `Your 7MEDIA two-factor authentication removal confirmation code is: ${otpCode}\n\nThis code will expire in 15 minutes.\n\n7MEDIA Support Desk`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
            ${otpCode} is your 7MEDIA security code. Valid for 15 minutes.
          </div>
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color: #0f172a; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px;">7MEDIA</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Security Verification</p>
            </div>
            <div style="padding: 32px 28px; color: #334155;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Disable Two-Factor Authentication</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                A request was made to disable Two-Factor Protection on your 7MEDIA account. Enter the verification code below to confirm this action:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #cbd5e1;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 6px;">Confirmation Code</div>
                <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #e11d48; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">${otpCode}</div>
              </div>
              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 20px 0 0 0;">
                If you did not request this, do NOT share this code and change your password immediately.
              </p>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} 7MEDIA Streaming Network • Direct Support: 7media.support@gmail.com
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send confirmation code to your email.' }
    }

    return {
      success: true,
      message: `A 6-digit confirmation code has been sent to ${targetEmail}.`,
    }
  } catch (err) {
    console.error('Error in requestDisable2FA:', err)
    return { success: false, error: 'Failed to send confirmation code.' }
  }
}

// ============================================================================
// 5. CONFIRM DISABLE 2FA
// ============================================================================
export async function confirmDisable2FA(data: { code: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Please sign in first.' }

  await ensureTwoFactorTable()

  const cleanCode = data.code?.trim()
  try {
    const otpIdentifier = `2fa-disable-otp:${currentUser.id}`
    const [record] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, otpIdentifier))
      .limit(1)

    if (!record || record.value !== cleanCode || new Date() > new Date(record.expiresAt)) {
      return { success: false, error: 'Invalid or expired confirmation code.' }
    }

    await db
      .update(userTwoFactor)
      .set({ enabled: false, updatedAt: new Date() })
      .where(eq(userTwoFactor.userId, currentUser.id))

    await db.delete(verification).where(eq(verification.id, record.id))

    return { success: true, message: 'Two-Factor Authentication has been disabled.' }
  } catch (err) {
    console.error('Error in confirmDisable2FA:', err)
    return { success: false, error: 'Failed to disable 2FA.' }
  }
}

// ============================================================================
// 6. REGENERATE BACKUP CODES
// ============================================================================
export async function regenerateBackupCodes() {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Please sign in first.' }

  await ensureTwoFactorTable()

  try {
    const newCodes = generateInitialBackupCodes(6)
    await db
      .update(userTwoFactor)
      .set({
        backupCodes: JSON.stringify(newCodes),
        updatedAt: new Date(),
      })
      .where(eq(userTwoFactor.userId, currentUser.id))

    return {
      success: true,
      backupCodes: newCodes,
      message: '6 new emergency backup codes have been generated!',
    }
  } catch (err) {
    console.error('Error in regenerateBackupCodes:', err)
    return { success: false, error: 'Failed to regenerate backup codes.' }
  }
}

// ============================================================================
// 7. CHANGE 2FA DELIVERY EMAIL
// ============================================================================
export async function update2FADeliveryEmail(data: { email: string }) {
  const currentUser = await getSessionUser()
  if (!currentUser) return { success: false, error: 'Please sign in first.' }

  const cleanEmail = data.email?.trim().toLowerCase()
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { success: false, error: 'Please provide a valid email address.' }
  }

  await ensureTwoFactorTable()

  try {
    await db
      .update(userTwoFactor)
      .set({
        deliveryEmail: cleanEmail,
        updatedAt: new Date(),
      })
      .where(eq(userTwoFactor.userId, currentUser.id))

    return {
      success: true,
      deliveryEmail: cleanEmail,
      message: `2FA security alerts and OTP codes will now be sent to ${cleanEmail}.`,
    }
  } catch (err) {
    console.error('Error in update2FADeliveryEmail:', err)
    return { success: false, error: 'Failed to update 2FA delivery email.' }
  }
}

// ============================================================================
// 8. CHECK 2FA REQUIREMENT & INITIATE LOGIN CHALLENGE ON SIGN-IN
// ============================================================================
export async function initiate2FALoginChallenge(data: { email: string; password?: string }) {
  const cleanEmail = data.email?.trim().toLowerCase()
  if (!cleanEmail) return { requires2FA: false }

  await ensureTwoFactorTable()

  try {
    // 1. Find user by email
    const [targetUser] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.email, cleanEmail))
      .limit(1)

    if (!targetUser) {
      return { requires2FA: false }
    }

    // 2. If password provided, verify password credentials
    if (data.password) {
      const [acc] = await db
        .select()
        .from(account)
        .where(and(eq(account.userId, targetUser.id), eq(account.providerId, 'credential')))
        .limit(1)

      if (acc && acc.password) {
        const isPasswordCorrect = await verifyPassword({
          hash: acc.password,
          password: data.password,
        })
        if (!isPasswordCorrect) {
          return { requires2FA: false, invalidPassword: true }
        }
      }
    }

    // 3. Check if user has 2FA enabled
    const [twoFactorRecord] = await db
      .select()
      .from(userTwoFactor)
      .where(and(eq(userTwoFactor.userId, targetUser.id), eq(userTwoFactor.enabled, true)))
      .limit(1)

    if (!twoFactorRecord || !twoFactorRecord.enabled) {
      return { requires2FA: false }
    }

    // 4. Generate 2FA Login OTP
    const targetEmail = twoFactorRecord.deliveryEmail || targetUser.email
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpIdentifier = `2fa-login-otp:${targetUser.id}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.delete(verification).where(eq(verification.identifier, otpIdentifier))
    await db.insert(verification).values({
      id: `ver_2fa_log_${Date.now()}`,
      identifier: otpIdentifier,
      value: otpCode,
      expiresAt,
    })

    // 5. Send Email via Secure Engine
    const emailResult = await sendSmtpEmail({
      to: targetEmail,
      subject: `${otpCode} is your 7MEDIA sign-in code`,
      text: `Your 7MEDIA sign-in code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not initiate this login attempt, please change your password immediately.\n\n7MEDIA Support Desk`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
            ${otpCode} is your 7MEDIA sign-in code. Valid for 10 minutes.
          </div>
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color: #0f172a; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px;">7MEDIA</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Sign-In Verification</p>
            </div>
            <div style="padding: 32px 28px; color: #334155;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Sign-In Authorization</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                A sign-in attempt was initiated for your 7MEDIA account. Enter the verification code below to approve this login:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #cbd5e1;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 6px;">Sign-In Code</div>
                <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #e11d48; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">${otpCode}</div>
              </div>
              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 20px 0 0 0;">
                This code will expire in <strong>10 minutes</strong>. If you did not attempt to sign in, please change your password immediately.
              </p>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} 7MEDIA Streaming Network • Direct Support: 7media.support@gmail.com
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      console.error('Failed to dispatch 2FA login email:', emailResult.error)
    }

    return {
      requires2FA: true,
      userId: targetUser.id,
      maskedEmail: maskEmail(targetEmail),
    }
  } catch (err) {
    console.error('Error in initiate2FALoginChallenge:', err)
    return { requires2FA: false }
  }
}

// ============================================================================
// 9. VERIFY 2FA LOGIN (6-digit OTP or 8-digit Backup Code with Replacement)
// ============================================================================
export async function verify2FALoginChallenge(data: {
  userId: string
  code: string
  isBackupCode?: boolean
}) {
  const cleanCode = data.code?.trim().replace(/\s+/g, '')
  if (!cleanCode) return { success: false, error: 'Please enter a valid code.' }

  // Anti-Brute-Force Rate Limiter: Max 5 attempts per 15 minutes per user
  const rateLimitResult = checkRateLimit(`2fa-verify:${data.userId}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Too many incorrect attempts. For security, 2FA verification is locked for 15 minutes.',
    }
  }

  await ensureTwoFactorTable()

  try {
    // A. 8-DIGIT BACKUP CODE VERIFICATION
    if (data.isBackupCode || cleanCode.length === 8) {
      const [record] = await db
        .select()
        .from(userTwoFactor)
        .where(eq(userTwoFactor.userId, data.userId))
        .limit(1)

      if (!record || !record.enabled) {
        return { success: false, error: 'Two-Factor Authentication is not active for this account.' }
      }

      let backupList: string[] = []
      try {
        backupList = JSON.parse(record.backupCodes)
      } catch {}

      const matchIndex = backupList.indexOf(cleanCode)
      if (matchIndex === -1) {
        return { success: false, error: 'Invalid backup recovery code. Please check and try again.' }
      }

      // Consume used code and generate a NEW replacement 8-digit code!
      const newReplacementCode = generate8DigitCode()
      backupList.splice(matchIndex, 1, newReplacementCode)

      await db
        .update(userTwoFactor)
        .set({
          backupCodes: JSON.stringify(backupList),
          updatedAt: new Date(),
        })
        .where(eq(userTwoFactor.userId, data.userId))

      return {
        success: true,
        usedBackupCode: true,
        newBackupCode: newReplacementCode,
        message: 'Backup code accepted! A new backup code was added to your profile.',
      }
    }

    // B. STANDARD 6-DIGIT EMAIL OTP VERIFICATION
    if (cleanCode.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit code or 8-digit backup code.' }
    }

    const otpIdentifier = `2fa-login-otp:${data.userId}`
    const [otpRecord] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, otpIdentifier))
      .limit(1)

    if (!otpRecord) {
      return { success: false, error: 'No active 2FA login code found. Please request a new code.' }
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, otpRecord.id))
      return { success: false, error: '2FA code has expired. Please request a new code.' }
    }

    if (otpRecord.value !== cleanCode) {
      return { success: false, error: 'Invalid 2FA security code. Please check your email.' }
    }

    // Delete used login OTP
    await db.delete(verification).where(eq(verification.id, otpRecord.id))

    return {
      success: true,
      message: 'Two-Factor Authentication verified successfully!',
    }
  } catch (err) {
    console.error('Error in verify2FALoginChallenge:', err)
    return { success: false, error: 'Failed to verify 2FA. Please try again.' }
  }
}
