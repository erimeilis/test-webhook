/**
 * Client-side authentication handling
 * Handles form submissions and OAuth redirects
 */

console.log('🔐 Auth client loaded')

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth)
} else {
  initAuth()
}

function initAuth() {
  setupAuthForms()
  setupGoogleOAuth()
  setupResetPasswordForm()
  setupNavigationButtons()
}

// ========================================
// FORM HANDLING
// ========================================

function setupAuthForms() {
  // Handle login form
  const loginForm = document.querySelector('form[action*="sign-in/email"]')
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit)
  }

  // Handle signup form
  const signupForm = document.querySelector('form[action*="sign-up/email"]')
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignupSubmit)
  }
}

async function handleLoginSubmit(e: Event) {
  e.preventDefault()

  const form = e.target as HTMLFormElement
  const formData = new FormData(form)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (response.ok) {
      // Success - redirect to dashboard
      window.location.href = '/dashboard'
    } else {
      // Show error with improved messaging
      const data = await response.json().catch(() => ({ error: 'Login failed' })) as { error?: string; message?: string }
      const errorMessage = data.error || data.message || 'Invalid email or password'

      // Check for specific error types to provide better feedback
      if (errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('credentials') ||
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('failed')) {
        showErrorWithPasswordReset(form, email)
      } else if (errorMessage.toLowerCase().includes('verified') ||
                 errorMessage.toLowerCase().includes('verification')) {
        showError(form, 'Please verify your email address before logging in. Check your inbox for the verification link.')
      } else {
        showError(form, errorMessage)
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    showError(form, 'Network error. Please try again.')
  }
}

async function handleSignupSubmit(e: Event) {
  e.preventDefault()

  const form = e.target as HTMLFormElement
  const formData = new FormData(form)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name: email }),
    })

    if (response.ok) {
      // Success - show verification message instead of immediate login
      showSuccess(form, 'Account created! Please check your email to verify your account before logging in.')
      // Clear form
      form.reset()
    } else {
      // Show error with improved messaging
      const data = await response.json().catch(() => ({ error: 'Signup failed' })) as { error?: string; message?: string }
      const errorMessage = data.error || data.message || 'Signup failed'

      // Check for specific error types and provide human-readable messages
      if (errorMessage.toLowerCase().includes('exists') ||
          errorMessage.toLowerCase().includes('already') ||
          errorMessage.toLowerCase().includes('duplicate')) {
        showErrorWithResendVerification(form, email)
      } else if (errorMessage.toLowerCase().includes('not null') ||
                 errorMessage.toLowerCase().includes('constraint') ||
                 errorMessage.toLowerCase().includes('sqlite')) {
        // Database constraint errors - generic user-friendly message
        showError(form, 'Unable to create account. Please try again or contact support if the problem persists.')
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('timeout')) {
        showError(form, 'Network error. Please check your connection and try again.')
      } else if (errorMessage.toLowerCase().includes('email') &&
                 errorMessage.toLowerCase().includes('invalid')) {
        showError(form, 'Please enter a valid email address.')
      } else if (errorMessage.toLowerCase().includes('password')) {
        showError(form, 'Password must be at least 8 characters long.')
      } else {
        // Generic error with slightly better wording
        showError(form, 'Unable to create account. Please try again.')
      }
    }
  } catch (error) {
    console.error('Signup error:', error)
    showError(form, 'Network error. Please try again.')
  }
}

function showError(form: HTMLFormElement, message: string) {
  // Remove existing messages
  const existingError = form.querySelector('.auth-error, .auth-success')
  if (existingError) {
    existingError.remove()
  }

  // Create error element
  const errorDiv = document.createElement('div')
  errorDiv.className = 'auth-error mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm'
  errorDiv.textContent = message

  // Insert at top of form
  form.insertBefore(errorDiv, form.firstChild)
}

function showSuccess(form: HTMLFormElement, message: string) {
  // Remove existing messages
  const existingMessage = form.querySelector('.auth-error, .auth-success')
  if (existingMessage) {
    existingMessage.remove()
  }

  // Create success element
  const successDiv = document.createElement('div')
  successDiv.className = 'auth-success mb-4 p-3 bg-success/10 text-success rounded-lg text-sm'
  successDiv.textContent = message

  // Insert at top of form
  form.insertBefore(successDiv, form.firstChild)
}

function showErrorWithPasswordReset(form: HTMLFormElement, email: string) {
  // Remove existing messages
  const existingError = form.querySelector('.auth-error, .auth-success')
  if (existingError) {
    existingError.remove()
  }

  // Create error element with reset link
  const errorDiv = document.createElement('div')
  errorDiv.className = 'auth-error mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm text-center'

  const textNode = document.createTextNode('Invalid email or password. ')
  const resetLink = document.createElement('a')
  resetLink.href = '#'
  resetLink.className = 'text-primary hover:underline font-medium'
  resetLink.textContent = 'Forgot password? Reset'
  resetLink.addEventListener('click', async (e) => {
    e.preventDefault()
    await handlePasswordReset(email, errorDiv)
  })

  errorDiv.appendChild(textNode)
  errorDiv.appendChild(resetLink)

  // Insert at top of form
  form.insertBefore(errorDiv, form.firstChild)
}

function showErrorWithResendVerification(form: HTMLFormElement, email: string) {
  // Remove existing messages
  const existingError = form.querySelector('.auth-error, .auth-success')
  if (existingError) {
    existingError.remove()
  }

  // Create error element with resend link
  const errorDiv = document.createElement('div')
  errorDiv.className = 'auth-error mb-4 p-3 bg-warning/10 text-warning rounded-lg text-sm'

  const textNode = document.createTextNode('This email is already registered but not verified yet. ')
  const resendLink = document.createElement('a')
  resendLink.href = '#'
  resendLink.className = 'underline font-medium hover:opacity-80'
  resendLink.textContent = 'Resend verification email'
  resendLink.addEventListener('click', async (e) => {
    e.preventDefault()
    await handleResendVerification(email, errorDiv)
  })

  errorDiv.appendChild(textNode)
  errorDiv.appendChild(resendLink)
  errorDiv.appendChild(document.createTextNode('.'))

  // Insert at top of form
  form.insertBefore(errorDiv, form.firstChild)
}

async function handlePasswordReset(email: string, messageDiv: HTMLElement) {
  messageDiv.textContent = 'Sending password reset email...'
  messageDiv.className = 'auth-error mb-4 p-3 bg-info/10 text-info rounded-lg text-sm'

  try {
    const response = await fetch('/api/auth/forget-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (response.ok) {
      messageDiv.textContent = 'Password reset email sent! Please check your inbox'
      messageDiv.className = 'auth-success mb-4 p-3 bg-success/10 text-success rounded-lg text-sm text-center'
    } else {
      messageDiv.textContent = 'Failed to send reset email. Please try again.'
      messageDiv.className = 'auth-error mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm'
    }
  } catch (error) {
    console.error('Password reset error:', error)
    messageDiv.textContent = 'Network error. Please try again.'
    messageDiv.className = 'auth-error mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm'
  }
}

async function handleResendVerification(email: string, messageDiv: HTMLElement) {
  messageDiv.textContent = 'Sending verification email...'
  messageDiv.className = 'auth-error mb-4 p-3 bg-info/10 text-info rounded-lg text-sm'

  try {
    const response = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (response.ok) {
      messageDiv.textContent = 'Verification email sent! Please check your inbox.'
      messageDiv.className = 'auth-success mb-4 p-3 bg-success/10 text-success rounded-lg text-sm'
    } else {
      messageDiv.textContent = 'Failed to send verification email. Please try again.'
      messageDiv.className = 'auth-error mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm'
    }
  } catch (error) {
    console.error('Resend verification error:', error)
    messageDiv.textContent = 'Network error. Please try again.'
    messageDiv.className = 'auth-error mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm'
  }
}

// ========================================
// GOOGLE OAUTH
// ========================================

function setupGoogleOAuth() {
  const googleButtons = document.querySelectorAll('[data-auth-google]')

  googleButtons.forEach(button => {
    button.addEventListener('click', handleGoogleOAuth)
  })
}

async function handleGoogleOAuth(e: Event) {
  e.preventDefault()

  // Initiate OAuth flow with POST request
  try {
    const response = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: '/dashboard',
      }),
    })

    if (response.ok) {
      const data = await response.json() as { url?: string }
      // OAuth providers return a redirect URL
      if (data.url) {
        window.location.href = data.url
      }
    } else {
      console.error('OAuth initiation failed:', response.status)
      alert('Failed to start Google sign-in. Please try again.')
    }
  } catch (error) {
    console.error('OAuth error:', error)
    alert('Network error. Please try again.')
  }
}

// ========================================
// RESET PASSWORD
// ========================================

function setupResetPasswordForm() {
  const resetForm = document.getElementById('reset-password-form') as HTMLFormElement
  if (resetForm) {
    resetForm.addEventListener('submit', handleResetPasswordSubmit)
  }
}

async function handleResetPasswordSubmit(e: Event) {
  e.preventDefault()

  const form = e.target as HTMLFormElement
  const formData = new FormData(form)

  const token = formData.get('token') as string
  const newPassword = formData.get('newPassword') as string

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    })

    if (response.ok) {
      // Success - redirect to success page
      window.location.href = '/reset-password?success=true'
    } else {
      // Show error - redirect to form with error
      window.location.href = '/reset-password?token=' + token + '&error=failed'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    // Network error - redirect to form with error
    window.location.href = '/reset-password?token=' + token + '&error=failed'
  }
}

// ========================================
// NAVIGATION BUTTONS
// ========================================

function setupNavigationButtons() {
  const navButtons = document.querySelectorAll('[data-navigate]')

  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const url = target.getAttribute('data-navigate')
      if (url) {
        window.location.href = url
      }
    })
  })
}
