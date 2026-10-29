'use server'

import { headers } from 'next/headers'
import { createEmailVerificationToken, verifyEmailToken } from '@/lib/auth/email-verification'

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

export async function resendVerificationAction(
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
  return createEmailVerificationToken(email, origin, lang)
}

export async function verifyEmailAction(
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  return verifyEmailToken(email, token)
}
