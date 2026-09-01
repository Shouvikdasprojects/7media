import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution to eliminate Render Linux container IPv6 ENETUNREACH
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {}
}

// Custom IPv4 lookup function that forces family: 4 and resolves ONLY IPv4 addresses
const ipv4Lookup = (
  hostname: string,
  _options: any,
  callback: (err: NodeJS.ErrnoException | null, address?: string, family?: number) => void
) => {
  dns.lookup(hostname, { family: 4 }, (err, address) => {
    if (err) {
      return callback(err)
    }
    callback(null, address, 4)
  })
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
  // STRATEGY 1: GOOGLE APPS SCRIPT WEBHOOK (HTTPS Port 443 — NO DOMAIN NEEDED)
  // Sends natively from your Gmail account via Google Cloud API without SMTP ports!
  // ==========================================================================
  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL
  if (gmailWebhookUrl) {
    try {
      console.log(`[Email] Dispatching via Google Apps Script Webhook to ${to}...`)
      const res = await fetch(gmailWebhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          secret: process.env.GMAIL_WEBHOOK_SECRET || '7media-secure-key-2026',
          to,
          subject,
          html,
          text: plainText,
          fromName,
          replyTo: replyTo || smtpUser,
        }),
        redirect: 'follow',
      })

      if (res.ok) {
        const text = await res.text().catch(() => '')
        let data: any = {}
        try {
          data = JSON.parse(text)
        } catch {}
        if (data.success !== false) {
          console.log(`[Email] Google Webhook successfully delivered email to ${to}!`)
          return { success: true }
        }
        console.warn('[Email] Google Webhook returned error:', data.error || text)
      } else {
        const errText = await res.text().catch(() => '')
        console.warn(`[Email] Google Webhook HTTP ${res.status}:`, errText)
      }
    } catch (webhookErr: any) {
      console.warn('[Email] Google Webhook error, trying next strategy:', webhookErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 2: BREVO (SENDINBLUE) API (HTTPS Port 443 — NO CUSTOM DOMAIN NEEDED)
  // Free 300 emails/day to ANY public recipient email
  // ==========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY
  if (brevoApiKey) {
    try {
      console.log(`[Email] Dispatching via Brevo HTTPS API to ${to}...`)
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
        console.log(`[Email] Successfully dispatched via Brevo HTTPS API to ${to}`)
        return { success: true }
      }
      const errData = await res.text().catch(() => '')
      console.warn('[Email] Brevo API error, trying next strategy:', errData)
    } catch (brevoErr: any) {
      console.warn('[Email] Brevo error:', brevoErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 3: RESEND API (HTTPS Port 443)
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
        console.log(`[Email] Successfully dispatched via Resend HTTPS API to ${to}`)
        return { success: true }
      }
      const errText = await res.text().catch(() => '')
      console.warn('[Email] Resend API error, trying next strategy:', errText)
    } catch (resendErr: any) {
      console.warn('[Email] Resend error:', resendErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 4: GMAIL SMTP with Fast Connection Timeout
  // (Works locally; on Render Free Tier SMTP ports may be blocked by host firewall)
  // ==========================================================================
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] No GMAIL_WEBHOOK_URL, BREVO_API_KEY, RESEND_API_KEY, or SMTP_PASS configured.')
    return {
      success: false,
      error: 'Email service is not configured. Please add GMAIL_WEBHOOK_URL or BREVO_API_KEY in environment variables.',
    }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '').replace(/['"]/g, '')

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

  // Fast-fail connection timeout (3.5s) to avoid blocking Server Actions if host blocks SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      lookup: ipv4Lookup,
      tls: {
        servername: 'smtp.gmail.com',
      },
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
      connectionTimeout: 3500,
      greetingTimeout: 3500,
      socketTimeout: 5000,
    } as any)

    await transporter.sendMail(mailPayload)
    console.log(`[Email] Port 465 delivery successful to ${to}!`)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Port 465 failed, trying Port 587...', primaryErr?.message || primaryErr)

    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        lookup: ipv4Lookup,
        tls: {
          servername: 'smtp.gmail.com',
        },
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 3500,
        greetingTimeout: 3500,
        socketTimeout: 5000,
      } as any)

      await fallbackTransporter.sendMail(mailPayload)
      console.log(`[Email] Port 587 delivery successful to ${to}!`)
      return { success: true }
    } catch (fallbackErr: any) {
      console.error('[Email] Outbound SMTP blocked by host firewall. Setup GMAIL_WEBHOOK_URL or BREVO_API_KEY for instant HTTPS delivery.')
      return {
        success: false,
        error: 'Host firewall blocked SMTP. Please configure GMAIL_WEBHOOK_URL or BREVO_API_KEY.',
      }
    }
  }
}
