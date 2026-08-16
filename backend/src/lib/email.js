import { Resend } from 'resend'
import config from '../config/env.js'
import logger from './logger.js'

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null

async function deliverEmail({ toEmail, subject, html, fallbackLogLabel, fallbackUrl }) {
    if (!resend || config.nodeEnv === 'test') {
        const logParts = [
            `[email] ${fallbackLogLabel || subject}`,
            `to=${toEmail}`,
            fallbackUrl ? `url=${fallbackUrl}` : null,
        ].filter(Boolean)

        logger.warn(logParts.join(' '))
        return
    }

    const { error } = await resend.emails.send({
        from: config.resend.from,
        to: toEmail,
        subject,
        html,
    })

    if (error) {
        logger.error('Failed to send email', { to: toEmail, subject, error })
        throw new Error(`Could not send email: ${subject}`)
    }

    logger.info('Email sent', { to: toEmail, subject })
}

function renderShell({ title, intro, body, ctaLabel, ctaUrl, footer }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#1e293b;border-radius:16px;padding:40px 32px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:linear-gradient(135deg,#14b8a6,#0f766e);border-radius:12px;color:#fff;font-weight:700;font-size:14px;letter-spacing:-0.5px;">AE</div>
            </td>
          </tr>
          <tr>
            <td style="color:#f8fafc;font-size:22px;font-weight:700;text-align:center;padding-bottom:12px;">
              ${title}
            </td>
          </tr>
          <tr>
            <td style="color:#94a3b8;font-size:15px;line-height:1.6;text-align:center;padding-bottom:20px;">
              ${intro}
            </td>
          </tr>
          <tr>
            <td style="color:#cbd5e1;font-size:14px;line-height:1.7;padding-bottom:28px;">
              ${body}
            </td>
          </tr>
          ${ctaUrl ? `
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${ctaUrl}"
                 style="display:inline-block;padding:14px 32px;background:#14b8a6;color:#042f2e;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                ${ctaLabel}
              </a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="color:#64748b;font-size:13px;line-height:1.6;text-align:center;padding-bottom:16px;">
              ${footer}
            </td>
          </tr>
          <tr>
            <td style="color:#475569;font-size:12px;text-align:center;border-top:1px solid #334155;padding-top:20px;">
              AdultEdu · UK Adult Learning Platform
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Send a password reset email via Resend.
 * @param {string} toEmail - Recipient email address
 * @param {string} resetUrl - Full reset URL including token
 */
export async function sendPasswordResetEmail(toEmail, resetUrl) {
    await deliverEmail({
        toEmail,
        subject: 'Reset your AdultEdu password',
        fallbackLogLabel: 'password reset link',
        fallbackUrl: resetUrl,
        html: renderShell({
            title: 'Reset your password',
            intro: 'We received a request to reset the password for your AdultEdu account.',
            body: 'Click the button below to choose a new password. This reset link expires in <strong style="color:#f8fafc;">1 hour</strong>.',
            ctaLabel: 'Reset password',
            ctaUrl: resetUrl,
            footer: 'If you did not request this, you can safely ignore this email. Your password will not change.',
        }),
    })
}

export async function sendVerificationEmail(toEmail, verifyUrl) {
    await deliverEmail({
        toEmail,
        subject: 'Verify your AdultEdu email',
        fallbackLogLabel: 'verification link',
        fallbackUrl: verifyUrl,
        html: renderShell({
            title: 'Verify your email',
            intro: 'Your AdultEdu account is ready. Please confirm that this email address belongs to you.',
            body: 'Verification keeps password recovery reliable and makes sure reminders reach the right inbox. The link below expires in <strong style="color:#f8fafc;">24 hours</strong>.',
            ctaLabel: 'Verify email',
            ctaUrl: verifyUrl,
            footer: 'You can keep learning without verifying first, but some account emails may stay limited until this step is complete.',
        }),
    })
}

export async function sendWelcomeEmail(toEmail, continueUrl) {
    await deliverEmail({
        toEmail,
        subject: 'Welcome to AdultEdu',
        fallbackLogLabel: 'welcome email',
        fallbackUrl: continueUrl,
        html: renderShell({
            title: 'Welcome to AdultEdu',
            intro: 'You can keep going without waiting. Your account is already live.',
            body: 'AdultEdu is designed to make the next step feel clearer, calmer, and easier to return to. Use the link below to pick up where you left off.',
            ctaLabel: 'Continue learning',
            ctaUrl: continueUrl,
            footer: 'If you have not verified your email yet, that link should already be in your inbox.',
        }),
    })
}

export async function sendReturnReminderEmail(toEmail, continueUrl, verifyUrl = null) {
    const reminderBody = verifyUrl
        ? 'You started AdultEdu recently but have not built a study habit yet. Come back for one short session and verify your email if you still need to secure the account.'
        : 'You started AdultEdu recently but have not built a study habit yet. Come back for one short session and keep the momentum going.'

    await deliverEmail({
        toEmail,
        subject: 'Pick up where you left off on AdultEdu',
        fallbackLogLabel: 'return reminder',
        fallbackUrl: continueUrl,
        html: renderShell({
            title: 'Pick up where you left off',
            intro: 'One short return visit is enough to make the pathway feel familiar again.',
            body: reminderBody,
            ctaLabel: 'Return to AdultEdu',
            ctaUrl: continueUrl,
            footer: verifyUrl ? `Need to verify first? Use this link: <a href="${verifyUrl}" style="color:#5eead4;">verify your email</a>.` : 'Your saved progress will still be there when you return.',
        }),
    })
}
