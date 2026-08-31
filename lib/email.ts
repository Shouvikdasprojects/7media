import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution to eliminate Render / Linux container IPv6 ENETUNREACH errors
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {}
}

// Custom IPv4 lookup function that forces family: 4 and resolves ONLY IPv4 addresses
const ipv4Lookup = (hostname: string, _options: any, callback: (err: NodeJS.ErrnoException | null, address?: string, family?: number) => void) => {
  dns.lookup(hostname, { family: 4 }, (err, address) => {
    if (err) {
      return callback(err)
    }
    callback(null, address, 4)
  })
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
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
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '7media.support@gmail.com'
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] SMTP_PASS or GMAIL_APP_PASSWORD not set in environment.')
    return { success: false, error: 'Email delivery service is currently not configured on this server.' }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '')
  const plainText = text || stripHtml(html)

  const mailPayload = {
    from: `"${fromName}" <${smtpUser}>`,
    to,
    replyTo: smtpUser,
    subject,
    text: plainText,
    html,
    headers: {
      'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      'X-Auto-Response-Suppress': 'All',
      'Auto-Submitted': 'auto-generated',
    },
  }

  // 1. Primary Strategy: Port 465 (Direct SSL) with explicit IPv4 custom lookup & TLS SNI
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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    } as any)

    await transporter.sendMail(mailPayload)

    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Port 465 delivery attempt failed, trying fallback Port 587 (TLS)...', primaryErr?.message || primaryErr)

    // 2. Secondary Strategy: Port 587 (STARTTLS) with explicit IPv4 custom lookup & TLS SNI
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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      } as any)

      await fallbackTransporter.sendMail(mailPayload)

      return { success: true }
    } catch (fallbackErr: any) {
      console.error('[Email] All SMTP delivery attempts failed:', fallbackErr?.message || fallbackErr)
      return {
        success: false,
        error: fallbackErr?.message || 'Failed to dispatch email. Please check network and try again.',
      }
    }
  }
}
