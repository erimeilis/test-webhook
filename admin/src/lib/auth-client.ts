/**
 * Better Auth Client Configuration
 * For client-side authentication
 */

import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5173',
})
