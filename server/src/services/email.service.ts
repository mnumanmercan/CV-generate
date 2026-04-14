import { Resend } from 'resend'
import { env } from '../config/env.js'

// Lazy client — only instantiated when an email is actually sent.
// If RESEND_API_KEY is absent (local dev), email calls throw a clear error
// instead of crashing the server at startup.
function getResend(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error('Email not configured: set RESEND_API_KEY in .env to send emails')
  }
  return new Resend(env.RESEND_API_KEY)
}

export const emailService = {
  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`
    await getResend().emails.send({
      from:    env.EMAIL_FROM,
      to,
      subject: 'Verify your Resumark account',
      html:    `
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${url}">${url}</a></p>
        <p>This link expires in 24 hours.</p>
        <p>— The Resumark Team</p>
      `,
    })
  },

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`
    await getResend().emails.send({
      from:    env.EMAIL_FROM,
      to,
      subject: 'Reset your Resumark password',
      html:    `
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${url}">${url}</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p>— The Resumark Team</p>
      `,
    })
  },

  async sendWaitlistConfirmation(to: string): Promise<void> {
    await getResend().emails.send({
      from:    env.EMAIL_FROM,
      to,
      subject: 'You\'re on the Resumark Pro waitlist!',
      html:    `
        <p>Thanks for your interest in Resumark Pro!</p>
        <p>We'll notify you as soon as Pro launches. You'll be among the first to know.</p>
        <p>— The Resumark Team</p>
      `,
    })
  },
}
