import nodemailer from 'nodemailer'

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

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, ''),
      },
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 9000,
    })

    await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[Email] Failed to send email via SMTP:', err?.message || err)
    return {
      success: false,
      error: err?.message || 'Failed to dispatch email. Please check network and try again.',
    }
  }
}
