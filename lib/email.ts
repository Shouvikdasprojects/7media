import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 first in Node.js DNS resolution to eliminate Render / Linux container IPv6 ENETUNREACH errors
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {}
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  fromName?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  fromName = '7MEDIA Security',
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '7media.support@gmail.com'
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!smtpPass) {
    console.warn('[Email] SMTP_PASS or GMAIL_APP_PASSWORD not set in environment.')
    return { success: false, error: 'Email delivery service is currently not configured on this server.' }
  }

  const cleanPass = smtpPass.replace(/\s+/g, '')

  // 1. Primary Strategy: Port 465 (Direct SSL) with explicit IPv4
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // CRITICAL: Forces IPv4 to bypass Render container IPv6 ENETUNREACH
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    } as any)

    await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (primaryErr: any) {
    console.warn('[Email] Port 465 delivery attempt failed, trying fallback Port 587 (TLS)...', primaryErr?.message || primaryErr)

    // 2. Secondary Strategy: Port 587 (STARTTLS) with explicit IPv4
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        family: 4, // CRITICAL: Forces IPv4
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      } as any)

      await fallbackTransporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        to,
        subject,
        html,
      })

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
