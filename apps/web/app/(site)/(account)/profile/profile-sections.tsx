'use client'

import { routePublicProfile, SITE_URL } from '@repo/config'
import { Checkbox } from '@repo/design-system/ui/checkbox'
import { Input } from '@repo/design-system/ui/input'
import Link from 'next/link'

interface SocialLinksSectionProps {
  githubUrl: string
  xUrl: string
  linkedinUrl: string
  githubUsername?: string
  onGithubUrlChange: (value: string) => void
  onXUrlChange: (value: string) => void
  onLinkedinUrlChange: (value: string) => void
}

/** Render editable social-profile URL fields. */
export function SocialLinksSection({
  githubUrl,
  xUrl,
  linkedinUrl,
  githubUsername,
  onGithubUrlChange,
  onXUrlChange,
  onLinkedinUrlChange
}: SocialLinksSectionProps) {
  return (
    <section>
      <h2 className="mb-3 font-semibold text-foreground text-sm">Social links</h2>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-foreground-muted text-xs" htmlFor="profile-github">
            GitHub
          </label>
          <Input
            id="profile-github"
            value={githubUrl}
            onChange={e => onGithubUrlChange(e.target.value)}
            placeholder="https://github.com/username"
            type="url"
            readOnly={Boolean(githubUsername)}
            className={githubUsername ? 'cursor-default opacity-70' : ''}
          />
          {githubUsername && (
            <p className="mt-1 text-foreground-muted text-xs">From your GitHub sign-in</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-foreground-muted text-xs" htmlFor="profile-x">
            X
          </label>
          <Input
            id="profile-x"
            value={xUrl}
            onChange={e => onXUrlChange(e.target.value)}
            placeholder="https://x.com/username"
            type="url"
          />
        </div>
        <div>
          <label className="mb-1 block text-foreground-muted text-xs" htmlFor="profile-linkedin">
            LinkedIn
          </label>
          <Input
            id="profile-linkedin"
            value={linkedinUrl}
            onChange={e => onLinkedinUrlChange(e.target.value)}
            placeholder="https://linkedin.com/in/username"
            type="url"
          />
        </div>
      </div>
    </section>
  )
}

interface VisibilitySectionProps {
  showProgress: boolean
  showChecklists: boolean
  onShowProgressChange: (checked: boolean) => void
  onShowChecklistsChange: (checked: boolean) => void
}

/** Render profile visibility toggles for public sections. */
export function VisibilitySection({
  showProgress,
  showChecklists,
  onShowProgressChange,
  onShowChecklistsChange
}: VisibilitySectionProps) {
  return (
    <section>
      <h2 className="mb-3 font-semibold text-foreground text-sm">
        What to show on your public profile
      </h2>
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2" htmlFor="profile-show-progress">
          <Checkbox
            id="profile-show-progress"
            checked={showProgress}
            onCheckedChange={v => onShowProgressChange(v === true)}
          />
          <span className="text-foreground text-sm">Show completion progress</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2" htmlFor="profile-show-checklists">
          <Checkbox
            id="profile-show-checklists"
            checked={showChecklists}
            onCheckedChange={v => onShowChecklistsChange(v === true)}
          />
          <span className="text-foreground text-sm">Show shared checklists</span>
        </label>
      </div>
    </section>
  )
}

interface PublicProfileLinkSectionProps {
  resolvedUsername?: string
  isProfilePublic: boolean
}

/** Render the current public profile URL when the profile is public. */
export function PublicProfileLinkSection({
  resolvedUsername,
  isProfilePublic
}: PublicProfileLinkSectionProps) {
  if (!isProfilePublic || !resolvedUsername) {
    return null
  }

  const publicProfileUrl = `${SITE_URL}${routePublicProfile(resolvedUsername)}`

  return (
    <section className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <p className="font-medium text-foreground text-sm">Your public profile</p>
      <Link
        href={routePublicProfile(resolvedUsername)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block break-all text-accent text-sm underline hover:no-underline"
      >
        {publicProfileUrl}
      </Link>
    </section>
  )
}
