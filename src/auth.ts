import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import LinkedIn from 'next-auth/providers/linkedin'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export type OAuthProviderId = 'github' | 'google' | 'linkedin'

const OAUTH_ENV_KEYS: Record<OAuthProviderId, [string, string]> = {
  github: ['AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET'],
  google: ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'],
  linkedin: ['AUTH_LINKEDIN_ID', 'AUTH_LINKEDIN_SECRET'],
}

/**
 * Only offer a provider when its credentials exist. A missing pair would
 * otherwise render a button that always fails with a configuration error.
 */
export function getEnabledOAuthProviders(
  env: Record<string, string | undefined> = process.env,
): OAuthProviderId[] {
  return (Object.keys(OAUTH_ENV_KEYS) as OAuthProviderId[]).filter((provider) => {
    const [idKey, secretKey] = OAUTH_ENV_KEYS[provider]
    return Boolean(env[idKey] && env[secretKey])
  })
}

function oauthProviders(env: Record<string, string | undefined>): NextAuthConfig['providers'] {
  const enabled = getEnabledOAuthProviders(env)
  const providers: NextAuthConfig['providers'] = []

  if (enabled.includes('github'))
    providers.push(GitHub({ allowDangerousEmailAccountLinking: true }))
  if (enabled.includes('google'))
    providers.push(Google({ allowDangerousEmailAccountLinking: true }))
  if (enabled.includes('linkedin'))
    providers.push(LinkedIn({ allowDangerousEmailAccountLinking: true }))

  return providers
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/en/login',
    error: '/en/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
          return null
        }

        const safeImage =
          user.image && (user.image.startsWith('data:') || user.image.length > 512)
            ? `/api/profile/avatar?u=${user.id}`
            : user.image

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: safeImage,
        }
      },
    }),
    ...oauthProviders(process.env),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }
      if (
        typeof token.picture === 'string' &&
        (token.picture.startsWith('data:') || token.picture.length > 512)
      ) {
        token.picture = `/api/profile/avatar?u=${token.sub}`
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      if (
        session.user &&
        (session.user.image?.startsWith('data:') ||
          (session.user.image && session.user.image.length > 512))
      ) {
        session.user.image = `/api/profile/avatar?u=${session.user.id}`
      }
      return session
    },
    redirect({ url, baseUrl }) {
      // Relative destinations stay on this host. Absolute ones must match it.
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch {
        // Fall through to the safe destination.
      }
      return baseUrl
    },
  },
})
