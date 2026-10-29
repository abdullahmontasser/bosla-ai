import { prisma } from '@/lib/prisma'
import type { OAuthProviderId } from '@/auth'

export interface LinkedAccountsStatus {
  hasPassword: boolean
  linkedProviders: OAuthProviderId[]
}

/**
 * Returns the linked authentication methods for a given user ID.
 */
export async function getUserLinkedAccounts(userId: string): Promise<LinkedAccountsStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  })

  if (!user) {
    return {
      hasPassword: false,
      linkedProviders: [],
    }
  }

  const linkedProviders = user.accounts
    .map((a) => a.provider as OAuthProviderId)
    .filter((p): p is OAuthProviderId => ['github', 'google', 'linkedin'].includes(p))

  return {
    hasPassword: Boolean(user.passwordHash),
    linkedProviders,
  }
}

/**
 * Unlinks an OAuth provider from a user account safely.
 * Prevents account lockout if this is the only sign-in method and no password exists.
 */
export async function unlinkAccount(
  userId: string,
  provider: OAuthProviderId,
): Promise<{ success: boolean; error?: string }> {
  const status = await getUserLinkedAccounts(userId)

  // Disallow unlinking if no password exists and only 1 OAuth provider is connected
  if (!status.hasPassword && status.linkedProviders.length <= 1) {
    return {
      success: false,
      error: 'Cannot disconnect your only sign in method. Please set a password first.',
    }
  }

  await prisma.account.deleteMany({
    where: {
      userId,
      provider,
    },
  })

  return { success: true }
}
