'use server'

import { auth } from '@/auth'
import { getUserLinkedAccounts, unlinkAccount } from '@/lib/auth/account-linking'
import type { OAuthProviderId } from '@/auth'

export async function getLinkedAccountsAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { hasPassword: false, linkedProviders: [] }
  }
  return getUserLinkedAccounts(session.user.id)
}

export async function unlinkAccountAction(provider: OAuthProviderId) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }
  return unlinkAccount(session.user.id, provider)
}
