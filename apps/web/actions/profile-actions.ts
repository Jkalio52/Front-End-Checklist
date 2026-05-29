'use server'

import { z } from 'zod'
import { authActionClient } from '@/lib/safe-action'
import { updateProfileForUser } from '@/lib/server/profile-service'
import { TELEMETRY_EVENTS } from '@/lib/telemetry-events'
import { trackServerEvent } from '@/lib/telemetry-server'

const updateProfileSchema = z.object({
  headline: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(500).optional(),
  githubUrl: z.string().trim().url().optional(),
  xUrl: z.string().trim().url().optional(),
  linkedinUrl: z.string().trim().url().optional(),
  isProfilePublic: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  showChecklists: z.boolean().optional()
})

/**
 * Update the current signed-in user's editable profile fields.
 */
export const updateProfileAction = authActionClient
  .metadata({ actionName: 'update-profile' })
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const profile = await updateProfileForUser(ctx.userId, {
      headline: parsedInput.headline?.trim() || null,
      bio: parsedInput.bio?.trim() || null,
      githubUrl: parsedInput.githubUrl?.trim() || null,
      xUrl: parsedInput.xUrl?.trim() || null,
      linkedinUrl: parsedInput.linkedinUrl?.trim() || null,
      isProfilePublic: parsedInput.isProfilePublic,
      showProgress: parsedInput.showProgress,
      showChecklists: parsedInput.showChecklists
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    trackServerEvent(TELEMETRY_EVENTS.profileUpdated, {
      updatedFields: Object.keys(parsedInput),
      userId: ctx.userId
    })

    return profile
  })
