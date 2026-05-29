import 'server-only'

import { prisma } from '@repo/auth/prisma'
import { normalizeGithubUsername } from '@repo/auth/profile'

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

  const updates: { username?: string; isProfilePublic?: true } = {}

  if (!user.username && user.githubUsername) {
    const candidate = normalizeGithubUsername(user.githubUsername)
    if (candidate) {
      const taken = await prisma.user.findUnique({
        where: { username: candidate },
        select: { id: true }
      })

      if (!taken) {
        updates.username = candidate
        if (!user.isProfilePublic) {
          updates.isProfilePublic = true
        }
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: updates
      })

      if (updates.username) {
        user.username = updates.username
      }
      if (updates.isProfilePublic) {
        user.isProfilePublic = true
      }
    } catch (error) {
      if (updates.username && isUniqueConstraintError(error)) {
        await prisma.user.update({
          where: { id: userId },
          data: { isProfilePublic: true }
        })
        user.isProfilePublic = true
      } else {
        throw error
      }
    }
  }

  return serializeProfile(user)
}

/**
 * Detect Prisma unique-constraint failures without importing generated error classes.
 *
 * @param error - Unknown database error.
 * @returns True for Prisma P2002 errors.
 */
function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
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
