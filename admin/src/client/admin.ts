/**
 * Admin Client-side Functions
 * Handles impersonation and admin-specific actions
 */

import { showConfirmModal, showErrorModal } from './modal'

console.log('🚀 Admin client-side script loaded!')

// Handle impersonation button clicks
document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement
  const button = target.closest('[data-action="impersonate-user"]') as HTMLButtonElement

  if (!button) return

  console.log('🔐 Impersonate button clicked!')

  const userId = button.dataset.userId
  const userEmail = button.dataset.userEmail

  console.log('🔐 User ID:', userId, 'Email:', userEmail)

  if (!userId || !userEmail) {
    console.error('❌ Missing user ID or email for impersonation')
    return
  }

  const confirmed = await showConfirmModal(`Impersonate user: ${userEmail}?\n\nYou will be able to view their webhooks and data.`)
  if (!confirmed) {
    console.log('❌ User cancelled impersonation')
    return
  }

  console.log('✅ User confirmed impersonation, starting request...')

  try {
    button.disabled = true
    button.textContent = 'Impersonating...'

    console.log('📡 Calling impersonate endpoint...')

    // Call Better Auth admin impersonation endpoint
    const response = await fetch('/api/auth/admin/impersonate-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response content-type:', response.headers.get('content-type'))

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to impersonate user'
      try {
        const text = await response.text()
        console.error('❌ Response text:', text)

        // Try to parse as JSON
        try {
          const error = JSON.parse(text) as { message?: string }
          errorMessage = error.message || errorMessage
        } catch {
          // Not JSON, use text as-is if it's short enough
          if (text.length < 200) {
            errorMessage = text || errorMessage
          }
        }
      } catch (e) {
        console.error('❌ Could not read response:', e)
      }

      throw new Error(errorMessage)
    }

    console.log('✅ Impersonation successful! Redirecting...')

    // Reload the page to apply the impersonated session
    window.location.href = '/dashboard'
  } catch (err) {
    console.error('Impersonation error:', err)
    const error = err as Error
    showErrorModal(`Failed to impersonate user: ${error.message || 'Unknown error'}`)
    button.disabled = false
    button.textContent = 'Impersonate'
  }
})

// Handle stop impersonation button (if needed in the future)
document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement
  const button = target.closest('[data-action="stop-impersonation"]') as HTMLButtonElement

  if (!button) return

  const confirmed = await showConfirmModal('Stop impersonation and return to your admin account?')
  if (!confirmed) {
    return
  }

  try {
    button.disabled = true
    button.textContent = 'Stopping...'

    // Call Better Auth admin stop impersonation endpoint
    const response = await fetch('/api/auth/admin/stop-impersonating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error('Failed to stop impersonation')
    }

    // Reload the page to apply the admin session
    window.location.href = '/dashboard'
  } catch (err) {
    console.error('Stop impersonation error:', err)
    const error = err as Error
    showErrorModal(`Failed to stop impersonation: ${error.message || 'Unknown error'}`)

    button.disabled = false
    button.textContent = 'Return to Admin'
  }
})
