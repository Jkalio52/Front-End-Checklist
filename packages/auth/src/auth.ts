import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from './prisma'

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const baseUrl = process.env.BETTER_AUTH_URL ?? publicSiteUrl ?? 'http://localhost:3000'
const subscribeSecret = process.env.SUBSCRIBE_SECRET

const allowedHosts = Array.from(
  new Set(
    [
      'frontendchecklist.io',
      'localhost:3000',
      'next.localhost:1355',
      process.env.VERCEL_URL
    ].filter((host): host is string => Boolean(host))
  )
)

const crossSubdomainCookieDomain =
  process.env.NODE_ENV === 'production' ? 'frontendchecklist.io' : undefined

export const auth = betterAuth({
  baseURL: {
    allowedHosts,
    fallback: baseUrl,
    protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https'
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  databaseHooks: {
    user: {
      create: {
        after: async user => {
          if (!subscribeSecret || !user.email) return
          const url = `${baseUrl}/api/subscribe`
          try {
            await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-subscribe-secret': subscribeSecret
              },
              body: JSON.stringify({ email: user.email })
            })
          } catch {
            // Fire-and-forget: do not block sign-up if mailing list add fails
          }
        }
      }
    }
  },
  user: {
    additionalFields: {
      githubUsername: {
        type: 'string',
        required: false,
        input: false
      }
    }
  },
  advanced: {
    ...(crossSubdomainCookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: crossSubdomainCookieDomain
          }
        }
      : {
          crossSubDomainCookies: {
            enabled: true
          }
        })
  },
  plugins: [nextCookies()],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      mapProfileToUser: profile => ({
        githubUsername: (profile as { login?: string }).login ?? undefined
      })
    }
  },
  trustedOrigins: Array.from(
    new Set(
      [baseUrl, publicSiteUrl, 'http://localhost:3000', 'http://next.localhost:1355']
        .filter(Boolean)
        .map(value => value!)
    )
  )
})
