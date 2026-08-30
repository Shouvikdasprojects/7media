import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Strict email regex (RFC 5322 standard subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

// HTML Entity Escaper for safe email rendering
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Strip CRLF control characters to prevent SMTP header injection
function sanitizeHeaderField(str: string): string {
  return str.replace(/[\r\n\t\0]/g, ' ').trim()
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: Max 5 inquiries per hour per IP
  const clientIp = getClientIp(req)
  const rateLimitResult = checkRateLimit(`contact:${clientIp}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse(
      rateLimitResult,
      'Too many contact inquiries from your IP. Please wait before submitting again.'
    )
  }

  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const { name, email, subject, message } = body || {}

    // 2. Strict Input Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid name.' }, { status: 400 })
    }
    const cleanName = sanitizeHeaderField(name)
    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters.' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }
    const cleanEmail = email.trim()
    if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const rawSubject = typeof subject === 'string' && subject.trim() ? subject : 'General Inquiry'
    const cleanSubject = sanitizeHeaderField(rawSubject).slice(0, 100)

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Please provide a message.' }, { status: 400 })
    }
    const cleanMessage = message.trim()
    if (cleanMessage.length < 5) {
      return NextResponse.json(
        { error: 'Message must be at least 5 characters long.' },
        { status: 400 }
      )
    }
    if (cleanMessage.length > 3000) {
      return NextResponse.json(
        { error: 'Message is too long (maximum 3,000 characters allowed).' },
        { status: 400 }
      )
    }

    // 3. Environment Secrets (Server-side only)
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '7media.support@gmail.com'
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
    const adminEmail = process.env.ADMIN_EMAIL || 'shouvikdaswork@gmail.com'

    // 4. HTML Escaped Template
    const safeName = escapeHtml(cleanName)
    const safeEmail = escapeHtml(cleanEmail)
    const safeSubject = escapeHtml(cleanSubject)
    const safeMessage = escapeHtml(cleanMessage)

    if (smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ''),
        },
      })

      const mailOptions = {
        from: `"7MEDIA Contact Desk" <${smtpUser}>`,
        to: adminEmail,
        replyTo: cleanEmail,
        subject: `[7MEDIA Inquiry] ${cleanSubject} - From ${cleanName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #f4f4f5; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <div style="background: #e50914; padding: 20px 24px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px;">7MEDIA CONTACT DESK</h1>
            </div>
            <div style="padding: 24px;">
              <p style="font-size: 13px; color: #a1a1aa; margin-top: 0;">You have received a new verified inquiry from the 7MEDIA contact desk.</p>
              
              <div style="background: #18181b; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.06);">
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Sender Name:</strong> ${safeName}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Sender Email:</strong> <a href="mailto:${safeEmail}" style="color: #e50914; text-decoration: none;">${safeEmail}</a></p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Topic:</strong> ${safeSubject}</p>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
                <p style="margin: 0; font-size: 12px; color: #71717a;"><strong>Origin IP:</strong> ${escapeHtml(clientIp)}</p>
              </div>

              <div style="margin-top: 20px;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #e50914; margin-bottom: 8px;">Message:</h3>
                <div style="background: #18181b; padding: 16px; border-radius: 12px; line-height: 1.6; font-size: 14px; white-space: pre-wrap; color: #e4e4e7; border: 1px solid rgba(255,255,255,0.06);">
${safeMessage}
                </div>
              </div>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #71717a; text-align: center;">
                Click "Reply" to directly email the sender at <strong>${safeEmail}</strong>.
              </div>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      return NextResponse.json({ success: true, delivered: true })
    }

    // Safe development console logger
    console.log('=== [7MEDIA CONTACT DESK SUBMISSION (DEV)] ===')
    console.log(`From: ${cleanName} <${cleanEmail}> [IP: ${clientIp}]`)
    console.log(`Subject: ${cleanSubject}`)
    console.log(`Routing Destination: ${adminEmail}`)
    console.log(`Message Length: ${cleanMessage.length} chars`)
    console.log('==============================================')

    return NextResponse.json({
      success: true,
      delivered: false,
      notice: 'Inquiry received. Configure GMAIL_APP_PASSWORD in .env for automated SMTP dispatch.',
    })
  } catch (err: any) {
    // Shield internal stack trace from client JSON response
    console.error('[Contact API Internal Error]', err)
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again later.' },
      { status: 500 }
    )
  }
}
