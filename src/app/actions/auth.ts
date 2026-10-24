'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function signInCredentials(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const trimmedEmail = email?.trim()
  if (!trimmedEmail || !password) {
    return { success: false, error: 'Missing email or password' }
  }

  try {
    await signIn('credentials', {
      email: trimmedEmail,
      password,
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: 'Invalid email or password' }
    }
    // Re-throw if error is a redirect or unexpected internal error
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as Record<string, unknown>).digest === 'string' &&
      (error as Record<string, unknown>).digest?.toString().startsWith('NEXT_REDIRECT')
    ) {
      throw error
    }
    return { success: false, error: 'Authentication failed' }
  }
}
