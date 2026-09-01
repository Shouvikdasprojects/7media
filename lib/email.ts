import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution globally to eliminate Linux / Render IPv6 ENETUNREACH
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

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = '7MEDIA',
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || '7media.support@gmail.com'
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.GMAIL_PASSWORD
  const resendApiKey = process.env.RESEND_API_KEY
  const brevoApiKey = process.env.BREVO_API_KEY
  const sendgridApiKey = process.env.SENDGRID_API_KEY

  const plainText = text || stripHtml(html)

  // 1. TIER 1: Resend HTTP REST API (Port 443 HTTPS — Instant Cloudflare / Serverless support)
  if (resendApiKey) {
    try {
      console.log(`[Email] Trying Resend HTTPS API for ${to}...`)
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
      console.warn(`[Email] Resend API note (domain verification may be needed for external emails):`, data?.message || data)
    } catch (resendErr: any) {
      console.warn(`[Email] Resend API error, trying next provider:`, resendErr?.message)
    }
  }

  // 2. TIER 2: Brevo (Sendinblue) HTTP REST API (Port 443 HTTPS — Sends to ANY email without custom domain)
  if (brevoApiKey) {
    try {
      console.log(`[Email] Trying Brevo HTTPS API for ${to}...`)
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
      console.warn(`[Email] Brevo API response:`, data)
    } catch (brevoErr: any) {
      console.warn(`[Email] Brevo API error, trying next provider:`, brevoErr?.message)
    }
  }

  // 3. TIER 3: SendGrid HTTP REST API (Port 443 HTTPS)
  if (sendgridApiKey) {
    try {
      console.log(`[Email] Trying SendGrid HTTPS API for ${to}...`)
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
      console.warn(`[Email] SendGrid API error, trying SMTP:`, sendgridErr?.message)
    }
  }

  // 4. TIER 4: Gmail Standard Service (Node.js & Render Engine)
  if (!smtpPass) {
    console.warn('[Email] No email credentials found (RESEND_API_KEY, BREVO_API_KEY, or GMAIL_APP_PASSWORD).')
    return {
      success: false,
      error: 'Email delivery service is currently not configured on this server.',
    }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '').replace(/['"]/g, '')
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

  // Primary SMTP: standard service: 'gmail'
  try {
    console.log(`[Email] Dispatching via Gmail service to ${to}...`)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    await transporter.sendMail(mailPayload)
    console.log(`[Email] Gmail delivery successful to ${to}!`)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Gmail primary service attempt failed, trying Port 587 (TLS)...', primaryErr?.message || primaryErr)

    // Fallback SMTP: Port 587 STARTTLS
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      })

      await fallbackTransporter.sendMail(mailPayload)
      console.log(`[Email] Port 587 delivery successful to ${to}!`)
      return { success: true }
    } catch (fallbackErr: any) {
      console.error('[Email] All email delivery attempts failed:', fallbackErr?.message || fallbackErr)
      return {
        success: false,
        error: fallbackErr?.message || 'Failed to dispatch email. Please check server network.',
      }
    }
  }
}
