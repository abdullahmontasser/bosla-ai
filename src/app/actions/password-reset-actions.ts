'use server'

import { headers } from 'next/headers'
import {
  requestPasswordReset,
  resetPasswordWithToken,
  verifyPasswordResetToken,
} from '@/lib/auth/password-reset'

async function resolveOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    const proto = h.get('x-forwarded-proto') || 'http'
    if (host) return `${proto}://${host}`
  } catch {
    // Outside request context
  }
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export async function requestPasswordResetAction(
  emailOrFormData: string | FormData,
  lang = 'en',
): Promise<{ success: boolean; error?: string; previewUrl?: string }> {
  let email = ''
  if (typeof emailOrFormData === 'object' && emailOrFormData !== null && 'get' in emailOrFormData) {
    email = String(emailOrFormData.get('email') || '')
  } else {
    email = String(emailOrFormData || '')
  }

  const origin = await resolveOrigin()
  return requestPasswordReset(email, origin, lang)
}

export async function verifyResetTokenAction(rawToken: string) {
  return verifyPasswordResetToken(rawToken)
}

export async function resetPasswordAction(
  payloadOrFormData: { token: string; password: string } | FormData,
): Promise<{ success: boolean; error?: string }> {
  let token = ''
  let password = ''

  if (
    typeof payloadOrFormData === 'object' &&
    payloadOrFormData !== null &&
    'get' in payloadOrFormData
  ) {
    token = String(payloadOrFormData.get('token') || '')
    password = String(payloadOrFormData.get('password') || '')
  } else {
    token = payloadOrFormData.token
    password = payloadOrFormData.password
  }

  return resetPasswordWithToken(token, password)
}
