import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {}
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  replyTo?: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Dynamically resolve IPv4 address for smtp.gmail.com to prevent Linux container IPv6 ENETUNREACH
async function resolveGmailIPv4(): Promise<string> {
  try {
    const addresses = await dns.promises.resolve4('smtp.gmail.com')
    if (addresses && addresses.length > 0) {
      return addresses[0]
    }
  } catch {}

  try {
    const res = await fetch('https://dns.google/resolve?name=smtp.gmail.com&type=A', {
      signal: AbortSignal.timeout(2000),
    })
    const json = await res.json()
    if (json.Answer && Array.isArray(json.Answer)) {
      const aRecords = json.Answer.filter((a: any) => a.type === 1 && a.data).map((a: any) => a.data)
      if (aRecords.length > 0) {
        return aRecords[0]
      }
    }
  } catch {}

  const fallbackIps = ['142.250.152.108', '74.125.130.108', '173.194.76.108', '64.233.184.108']
  return fallbackIps[Math.floor(Math.random() * fallbackIps.length)]
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = '7MEDIA',
  replyTo,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const plainText = text || stripHtml(html)
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '7media.support@gmail.com'

  // ==========================================================================
  // STRATEGY 1: RESEND API (HTTPS Port 443 — 100% immune to Render SMTP block)
  // ==========================================================================
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const fromAddress = process.env.RESEND_FROM || `${fromName} <onboarding@resend.dev>`
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          reply_to: replyTo || smtpUser,
          subject,
          html,
          text: plainText,
        }),
      })

      if (res.ok) {
        console.log('[Email] Successfully dispatched via Resend HTTPS API')
        return { success: true }
      }
      const errText = await res.text()
      console.warn('[Email] Resend API failed, falling back:', errText)
    } catch (resendErr: any) {
      console.warn('[Email] Resend error:', resendErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 2: BREVO (SENDINBLUE) API (HTTPS Port 443)
  // ==========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY
  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: process.env.BREVO_SENDER_EMAIL || smtpUser },
          to: [{ email: to }],
          replyTo: replyTo ? { email: replyTo } : { email: smtpUser },
          subject,
          htmlContent: html,
          textContent: plainText,
        }),
      })

      if (res.ok) {
        console.log('[Email] Successfully dispatched via Brevo HTTPS API')
        return { success: true }
      }
      const errText = await res.text()
      console.warn('[Email] Brevo API failed, falling back:', errText)
    } catch (brevoErr: any) {
      console.warn('[Email] Brevo error:', brevoErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 3: GMAIL SMTP with Direct IPv4 Resolution
  // (Note: Render Free Tier blocks outbound ports 465/587; use Resend/Brevo on Render)
  // ==========================================================================
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] No API key (RESEND_API_KEY / BREVO_API_KEY) or SMTP_PASS configured.')
    return {
      success: false,
      error: 'Email delivery service is currently not configured on this server.',
    }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '')

  const mailPayload = {
    from: `"${fromName}" <${smtpUser}>`,
    to,
    replyTo: replyTo || smtpUser,
    subject,
    text: plainText,
    html,
    headers: {
      'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      'X-Auto-Response-Suppress': 'All',
      'Auto-Submitted': 'auto-generated',
    },
  }

  const targetHost = await resolveGmailIPv4()

  // Attempt Port 465 (Fast 4s connection timeout)
  try {
    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: 465,
      secure: true,
      tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false,
      },
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000,
    } as any)

    await transporter.sendMail(mailPayload)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn(`[Email] Port 465 failed (${primaryErr?.message}), trying Port 587...`)

    // Attempt Port 587 (Fast 4s connection timeout)
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: targetHost,
        port: 587,
        secure: false,
        requireTLS: true,
        tls: {
          servername: 'smtp.gmail.com',
          rejectUnauthorized: false,
        },
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 6000,
      } as any)

      await fallbackTransporter.sendMail(mailPayload)
      return { success: true }
    } catch (fallbackErr: any) {
      console.error('[Email] Outbound SMTP blocked on this host (Render Free Tier firewall). Please add RESEND_API_KEY.')
      return {
        success: false,
        error: 'Outbound SMTP is restricted by host firewall. Please configure RESEND_API_KEY in environment variables.',
      }
    }
  }
}
