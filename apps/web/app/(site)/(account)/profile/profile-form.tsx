'use client'

import { routePublicProfile, SITE_URL } from '@repo/config'
import { Input } from '@repo/design-system/ui/input'
import { cn } from '@repo/utils'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useAction } from 'next-safe-action/hooks'
import { useReducer, useState } from 'react'
import { updateProfileAction } from '@/actions/profile-actions'
import { getSafeActionErrorMessage } from '@/lib/safe-action-result'
import { getSocialProfileInputValue } from '@/lib/social-links'
import { PublicProfileLinkSection, SocialLinksSection, VisibilitySection } from './profile-sections'

export interface ProfileData {
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

interface ProfileUser {
  email?: string | null
  image?: string | null
  name?: string | null
}

interface ProfileFormState {
  headline: string
  bio: string
  githubUrl: string
  xUrl: string
  linkedinUrl: string
  isProfilePublic: boolean
  showProgress: boolean
  showChecklists: boolean
}

type TextField = 'headline' | 'bio' | 'githubUrl' | 'xUrl' | 'linkedinUrl'
type BooleanField = 'isProfilePublic' | 'showProgress' | 'showChecklists'

type ProfileFormAction =
  | { type: 'replace'; state: ProfileFormState }
  | { type: 'setText'; field: TextField; value: string }
  | { type: 'setBoolean'; field: BooleanField; value: boolean }

interface ProfileFormProps {
  profile: ProfileData
  user: ProfileUser
}

/**
 * Convert a loaded profile into editable form state.
 *
 * @param profile - Profile record returned by the profile API or action.
 * @returns Editable profile form values.
 */
function createProfileFormState(profile: ProfileData): ProfileFormState {
  return {
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    githubUrl: getSocialProfileInputValue('github', profile.githubUrl),
    xUrl: getSocialProfileInputValue('x', profile.xUrl),
    linkedinUrl: getSocialProfileInputValue('linkedin', profile.linkedinUrl),
    isProfilePublic: profile.isProfilePublic,
    showProgress: profile.showProgress,
    showChecklists: profile.showChecklists
  }
}

/**
 * Apply a single edit action to profile form state.
 *
 * @param state - Current editable profile form values.
 * @param action - Form edit action to apply.
 * @returns Updated form state.
 */
function profileFormReducer(state: ProfileFormState, action: ProfileFormAction): ProfileFormState {
  if (action.type === 'replace') {
    return action.state
  }

  return { ...state, [action.field]: action.value }
}

/**
 * Render the editable profile form once profile data has loaded.
 */
export function ProfileForm({ profile, user }: ProfileFormProps) {
  const queryClient = useQueryClient()
  const [form, dispatch] = useReducer(profileFormReducer, profile, createProfileFormState)
  const [saveMessage, setSaveMessage] = useState<'saved' | 'error' | null>(null)
  const { executeAsync: executeUpdateProfile, isPending: isSavingProfile } =
    useAction(updateProfileAction)

  /**
   * Persist the current form values through the profile action.
   */
  const handleSave = () => {
    void (async () => {
      setSaveMessage(null)

      const payload: Partial<ProfileData> = {
        headline: form.headline.trim() || undefined,
        bio: form.bio.trim() || undefined,
        xUrl: form.xUrl.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        isProfilePublic: form.isProfilePublic,
        showProgress: form.showProgress,
        showChecklists: form.showChecklists
      }

      if (!profile.githubUsername) {
        payload.githubUrl = form.githubUrl.trim() || undefined
      }

      const result = await executeUpdateProfile(payload)
      if (!result.data) {
        setSaveMessage('error')
        throw new Error(getSafeActionErrorMessage(result, 'Failed to save'))
      }

      dispatch({ type: 'replace', state: createProfileFormState(result.data) })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSaveMessage('saved')
      setTimeout(() => setSaveMessage(null), 3000)
    })().catch(() => {
      setSaveMessage('error')
    })
  }

  const resolvedUsername = profile.username ?? profile.githubUsername

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-bold text-3xl text-foreground">Profile</h1>
        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-2 text-foreground-muted text-sm"
            htmlFor="profile-visibility"
          >
            <span>Visibility</span>
            <select
              id="profile-visibility"
              value={form.isProfilePublic ? 'public' : 'private'}
              onChange={event =>
                dispatch({
                  type: 'setBoolean',
                  field: 'isProfilePublic',
                  value: event.target.value === 'public'
                })
              }
              className={cn(
                'rounded-md border border-border bg-background px-3 py-1.5 text-foreground text-sm',
                'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
          {saveMessage === 'saved' && <span className="text-accent text-sm">Saved</span>}
          {saveMessage === 'error' && <span className="text-destructive text-sm">Save failed</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingProfile}
            className={cn(
              'rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground text-sm',
              'hover:bg-accent-hover disabled:opacity-50'
            )}
          >
            {isSavingProfile ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image src={user.image} alt="" width={64} height={64} className="rounded-full" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-background-muted font-semibold text-foreground-muted text-xl">
                {(user.name ?? user.email ?? '?')[0]?.toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-medium text-foreground">{user.name ?? 'Anonymous'}</p>
              <p className="text-foreground-muted text-sm">{user.email}</p>
              <p className="mt-1 text-foreground-muted text-xs">Managed via GitHub</p>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 font-medium text-foreground text-sm">Profile URL</p>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-foreground-muted text-sm">
              {SITE_URL.replace(/^https?:\/\//, '')}
              {routePublicProfile('')}
            </span>
            {resolvedUsername ? (
              <span className="font-medium text-foreground text-sm">{resolvedUsername}</span>
            ) : (
              <span className="text-foreground-muted text-sm italic">not set</span>
            )}
          </div>
          <p className="mt-1 text-foreground-muted text-xs">
            Your profile URL is set from your GitHub username.
          </p>
        </section>

        <section>
          <label
            className="mb-2 block font-medium text-foreground text-sm"
            htmlFor="profile-headline"
          >
            Headline
          </label>
          <Input
            id="profile-headline"
            value={form.headline}
            onChange={event =>
              dispatch({ type: 'setText', field: 'headline', value: event.target.value })
            }
            placeholder="e.g. Full Stack Developer"
            maxLength={100}
          />
        </section>

        <section>
          <label className="mb-2 block font-medium text-foreground text-sm" htmlFor="profile-bio">
            Bio
          </label>
          <textarea
            id="profile-bio"
            value={form.bio}
            onChange={event =>
              dispatch({ type: 'setText', field: 'bio', value: event.target.value })
            }
            placeholder="A short bio (optional)"
            maxLength={160}
            rows={3}
            className={cn(
              'flex w-full rounded-md border border-input-border bg-input px-3 py-2 text-foreground text-sm',
              'placeholder:text-foreground-subtle',
              'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          <p className="mt-1 text-foreground-muted text-xs">{form.bio.length}/160</p>
        </section>

        <SocialLinksSection
          githubUrl={form.githubUrl}
          xUrl={form.xUrl}
          linkedinUrl={form.linkedinUrl}
          githubUsername={profile.githubUsername}
          onGithubUrlChange={value => dispatch({ type: 'setText', field: 'githubUrl', value })}
          onXUrlChange={value => dispatch({ type: 'setText', field: 'xUrl', value })}
          onLinkedinUrlChange={value => dispatch({ type: 'setText', field: 'linkedinUrl', value })}
        />

        <VisibilitySection
          showProgress={form.showProgress}
          showChecklists={form.showChecklists}
          onShowProgressChange={value =>
            dispatch({ type: 'setBoolean', field: 'showProgress', value })
          }
          onShowChecklistsChange={value =>
            dispatch({ type: 'setBoolean', field: 'showChecklists', value })
          }
        />

        <PublicProfileLinkSection
          resolvedUsername={resolvedUsername}
          isProfilePublic={form.isProfilePublic}
        />
      </div>
    </>
  )
}
