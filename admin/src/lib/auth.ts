/**
 * Better Auth Configuration
 * Google OAuth + Email/Password with account merging
 * Uses scrypt for password hashing (Cloudflare Workers compatible)
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import type { Bindings } from '@/types/hono'
import * as schema from './db-schema'
import { createEmailService } from './email'

export function createAuth(env: Bindings) {
  const db = drizzle(env.DB, { schema })
  const emailService = createEmailService(env.RESEND_API_KEY, env.FROM_EMAIL)

  const auth = betterAuth({
    baseURL: env.BASE_URL || 'http://localhost:5173',
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(db, {
      provider: 'sqlite',
    }),

    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        console.log('📧 Sending verification email to:', user.email)
        console.log('📧 Verification URL:', url)
        try {
          await emailService.sendVerificationEmail(user.email, url)
          console.log('✅ Verification email sent successfully')
        } catch (error) {
          console.error('❌ Failed to send verification email:', error)
          throw error
        }
      },
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        console.log('🔑 Sending password reset email to:', user.email)
        console.log('🔍 Original Reset URL:', url)

        // Fix the callbackURL parameter if it's empty
        const fixedUrl = url.replace('callbackURL=', 'callbackURL=/reset-password')
        console.log('🔍 Fixed Reset URL:', fixedUrl)

        try {
          await emailService.sendPasswordResetEmail(user.email, fixedUrl)
          console.log('✅ Password reset email sent successfully')
        } catch (error) {
          console.error('❌ Failed to send password reset email:', error)
          throw error
        }
      },
      resetPasswordRedirectTo: '/reset-password',
      // Using Better Auth's default scrypt (Cloudflare Workers compatible)
      // No custom password config needed - scrypt is the default
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },

    advanced: {
      cookiePrefix: 'webhook_auth',
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },

    // Account linking by email
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },

    // Database hooks to auto-create password credentials for OAuth users
    databaseHooks: {
      account: {
        create: {
          after: async (account, ctx) => {
            console.log('🔐 Account created:', {
              providerId: account.providerId,
              userId: account.userId,
              accountId: account.accountId
            })

            // Only process OAuth accounts (not email/password signups)
            if (account.providerId !== 'credential' && ctx) {
              console.log('🔑 OAuth account detected, creating random password credential...')

              try {
                // Import drizzle query functions
                const { eq } = await import('drizzle-orm')

                // Get user email from database using Drizzle
                const [user] = await db.select().from(schema.user).where(eq(schema.user.id, account.userId)).limit(1)

                if (!user) {
                  console.error('❌ User not found for account:', account.userId)
                  return
                }

                console.log('✅ Found user:', user.email)

                // Generate cryptographically secure random password (64 characters)
                const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(48)))
                  .map(byte => byte.toString(16).padStart(2, '0'))
                  .join('')
                  .substring(0, 64)

                console.log('✅ Generated random password (length: 64)')

                // Hash the password using Better Auth's password context
                const hashedPassword = await ctx.context.password.hash(randomPassword)
                console.log('✅ Password hashed successfully')

                // Insert credential account using Drizzle
                await db.insert(schema.account).values({
                  id: crypto.randomUUID(),
                  accountId: user.id,  // Use user ID, not email (matches Better Auth's credential account structure)
                  providerId: 'credential',
                  userId: user.id,
                  password: hashedPassword,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })

                console.log('✅ Credential account created for OAuth user:', user.email)
                console.log('ℹ️  User can now use "Forgot Password" to set their own password')
              } catch (error) {
                console.error('❌ Error creating credential account for OAuth user:', error)
                // Don't throw - OAuth signup should still succeed even if auto-password fails
              }
            }
          }
        }
      }
    },
  })

  return auth
}

export type Auth = ReturnType<typeof createAuth>
