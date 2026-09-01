import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution to eliminate Render / Linux container IPv6 ENETUNREACH errors
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
  } catch (err: any) {
    console.warn('[Email] dns.promises.resolve4 failed, falling back to DoH:', err?.message)
  }

  // Fallback via Google DNS-over-HTTPS (DoH)
  try {
    const res = await fetch('https://dns.google/resolve?name=smtp.gmail.com&type=A', {
      signal: AbortSignal.timeout(3000),
    })
    const json = await res.json()
    if (json.Answer && Array.isArray(json.Answer)) {
      const aRecords = json.Answer.filter((a: any) => a.type === 1 && a.data).map((a: any) => a.data)
      if (aRecords.length > 0) {
        return aRecords[0]
      }
    }
  } catch {}

  // Known Google SMTP IPv4 Anycast IP pool fallback
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

  // 1. Check if Resend API Key is provided (Ultra-fast HTTPS Port 443 — immune to SMTP blocks)
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <onboarding@resend.dev>`,
          to: [to],
          reply_to: replyTo,
          subject,
          html,
          text: plainText,
        }),
      })

      if (res.ok) {
        return { success: true }
      }
      const errText = await res.text()
      console.warn('[Email] Resend API failed, falling back to SMTP:', errText)
    } catch (resendErr: any) {
      console.warn('[Email] Resend error:', resendErr?.message)
    }
  }

  // 2. Gmail SMTP Delivery with Direct IPv4 resolution
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '7media.support@gmail.com'
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] SMTP_PASS or GMAIL_APP_PASSWORD not set in environment.')
    return { success: false, error: 'Email delivery service is currently not configured on this server.' }
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

  // Resolve pure IPv4 IP to guarantee no IPv6 ENETUNREACH occurs
  const targetHost = await resolveGmailIPv4()

  // Strategy A: Port 465 (Direct SSL) with direct IPv4 target & TLS SNI
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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    } as any)

    await transporter.sendMail(mailPayload)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn(`[Email] Direct IPv4 (${targetHost}:465) attempt failed, trying Port 587...`, primaryErr?.message || primaryErr)

    // Strategy B: Port 587 (STARTTLS) with direct IPv4 target & TLS SNI
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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      } as any)

      await fallbackTransporter.sendMail(mailPayload)
      return { success: true }
    } catch (fallbackErr: any) {
      console.warn(`[Email] Direct IPv4 (${targetHost}:587) attempt failed, trying hostname fallback...`, fallbackErr?.message || fallbackErr)

      // Strategy C: Fallback to standard hostname
      try {
        const standardTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: cleanPass,
          },
        })
        await standardTransporter.sendMail(mailPayload)
        return { success: true }
      } catch (finalErr: any) {
        console.error('[Email] All SMTP delivery strategies failed:', finalErr?.message || finalErr)
        return {
          success: false,
          error: finalErr?.message || 'Failed to dispatch email. Please check credentials and try again.',
        }
      }
    }
  }
}
