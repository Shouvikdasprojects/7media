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
  // STRATEGY 1: BREVO (SENDINBLUE) API (HTTPS Port 443 — NO CUSTOM DOMAIN NEEDED)
  // Free 300 emails/day to ANY public user/recipient email
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
      const errData = await res.text()
      console.warn('[Email] Brevo API failed, trying next strategy:', errData)
    } catch (brevoErr: any) {
      console.warn('[Email] Brevo error:', brevoErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 2: RESEND API (HTTPS Port 443)
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
      const errText = await res.text()
      console.warn('[Email] Resend API failed, trying next strategy:', errText)
    } catch (resendErr: any) {
      console.warn('[Email] Resend error:', resendErr?.message)
    }
  }

  // ==========================================================================
  // STRATEGY 3: GMAIL SMTP (Native Service with family: 4 IPv4 lock)
  // ==========================================================================
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] No BREVO_API_KEY, RESEND_API_KEY, or SMTP_PASS configured.')
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

  // Strategy 3A: Native Nodemailer 'gmail' service with family: 4
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
      family: 4,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    } as any)

    await transporter.sendMail(mailPayload)
    console.log(`[Email] Gmail service delivery successful to ${to}!`)
    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Gmail native service attempt failed, trying Port 587 (TLS)...', primaryErr?.message || primaryErr)

    // Strategy 3B: Port 587 STARTTLS with family: 4
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        family: 4,
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      } as any)

      await fallbackTransporter.sendMail(mailPayload)
      console.log(`[Email] Port 587 delivery successful to ${to}!`)
      return { success: true }
    } catch (fallbackErr: any) {
      console.warn('[Email] Port 587 failed, trying Port 465 SSL...', fallbackErr?.message || fallbackErr)

      // Strategy 3C: Port 465 Direct SSL with family: 4
      try {
        const sslTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          family: 4,
          auth: {
            user: smtpUser,
            pass: cleanPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 12000,
        } as any)

        await sslTransporter.sendMail(mailPayload)
        console.log(`[Email] Port 465 delivery successful to ${to}!`)
        return { success: true }
      } catch (finalErr: any) {
        console.error('[Email] All email delivery attempts failed:', finalErr?.message || finalErr)
        return {
          success: false,
          error: finalErr?.message || 'Failed to dispatch email. Please check credentials and server network.',
        }
      }
    }
  }
}
