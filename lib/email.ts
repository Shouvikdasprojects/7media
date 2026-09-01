import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution globally
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {}
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

/**
 * Resolve direct IPv4 address for a hostname to bypass IPv6 ENETUNREACH on cloud containers (Render/Linux)
 */
async function getDirectIPv4(hostname: string): Promise<string> {
  try {
    const addresses = await dns.promises.resolve4(hostname)
    if (addresses && addresses.length > 0) {
      return addresses[Math.floor(Math.random() * addresses.length)]
    }
  } catch {}
  return hostname
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = '7MEDIA',
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const plainText = text || stripHtml(html)

  // =========================================================================
  // 1. STRATEGY 1: HTTP API (Resend API) - 100% Reliable over HTTPS Port 443
  // =========================================================================
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || '7MEDIA <onboarding@resend.dev>'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text: plainText,
        }),
      })

      if (res.ok) {
        return { success: true }
      }
      const errData = await res.json().catch(() => ({}))
      console.warn('[Email] Resend API error:', errData)
    } catch (resendErr: any) {
      console.warn('[Email] Resend dispatch error:', resendErr?.message || resendErr)
    }
  }

  // =========================================================================
  // 2. STRATEGY 2: HTTP API (Brevo / Sendinblue API) - Reliable over HTTPS Port 443
  // =========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY
  if (brevoApiKey) {
    try {
      const senderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || 'support@7media.pages.dev'
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: plainText,
        }),
      })

      if (res.ok) {
        return { success: true }
      }
      const errData = await res.json().catch(() => ({}))
      console.warn('[Email] Brevo API error:', errData)
    } catch (brevoErr: any) {
      console.warn('[Email] Brevo dispatch error:', brevoErr?.message || brevoErr)
    }
  }

  // =========================================================================
  // 3. STRATEGY 3: Gmail SMTP with Explicit Direct IPv4 Resolution
  // =========================================================================
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '7media.support@gmail.com'
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] Neither RESEND_API_KEY, BREVO_API_KEY, nor SMTP_PASS is configured.')
    return { success: false, error: 'Email service is not configured on this server.' }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '')
  const rawHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const targetIp = await getDirectIPv4(rawHost)

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

  // 3a. Primary SMTP: Direct IPv4 SSL on Port 465
  try {
    const transporter = nodemailer.createTransport({
      host: targetIp,
      port: 465,
      secure: true,
      tls: {
        servername: rawHost,
        rejectUnauthorized: false,
      },
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    } as any)

    await transporter.sendMail(mailPayload)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Port 465 delivery attempt failed, trying Port 587 (TLS)...', primaryErr?.message || primaryErr)

    // 3b. Secondary SMTP: Direct IPv4 STARTTLS on Port 587
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: targetIp,
        port: 587,
        secure: false,
        requireTLS: true,
        tls: {
          servername: rawHost,
          rejectUnauthorized: false,
        },
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
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
