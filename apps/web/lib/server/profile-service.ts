import 'server-only'

import { prisma } from '@repo/auth/prisma'
import {
  buildGithubProfileImport,
  type GithubProfileImport,
  normalizeGithubUsername
} from '@repo/auth/profile'

export interface ProfileRecord {
  username?: string
  githubUsername?: string
  headline?: string
  bio?: string
  githubUrl?: string
  xUrl?: string
  linkedinUrl?: string
  githubProfileImportedAt?: string
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

interface ProfileUserRow {
  username: string | null
  githubUsername: string | null
  headline: string | null
  bio: string | null
  githubUrl: string | null
  xUrl: string | null
  linkedinUrl: string | null
  githubProfileImportedAt: Date | null
  isProfilePublic: boolean
  showProgress: boolean
  showChecklists: boolean
}

/**
 * Normalize a raw Prisma user record into the client-facing profile shape.
 *
 * @param user - User row selected from Prisma.
 * @returns Serialized profile record.
 */
function serializeProfile(user: ProfileUserRow): ProfileRecord {
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
    githubProfileImportedAt: user.githubProfileImportedAt?.toISOString(),
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
      githubProfileImportedAt: true,
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

  await importGithubProfileOnce(userId, user)

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
 * Backfill public GitHub metadata once for existing GitHub-connected users.
 *
 * @param userId - Signed-in user identifier.
 * @param user - Mutable profile user row loaded from Prisma.
 */
async function importGithubProfileOnce(userId: string, user: ProfileUserRow): Promise<void> {
  if (!user.githubUsername || user.githubProfileImportedAt) {
    return
  }

  try {
    const imported = await fetchPublicGithubProfileImport(user.githubUsername)
    if (!imported.githubProfileImportedAt) {
      return
    }

    const data = buildGithubImportUpdate(user, imported)
    await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true }
    })

    applyGithubImportToUser(user, data)
  } catch {
    // Import is opportunistic; profile loading must not fail when GitHub is unavailable.
  }
}

/**
 * Fetch public GitHub profile data for a username and normalize it for storage.
 *
 * @param githubUsername - GitHub username associated with the user.
 * @returns Normalized GitHub profile fields, or an empty object on failure.
 */
async function fetchPublicGithubProfileImport(
  githubUsername: string
): Promise<GithubProfileImport> {
  const username = normalizeGithubUsername(githubUsername)
  if (!username || typeof fetch !== 'function') {
    return {}
  }

  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Front-End-Checklist',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  if (!response.ok) {
    return {}
  }

  return buildGithubProfileImport(await response.json())
}

/**
 * Build a Prisma update that fills editable fields only when they are empty.
 *
 * @param user - Existing user row.
 * @param imported - Normalized public GitHub profile fields.
 * @returns Database update for the one-time import.
 */
function buildGithubImportUpdate(
  user: ProfileUserRow,
  imported: GithubProfileImport
): GithubProfileImport {
  const data: GithubProfileImport = {}

  if (imported.githubUsername) data.githubUsername = imported.githubUsername
  if (imported.githubProfileImportedAt) {
    data.githubProfileImportedAt = imported.githubProfileImportedAt
  }

  if (!user.bio && imported.bio) data.bio = imported.bio
  if (!user.githubUrl && imported.githubUrl) data.githubUrl = imported.githubUrl
  if (!user.xUrl && imported.xUrl) data.xUrl = imported.xUrl

  if (imported.githubCompany) data.githubCompany = imported.githubCompany
  if (imported.githubBlog) data.githubBlog = imported.githubBlog
  if (imported.githubLocation) data.githubLocation = imported.githubLocation
  if (typeof imported.githubPublicRepos === 'number') {
    data.githubPublicRepos = imported.githubPublicRepos
  }
  if (typeof imported.githubPublicGists === 'number') {
    data.githubPublicGists = imported.githubPublicGists
  }
  if (typeof imported.githubFollowers === 'number') data.githubFollowers = imported.githubFollowers
  if (typeof imported.githubFollowing === 'number') data.githubFollowing = imported.githubFollowing
  if (imported.githubCreatedAt) data.githubCreatedAt = imported.githubCreatedAt
  if (imported.githubUpdatedAt) data.githubUpdatedAt = imported.githubUpdatedAt

  return data
}

/**
 * Reflect imported editable fields in the in-memory row before serialization.
 *
 * @param user - Mutable profile user row.
 * @param data - GitHub import update applied to the database.
 */
function applyGithubImportToUser(user: ProfileUserRow, data: GithubProfileImport): void {
  if (data.githubUsername) user.githubUsername = data.githubUsername
  if (data.bio) user.bio = data.bio
  if (data.githubUrl) user.githubUrl = data.githubUrl
  if (data.xUrl) user.xUrl = data.xUrl
  if (data.githubProfileImportedAt) user.githubProfileImportedAt = data.githubProfileImportedAt
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
      githubProfileImportedAt: true,
      isProfilePublic: true,
      showProgress: true,
      showChecklists: true
    }
  })

  return serializeProfile(user)
}
