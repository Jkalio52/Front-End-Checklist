'use client'

import { routePublicProfile, SITE_URL } from '@repo/config'

interface ProfileUrlSectionProps {
  resolvedUsername?: string
}

/** Render the generated public profile URL. */
export function ProfileUrlSection({ resolvedUsername }: ProfileUrlSectionProps) {
  return (
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
  )
}
