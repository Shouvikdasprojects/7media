/**
 * 7MEDIA Luxury Email Templates
 * Bulletproof HTML email generator compatible with Gmail, Apple Mail, Outlook, Yahoo
 * Designed with modern cinematic aesthetics, high deliverability, and anti-spam compliance.
 */

export interface PremiumEmailOptions {
  badgeTitle: string
  heading: string
  subheading?: string
  recipientName?: string
  message: string
  code?: string
  codeLabel?: string
  expiresInText?: string
  securityTip?: string
  accentColor?: string
  actionUrl?: string
  actionText?: string
}

export function buildPremiumEmailHtml({
  badgeTitle,
  heading,
  subheading = 'Cinematic Streaming Ecosystem',
  recipientName,
  message,
  code,
  codeLabel = 'Security Code',
  expiresInText = '15 minutes',
  securityTip = '7MEDIA staff will never ask for your password, verification codes, or personal security credentials.',
  accentColor = '#E50914',
  actionUrl,
  actionText,
}: PremiumEmailOptions): string {
  const currentYear = new Date().getFullYear()

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>7MEDIA Security Notification</title>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <!-- Preheader preview text for inbox -->
  <div style="display:none;font-size:1px;color:#0b0c10;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${code ? `${code} is your 7MEDIA verification code.` : heading} Valid for ${expiresInText}.
  </div>

  <!-- Outer background container -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; min-height: 100%;">
    <tr>
      <td align="center" style="padding: 36px 16px 48px 16px;">
        
        <!-- Main Card Container (Max Width 560px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #121318; border: 1px solid #232530; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          
          <!-- Top Cinematic Banner & Brand Header -->
          <tr>
            <td style="padding: 32px 32px 28px 32px; background: linear-gradient(180deg, #1a1014 0%, #121318 100%); border-bottom: 1px solid #232530; text-align: center;">
              
              <!-- Brand Logo Emblem -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 6px 14px; background-color: #1f0b0e; border: 1px solid #4a121a; border-radius: 30px; margin-bottom: 12px;">
                      <span style="color: #ff334b; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        ${badgeTitle}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size: 30px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase; display: block; line-height: 1.1;">
                      7<span style="color: ${accentColor};">MEDIA</span>
                    </span>
                    <span style="font-size: 11px; color: #8a8d9b; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; display: block; margin-top: 6px;">
                      ${subheading}
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 32px 32px;">
              
              <!-- Heading -->
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                ${heading}
              </h1>

              ${
                recipientName
                  ? `<p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #d0d2dd;">
                      Hello <span style="color: #ffffff; font-weight: 700;">${recipientName}</span>,
                    </p>`
                  : ''
              }

              <p style="margin: 0 0 26px 0; font-size: 14px; line-height: 1.65; color: #9da1b4;">
                ${message}
              </p>

              ${
                code
                  ? `
              <!-- Ultra-Luxury Verification Code Vault Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="background-color: #0c0d11; border: 1px solid #2a2c3a; border-radius: 16px; padding: 24px 20px; text-align: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #73778c; margin-bottom: 12px;">
                      ${codeLabel}
                    </div>
                    <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: ${accentColor}; text-shadow: 0 0 20px rgba(229, 9, 20, 0.4); line-height: 1; padding: 4px 0 12px 0;">
                      ${code}
                    </div>
                    <div style="display: inline-block; background-color: #171922; border: 1px solid #282b3a; border-radius: 20px; padding: 4px 12px;">
                      <span style="font-size: 11px; font-weight: 600; color: #8e92a6;">
                        ⏳ Valid for <strong style="color: #e2e4ee;">${expiresInText}</strong>
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              ${
                actionUrl && actionText
                  ? `
              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e50914 0%, #b81d24 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 6px 20px rgba(229, 9, 20, 0.35);">
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Security Notice Banner -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171922; border-left: 3px solid ${accentColor}; border-radius: 0 12px 12px 0; padding: 14px 16px; margin: 0 0 10px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; line-height: 1.55; color: #888c9f;">
                      🛡️ <strong style="color: #c4c7d7;">Security Reminder:</strong> ${securityTip}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 24px 32px 30px 32px; background-color: #0e0f14; border-top: 1px solid #1f212c; text-align: center;">
              
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #6b6f82;">
                7MEDIA • Pure Cinematic Entertainment &amp; Streaming
              </p>

              <p style="margin: 0 0 14px 0; font-size: 11px; color: #525566; line-height: 1.5;">
                This is an automated operational notification. For assistance, contact our team at 
                <a href="mailto:7media.support@gmail.com" style="color: #ff334b; text-decoration: none; font-weight: 600;">7media.support@gmail.com</a>
              </p>

              <div style="font-size: 10px; color: #414352; letter-spacing: 0.5px;">
                &copy; ${currentYear} 7MEDIA Inc. All rights reserved. • <a href="https://7media.pages.dev" target="_blank" style="color: #6b6f82; text-decoration: underline;">7media.pages.dev</a>
              </div>

            </td>
          </tr>

        </table>
        <!-- End Card Container -->

      </td>
    </tr>
  </table>

</body>
</html>`
}
