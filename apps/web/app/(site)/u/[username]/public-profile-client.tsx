'use client'

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  isValidCategory,
  routeSharedChecklist
} from '@repo/config'
import { Progress } from '@repo/design-system/ui/progress'
import Image from 'next/image'
import Link from 'next/link'

interface PublicProfileClientProps {
  user: {
    name: string
    image?: string
    headline?: string
    bio?: string
    githubUrl?: string
    xUrl?: string
    linkedinUrl?: string
  }
  showProgress: boolean
  showChecklists: boolean
  overallStats: { total: number; completed: number; percentage: number }
  categoryStats: { category: string; total: number; completed: number; percentage: number }[]
  sharedChecklists: {
    id: string
    name: string
    description?: string
    publicId: string
    ruleCount: number
  }[]
  homeHref: string
}

/**
 * Read-only public profile view: avatar, name, headline, bio, social links, progress, shared checklists.
 */
export function PublicProfileClient({
  user,
  showProgress,
  showChecklists,
  overallStats,
  categoryStats,
  sharedChecklists,
  homeHref
}: PublicProfileClientProps) {
  return (
    <>
      <nav className="mb-8" aria-label="Breadcrumb">
        <Link
          href={homeHref}
          className="text-foreground-muted text-sm transition-colors hover:text-foreground"
        >
          Home
        </Link>
        <span className="mx-2 text-foreground-muted">/</span>
        <span className="text-foreground text-sm">{user.name}</span>
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {user.image ? (
          <Image src={user.image} alt="" width={80} height={80} className="rounded-full" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-background-muted font-semibold text-2xl text-foreground-muted">
            {user.name[0]?.toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="font-bold text-2xl text-foreground">{user.name}</h1>
          {user.headline && (
            <p className="mt-1 font-medium text-foreground-muted text-lg">{user.headline}</p>
          )}
          {user.bio && <p className="mt-2 max-w-xl text-foreground-muted text-sm">{user.bio}</p>}
          {(user.githubUrl || user.xUrl || user.linkedinUrl) && (
            <div className="mt-3 flex flex-wrap gap-4">
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-sm underline hover:no-underline"
                >
                  GitHub
                </a>
              )}
              {user.xUrl && (
                <a
                  href={user.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-sm underline hover:no-underline"
                >
                  X
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-sm underline hover:no-underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {showProgress && (
        <>
          <section className="mt-10">
            <h2 className="mb-4 font-semibold text-foreground text-lg">Completion progress</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-medium text-foreground">
                  {overallStats.completed} of {overallStats.total} rules completed
                </span>
                <span className="font-semibold text-accent text-sm">
                  {overallStats.percentage}%
                </span>
              </div>
              <Progress value={overallStats.percentage} className="h-3" />
            </div>
          </section>

          {categoryStats.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 font-semibold text-foreground text-lg">By category</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryStats.map(stat => {
                  const label = isValidCategory(stat.category)
                    ? CATEGORY_LABELS[stat.category]
                    : stat.category
                  const color = isValidCategory(stat.category)
                    ? CATEGORY_COLORS[stat.category]
                    : '#888'
                  return (
                    <div
                      key={stat.category}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-foreground text-sm">{label}</span>
                      <span className="font-medium text-foreground-muted text-xs">
                        {stat.completed}/{stat.total}
                      </span>
                      <div className="w-16">
                        <Progress value={stat.percentage} className="h-1.5" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {showChecklists && sharedChecklists.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-semibold text-foreground text-lg">Shared checklists</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sharedChecklists.map(c => (
              <Link
                key={c.id}
                href={routeSharedChecklist(c.publicId)}
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent"
              >
                <p className="font-medium text-foreground group-hover:text-accent">{c.name}</p>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-foreground-muted text-sm">{c.description}</p>
                )}
                <p className="mt-2 text-foreground-muted text-xs">
                  {c.ruleCount} rule{c.ruleCount !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-foreground-muted text-sm">frontendchecklist.io</p>
    </>
  )
}
