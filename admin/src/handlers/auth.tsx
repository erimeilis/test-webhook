/**
 * Authentication Handlers
 * Login, Signup, OAuth callbacks
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

// Login page
export async function handleLoginPage(c: AppContext) {
  const error = c.req.query('error')

  return c.render(
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Login</h1>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error === 'unauthorized' && 'Please login to continue'}
            {error === 'invalid' && 'Invalid email or password'}
          </div>
        )}

        <form method="POST" action="/api/auth/sign-in/email" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              required
            />
          </div>

          <Button type="submit" color="primary" modifier="wide" size="lg">
            Login
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            color="secondary"
            modifier="wide"
            size="lg"
            style="soft"
            prefixIcon={GoogleIcon}
            data-auth-google
            className="mt-4"
          >
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/signup" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

// Signup page
export async function handleSignupPage(c: AppContext) {
  const error = c.req.query('error')

  return c.render(
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Sign Up</h1>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error === 'exists' && 'Email already exists'}
            {error === 'invalid' && 'Invalid email or password'}
          </div>
        )}

        <form method="POST" action="/api/auth/sign-up/email" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <Button type="submit" color="primary" modifier="wide" size="lg">
            Create Account
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            color="secondary"
            modifier="wide"
            size="lg"
            style="soft"
            prefixIcon={GoogleIcon}
            data-auth-google
            className="mt-4"
          >
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}

// Email verification success page
export async function handleVerifyEmailPage(c: AppContext) {
  const success = c.req.query('success')
  const error = c.req.query('error')

  return c.render(
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconCheck className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
            <p className="text-muted-foreground mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <Button color="primary" size="lg" onClick={() => { window.location.href = '/login' }}>
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconAlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">
              {error === 'expired' && 'This verification link has expired. Please request a new verification email.'}
              {error === 'invalid' && 'This verification link is invalid. Please check your email for the correct link.'}
              {!error && 'There was a problem verifying your email. Please try again or contact support.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button color="secondary" size="lg" onClick={() => { window.location.href = '/login' }}>
                Back to Login
              </Button>
              <Button color="primary" size="lg" onClick={() => { window.location.href = '/signup' }}>
                Sign Up Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Test email page
export async function handleTestEmailPage(c: AppContext) {
  return c.render(
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Test Email</h1>

        <form id="test-email-form" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              required
            />
          </div>

          <Button type="submit" color="primary" modifier="wide" size="lg">
            Send Test Email
          </Button>
        </form>

        <div id="result" className="mt-4"></div>
      </div>
    </div>
  )
}

// Password reset form page
// Note: OAuth users can use this same flow since auto-generation hook creates credential accounts
export async function handleResetPasswordPage(c: AppContext) {
  const token = c.req.query('token')
  const error = c.req.query('error')
  const success = c.req.query('success')

  // Show success page
  if (success) {
    return c.render(
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconCheck className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Password Reset Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Button color="primary" size="lg" data-navigate="/login">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (!token) {
    return c.render(
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconAlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <Button color="primary" size="lg" data-navigate="/login">
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return c.render(
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Reset Password</h1>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error === 'expired' && 'This reset link has expired. Please request a new one.'}
            {error === 'invalid' && 'This reset link is invalid. Please request a new one.'}
            {error === 'failed' && 'Failed to reset password. Please try again.'}
          </div>
        )}

        <form
          id="reset-password-form"
          className="space-y-4"
        >
          <input type="hidden" name="token" value={token} />

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <Input
              type="password"
              id="newPassword"
              name="newPassword"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <Button type="submit" color="primary" modifier="wide" size="lg">
            Reset Password
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <a href="/login" className="text-primary hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}
