import 'server-only'

import { prisma } from '@repo/auth/prisma'

const USERNAME_MIN = 3
const USERNAME_MAX = 30
const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/

export interface ProfileRecord {
  username?: string
  githubUsername?: string
  headline?: string
  bio?: string
  githubUrl?: string
  xUrl?: string
  linkedinUrl?: string
  isProfilePublic: boolean
  showProgress: boolean
  showChecklists: boolean
}

export interface ProfileUpdateInput {
  headline?: string | null
  bio?: string | null
  githubUrl?: string | null
  xUrl?: string | null
  linkedinUrl?: string | null
  isProfilePublic?: boolean
  showProgress?: boolean
  showChecklists?: boolean
}

/**
 * Validate the public username format accepted by profile features.
 *
 * @param value - Username candidate.
 * @returns True when the username matches project rules.
 */
function isValidUsername(value: string): boolean {
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return false
  }

  return USERNAME_REGEX.test(value)
}

/**
 * Normalize a raw Prisma user record into the client-facing profile shape.
 *
 * @param user - User row selected from Prisma.
 * @returns Serialized profile record.
 */
function serializeProfile(user: {
  username: string | null
  githubUsername: string | null
  headline: string | null
  bio: string | null
  githubUrl: string | null
  xUrl: string | null
  linkedinUrl: string | null
  isProfilePublic: boolean
  showProgress: boolean
  showChecklists: boolean
}): ProfileRecord {
  const resolvedGithubUrl =
    user.githubUrl ??
    (user.githubUsername ? `https://github.com/${user.githubUsername}` : undefined)

  return {
    username: user.username ?? undefined,
    githubUsername: user.githubUsername ?? undefined,
    headline: user.headline ?? undefined,
    bio: user.bio ?? undefined,
    githubUrl: resolvedGithubUrl,
    xUrl: user.xUrl ?? undefined,
    linkedinUrl: user.linkedinUrl ?? undefined,
    isProfilePublic: user.isProfilePublic,
    showProgress: user.showProgress,
    showChecklists: user.showChecklists
  }
}

/**
 * Load the editable profile record for a user, backfilling the public username once when possible.
 *
 * @param userId - Signed-in user identifier.
 * @returns Profile record or null when no user row exists.
 */
export async function getProfileForUser(userId: string): Promise<ProfileRecord | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      githubUsername: true,
      headline: true,
      bio: true,
      githubUrl: true,
      xUrl: true,
      linkedinUrl: true,
      isProfilePublic: true,
      showProgress: true,
      showChecklists: true
    }
  })

  if (!user) {
    return null
  }

  if (!user.username && user.githubUsername) {
    const candidate = user.githubUsername.toLowerCase()
    if (isValidUsername(candidate)) {
      const taken = await prisma.user.findUnique({
        where: { username: candidate },
        select: { id: true }
      })

      if (!taken) {
        await prisma.user.update({
          where: { id: userId },
          data: { username: candidate }
        })

        user.username = candidate
      }
    }
  }

  return serializeProfile(user)
}

/**
 * Update the editable profile fields for a user.
 *
 * @param userId - Signed-in user identifier.
 * @param updates - Normalized fields to update.
 * @returns Updated profile record or null when no user row exists.
 */
export async function updateProfileForUser(
  userId: string,
  updates: ProfileUpdateInput
): Promise<ProfileRecord | null> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: {
      username: true,
      githubUsername: true,
      headline: true,
      bio: true,
      githubUrl: true,
      xUrl: true,
      linkedinUrl: true,
      isProfilePublic: true,
      showProgress: true,
      showChecklists: true
    }
  })

  return serializeProfile(user)
}
