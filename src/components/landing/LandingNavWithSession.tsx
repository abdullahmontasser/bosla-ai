import { auth } from '@/auth'
import { connection } from 'next/server'
import { LandingNav } from './LandingNav'
import type { LandingCopy } from './content'

interface LandingNavWithSessionProps {
  lang: string
  copy: LandingCopy
}

/**
 * Reads the session behind its own Suspense boundary so the landing shell can
 * still prerender while the header resolves who is signed in.
 */
export async function LandingNavWithSession({ lang, copy }: LandingNavWithSessionProps) {
  await connection()
  const session = await auth()
  return <LandingNav lang={lang} copy={copy} signedIn={Boolean(session?.user)} />
}
