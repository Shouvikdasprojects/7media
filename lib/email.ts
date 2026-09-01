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
 * Resolves a hostname strictly to IPv4 address to eliminate Linux/Render IPv6 ENETUNREACH errors
 */
async function resolveIPv4(hostname: string): Promise<string> {
  try {
    const addresses = await dns.promises.resolve4(hostname)
    if (addresses && addresses.length > 0) {
      return addresses[0]
    }
  } catch (err: any) {
    console.warn(`[Email DNS] resolve4 fallback for ${hostname}:`, err?.message || err)
  }
  return hostname
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
  const resendApiKey = process.env.RESEND_API_KEY
  const brevoApiKey = process.env.BREVO_API_KEY
  const sendgridApiKey = process.env.SENDGRID_API_KEY

  const plainText = text || stripHtml(html)

  // 1. TIER 1: Resend HTTP REST API (HTTPS Port 443 — 100% Cloudflare Pages & Edge compatible)
  if (resendApiKey) {
    try {
      console.log(`[Email] Dispatching via Resend HTTPS API to ${to}...`)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <onboarding@resend.dev>`,
          to: [to],
          subject,
          html,
          text: plainText,
        }),
      })

      const data = await res.json()
      if (res.ok && data.id) {
        console.log(`[Email] Resend delivery successful! Message ID: ${data.id}`)
        return { success: true }
      }
      console.warn(`[Email] Resend API response:`, data)
    } catch (resendErr: any) {
      console.warn(`[Email] Resend API failed, trying next provider:`, resendErr?.message)
    }
  }

  // 2. TIER 2: Brevo (Sendinblue) HTTP REST API (HTTPS Port 443)
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
          sender: { name: fromName, email: smtpUser },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: plainText,
        }),
      })

      if (res.ok) {
        console.log(`[Email] Brevo delivery successful to ${to}!`)
        return { success: true }
      }
      const data = await res.json()
      console.warn(`[Email] Brevo API error response:`, data)
    } catch (brevoErr: any) {
      console.warn(`[Email] Brevo API failed, trying next provider:`, brevoErr?.message)
    }
  }

  // 3. TIER 3: SendGrid HTTP REST API (HTTPS Port 443)
  if (sendgridApiKey) {
    try {
      console.log(`[Email] Dispatching via SendGrid HTTPS API to ${to}...`)
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: smtpUser, name: fromName },
          subject,
          content: [
            { type: 'text/plain', value: plainText },
            { type: 'text/html', value: html },
          ],
        }),
      })

      if (res.ok || res.status === 202) {
        console.log(`[Email] SendGrid delivery successful to ${to}!`)
        return { success: true }
      }
    } catch (sendgridErr: any) {
      console.warn(`[Email] SendGrid API failed, trying SMTP:`, sendgridErr?.message)
    }
  }

  // 4. TIER 4: Direct IPv4 Gmail SMTP on Port 465 (SSL)
  if (!smtpPass) {
    console.warn('[Email] No HTTP API Key (RESEND_API_KEY / BREVO_API_KEY) or GMAIL_APP_PASSWORD found.')
    return {
      success: false,
      error: 'Email delivery is not configured. Please add a RESEND_API_KEY or BREVO_API_KEY to your environment.',
    }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '')
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

  // Strictly pre-resolve IPv4 so Node / glibc NEVER touches IPv6
  const targetIpv4 = await resolveIPv4('smtp.gmail.com')

  try {
    console.log(`[Email] Connecting to IPv4 ${targetIpv4}:465 (SSL)...`)
    const transporter = nodemailer.createTransport({
      host: targetIpv4,
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
    console.log(`[Email] Port 465 (IPv4) delivery successful to ${to}!`)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Port 465 (IPv4) attempt failed, trying Port 587 (STARTTLS)...', primaryErr?.message || primaryErr)

    // 3. TIER 3: Direct IPv4 Gmail SMTP on Port 587 (STARTTLS)
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: targetIpv4,
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
      console.log(`[Email] Port 587 (IPv4) delivery successful to ${to}!`)
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
