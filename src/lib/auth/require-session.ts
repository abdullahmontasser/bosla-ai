import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { auth } from '@/auth'

/**
 * Page level guard. Server actions still check the session on their own, this
 * only makes sure a signed out visitor never sees a workspace shell with empty
 * data. The intended path travels through the login page so the user lands
 * where they meant to go.
 */
export async function requireSession(lang: string, returnTo: string) {
  await connection()
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=${encodeURIComponent(returnTo)}`)
  }
  return session
}
