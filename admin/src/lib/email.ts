/**
 * Email Service using Resend
 * Handles all email sending for authentication flows
 */

import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export function createEmailService(apiKey: string, fromEmail: string) {
  const resend = new Resend(apiKey)

  return {
    async sendEmail(options: EmailOptions) {
      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        })

        if (error) {
          console.error('Failed to send email:', error)
          throw new Error(`Email sending failed: ${error.message}`)
        }

        return { success: true, data }
      } catch (error) {
        console.error('Email service error:', error)
        throw error
      }
    },

    async sendVerificationEmail(email: string, verificationUrl: string) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .button:hover { background: #5568d3; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verify Your Email</h1>
              </div>
              <div class="content">
                <p>Thank you for signing up for our Webhook Admin Panel!</p>
                <p>Please click the button below to verify your email address and activate your account:</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>Webhook Admin Panel</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `

      return this.sendEmail({
        to: email,
        subject: 'Verify your email address',
        html,
      })
    },

    async sendPasswordResetEmail(email: string, resetUrl: string) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .button:hover { background: #e04a5f; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reset Your Password</h1>
              </div>
              <div class="content">
                <p>We received a request to reset your password for your Webhook Admin Panel account.</p>
                <p>Click the button below to set a new password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <div class="warning">
                  <strong>Security Note:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </div>
              </div>
              <div class="footer">
                <p>Webhook Admin Panel</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `

      return this.sendEmail({
        to: email,
        subject: 'Reset your password',
        html,
      })
    },

    async sendExistingUserNotification(email: string) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin: 15px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Account Status</h1>
              </div>
              <div class="content">
                <p>We received a sign-up attempt for this email address.</p>
                <div class="info">
                  <strong>Good news!</strong> An account with this email already exists but hasn't been verified yet.
                </div>
                <p>If you'd like to verify your account, please check your inbox for the original verification email or request a new one.</p>
                <p>If you've forgotten your password, you can reset it from the login page.</p>
                <p>If you didn't attempt to sign up, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>Webhook Admin Panel</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `

      return this.sendEmail({
        to: email,
        subject: 'Your account status',
        html,
      })
    },
  }
}
