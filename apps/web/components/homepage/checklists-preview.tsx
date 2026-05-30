'use client'

import { routeChecklist, routeChecklists } from '@repo/config'
import {
  Braces,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  Gauge,
  ListChecks,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Zap
} from '@repo/design-system/icons'
import { Button } from '@repo/design-system/ui/button'
import { cn } from '@repo/utils'
import { TrackedLink } from '@/components/analytics/tracked-link'
import {
  CHECKLIST_AUDIENCE_LABELS,
  getChecklistCuration
} from '@/components/checklists/checklist-curation'
import { ChecklistDifficultyBadge } from '@/components/checklists/checklist-difficulty-badge'
import { TELEMETRY_EVENTS } from '@/lib/telemetry-events'

// Map icon names from MDX to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  search: Search,
  zap: Zap,
  braces: Braces,
  eye: Eye,
  gauge: Gauge,
  shield: Shield,
  'file-check': FileCheck,
  'list-checks': ListChecks
}

export interface ChecklistPreviewData {
  slug: string
  title: string
  description: string
  icon: string
  rules: string[]
  estimatedTime?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface ChecklistsPreviewProps {
  checklists: ChecklistPreviewData[]
}

interface ChecklistCardProps {
  slug: string
  title: string
  description: string
  icon: string
  ruleCount: number
  estimatedTime?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * ChecklistCard function.
 */
function ChecklistCard({
  slug,
  title,
  description,
  icon,
  ruleCount,
  estimatedTime,
  difficulty
}: ChecklistCardProps) {
  const Icon = iconMap[icon] || FileCheck
  const curation = getChecklistCuration(slug)

  return (
    <div
      className={cn(
        'group relative rounded-xl p-6',
        'border border-border bg-card',
        'hover:border-border-focus hover:shadow-md',
        'transition-all duration-200'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'shrink-0 rounded-xl p-3',
            'bg-accent/10',
            'text-accent',
            'transition-colors duration-200'
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h3
              className={cn(
                'font-medium text-base text-foreground',
                'transition-colors duration-200 group-hover:text-accent'
              )}
            >
              <TrackedLink
                href={routeChecklist(slug)}
                telemetryEvent={TELEMETRY_EVENTS.ctaClicked}
                telemetryProperties={{
                  label: 'featured_checklist_card',
                  location: 'homepage_checklists_preview',
                  target: routeChecklist(slug),
                  checklistId: slug
                }}
                className={cn(
                  'after:absolute after:inset-0 after:content-[""]',
                  'focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring'
                )}
              >
                {title}
              </TrackedLink>
            </h3>
            <div className="shrink-0">
              <span className="inline-flex items-center justify-center rounded-full bg-accent/10 px-3 py-1 font-medium text-accent text-xs ring-1 ring-accent/20 ring-inset transition-all duration-200 group-hover:bg-accent group-hover:text-primary-foreground">
                Start
                <ChevronRight className="-mr-1 ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-foreground-muted text-sm">{description}</p>

          {curation ? (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-background-subtle px-2.5 py-1 text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
                  {curation.label}
                </span>
                {curation.audience.slice(0, 2).map(audience => (
                  <span
                    key={audience}
                    className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] text-accent"
                  >
                    {CHECKLIST_AUDIENCE_LABELS[audience]}
                  </span>
                ))}
              </div>

              <p className="mb-4 line-clamp-2 text-foreground-subtle text-xs leading-relaxed">
                {curation.whenToUse}
              </p>
            </>
          ) : null}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-foreground-muted text-xs">
            <span className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-accent/70" aria-hidden="true" />
              {ruleCount} rules
            </span>
            {estimatedTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent/70" aria-hidden="true" />
                {estimatedTime}
              </span>
            )}
            <ChecklistDifficultyBadge difficulty={difficulty} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ChecklistsPreview function.
 * @param { lang - { lang.
 * @param checklists } - checklists }.
 */
export function ChecklistsPreview({ checklists }: ChecklistsPreviewProps) {
  // Show only featured checklists (up to 4)
  const featuredChecklists = checklists.slice(0, 4)

  return (
    <section aria-labelledby="checklists-heading" className="relative py-16 sm:py-20 lg:py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-accent/2 to-transparent" />

      <div className="container-content relative">
        {/* Section Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="font-medium text-accent text-sm uppercase tracking-wider">
                Curated
              </span>
            </div>
            <h2
              id="checklists-heading"
              className="font-heading font-semibold text-3xl text-foreground"
            >
              Ready-Made Checklists
            </h2>
            <p className="mt-2 text-foreground-muted">
              Start with guided workflows that help juniors, senior reviewers, launch teams, and
              AI-assisted audits begin in the right place
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden gap-1.5 sm:flex">
            <TrackedLink
              href={routeChecklists()}
              telemetryEvent={TELEMETRY_EVENTS.ctaClicked}
              telemetryProperties={{
                label: 'view_all_checklists',
                location: 'homepage_checklists_preview'
              }}
            >
              View all checklists
              <ChevronRight className="h-4 w-4" />
            </TrackedLink>
          </Button>
        </div>

        {/* Checklists Grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {featuredChecklists.map(checklist => (
            <ChecklistCard
              key={checklist.slug}
              slug={checklist.slug}
              title={checklist.title}
              description={checklist.description}
              icon={checklist.icon}
              ruleCount={checklist.rules.length}
              estimatedTime={checklist.estimatedTime}
              difficulty={checklist.difficulty}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild className="gap-1.5">
            <TrackedLink
              href={routeChecklists()}
              telemetryEvent={TELEMETRY_EVENTS.ctaClicked}
              telemetryProperties={{
                label: 'view_all_checklists_mobile',
                location: 'homepage_checklists_preview'
              }}
            >
              View all checklists
              <ChevronRight className="h-4 w-4" />
            </TrackedLink>
          </Button>
        </div>
      </div>
    </section>
  )
}
