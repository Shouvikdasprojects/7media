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
  // STRATEGY 1: BREVO API (Optional HTTPS Port 443 — No custom domain needed)
  // ==========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY
  if (brevoApiKey) {
    try {
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
    } catch (brevoErr: any) {
      console.warn('[Email] Brevo error:', brevoErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 2: RESEND API (Optional HTTPS Port 443)
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
    } catch (resendErr: any) {
      console.warn('[Email] Resend error:', resendErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 3: GMAIL SMTP with ipv4Lookup (Commit e15ea31 working configuration)
  // ==========================================================================
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] SMTP_PASS or GMAIL_APP_PASSWORD not set in environment.')
    return {
      success: false,
      error: 'Email delivery service is currently not configured on this server.',
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

  // Strategy 3A: Port 465 (Direct SSL) with explicit ipv4Lookup & TLS SNI
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
    console.log(`[Email] Port 465 (IPv4) delivery successful to ${to}!`)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Port 465 delivery attempt failed, trying fallback Port 587 (TLS)...', primaryErr?.message || primaryErr)

    // Strategy 3B: Port 587 (STARTTLS) with explicit ipv4Lookup & TLS SNI
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
      console.log(`[Email] Port 587 (IPv4) delivery successful to ${to}!`)
      return { success: true }
    } catch (fallbackErr: any) {
      console.warn('[Email] Port 587 failed, trying standard service: gmail...', fallbackErr?.message || fallbackErr)

      // Strategy 3C: Standard Nodemailer service: gmail
      try {
        const standardTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: cleanPass,
          },
        })

        await standardTransporter.sendMail(mailPayload)
        console.log(`[Email] Standard service delivery successful to ${to}!`)
        return { success: true }
      } catch (finalErr: any) {
        console.error('[Email] All email delivery attempts failed:', finalErr?.message || finalErr)
        return {
          success: false,
          error: finalErr?.message || 'Failed to dispatch email. Please check credentials and try again.',
        }
      }
    }
  }
}
