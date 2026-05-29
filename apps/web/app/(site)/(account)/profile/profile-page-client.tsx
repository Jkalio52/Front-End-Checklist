'use client'

import { authClient } from '@repo/auth/auth-client'
import { routePublicProfile, SITE_URL } from '@repo/config'
import { Input } from '@repo/design-system/ui/input'
import { cn } from '@repo/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useAction } from 'next-safe-action/hooks'
import { useCallback, useEffect, useState } from 'react'
import { updateProfileAction } from '@/actions/profile-actions'
import { getSafeActionErrorMessage } from '@/lib/safe-action-result'
import { PublicProfileLinkSection, SocialLinksSection, VisibilitySection } from './profile-sections'

interface ProfileData {
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

/**
 * Load the current signed-in user's editable profile record.
 *
 * @returns Profile data returned by the profile API.
 */
async function fetchProfile(): Promise<ProfileData> {
  const res = await fetch('/api/profile')
  if (!res.ok) throw new Error('Failed to load profile')
  const data = await res.json()
  return {
    username: data.username,
    githubUsername: data.githubUsername,
    headline: data.headline,
    bio: data.bio,
    githubUrl: data.githubUrl,
    xUrl: data.xUrl,
    linkedinUrl: data.linkedinUrl,
    isProfilePublic: data.isProfilePublic ?? true,
    showProgress: data.showProgress ?? true,
    showChecklists: data.showChecklists ?? true
  }
}

/**
 * Profile form with read-only GitHub username, editable headline, bio, social links, and visibility toggles.
 */
export function ProfilePageClient() {
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const isSignedIn = Boolean(session?.user?.id)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: isSignedIn
  })

  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [isProfilePublic, setIsProfilePublic] = useState(true)
  const [showProgress, setShowProgress] = useState(true)
  const [showChecklists, setShowChecklists] = useState(true)
  const [saveMessage, setSaveMessage] = useState<'saved' | 'error' | null>(null)

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? '')
      setBio(profile.bio ?? '')
      setGithubUrl(profile.githubUrl ?? '')
      setXUrl(profile.xUrl ?? '')
      setLinkedinUrl(profile.linkedinUrl ?? '')
      setIsProfilePublic(profile.isProfilePublic)
      setShowProgress(profile.showProgress)
      setShowChecklists(profile.showChecklists)
    }
  }, [profile])

  const { executeAsync: executeUpdateProfile, isPending: isSavingProfile } =
    useAction(updateProfileAction)

  const handleSave = useCallback(() => {
    void (async () => {
      setSaveMessage(null)

      const payload: Partial<ProfileData> = {
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        xUrl: xUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        isProfilePublic,
        showProgress,
        showChecklists
      }

      if (!profile?.githubUsername) {
        payload.githubUrl = githubUrl.trim() || undefined
      }

      const result = await executeUpdateProfile(payload)
      if (!result.data) {
        setSaveMessage('error')
        throw new Error(getSafeActionErrorMessage(result, 'Failed to save'))
      }

      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSaveMessage('saved')
      setTimeout(() => setSaveMessage(null), 3000)
    })().catch(() => {
      setSaveMessage('error')
    })
  }, [
    headline,
    bio,
    githubUrl,
    xUrl,
    linkedinUrl,
    isProfilePublic,
    showProgress,
    showChecklists,
    profile?.githubUsername,
    executeUpdateProfile,
    queryClient
  ])

  if (isSessionPending || (isSignedIn && profileLoading)) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-background-muted" />
        <div className="h-32 rounded-lg bg-background-muted" />
        <div className="h-32 rounded-lg bg-background-muted" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-12">
        <p className="text-foreground-muted text-lg">Sign in to edit your profile.</p>
      </div>
    )
  }

  const user = session!.user
  const resolvedUsername = profile?.username ?? profile?.githubUsername
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
              value={isProfilePublic ? 'public' : 'private'}
              onChange={e => setIsProfilePublic(e.target.value === 'public')}
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
        {/* Avatar + read-only name/email */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image src={user.image} alt="" width={64} height={64} className="rounded-full" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background-muted font-semibold text-foreground-muted text-xl">
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

        {/* Profile URL (read-only, derived from GitHub username) */}
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

        {/* Headline */}
        <section>
          <label
            className="mb-2 block font-medium text-foreground text-sm"
            htmlFor="profile-headline"
          >
            Headline
          </label>
          <Input
            id="profile-headline"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. Full Stack Developer"
            maxLength={100}
          />
        </section>

        {/* Bio */}
        <section>
          <label className="mb-2 block font-medium text-foreground text-sm" htmlFor="profile-bio">
            Bio
          </label>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
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
          <p className="mt-1 text-foreground-muted text-xs">{bio.length}/160</p>
        </section>

        <SocialLinksSection
          githubUrl={githubUrl}
          xUrl={xUrl}
          linkedinUrl={linkedinUrl}
          githubUsername={profile?.githubUsername}
          onGithubUrlChange={setGithubUrl}
          onXUrlChange={setXUrl}
          onLinkedinUrlChange={setLinkedinUrl}
        />

        <VisibilitySection
          showProgress={showProgress}
          showChecklists={showChecklists}
          onShowProgressChange={setShowProgress}
          onShowChecklistsChange={setShowChecklists}
        />

        <PublicProfileLinkSection
          resolvedUsername={resolvedUsername}
          isProfilePublic={isProfilePublic}
        />
      </div>
    </>
  )
}
