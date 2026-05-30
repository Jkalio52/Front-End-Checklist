import { routeRules } from '@repo/config'
import { ChevronRight, Layers } from '@repo/design-system/icons'
import { Button } from '@repo/design-system/ui/button'
import Link from 'next/link'
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/feedback/status/error-boundary'
import { BottomCTA } from '@/components/homepage/bottom-cta'
import { CategoryCard, type CategoryIconName } from '@/components/homepage/category-card'
import {
  type ChecklistPreviewData,
  ChecklistsPreview
} from '@/components/homepage/checklists-preview'
import { FAQSection } from '@/components/homepage/faq-section'
import { HeroSection } from '@/components/homepage/hero-section'
import { McpSection } from '@/components/homepage/mcp-section'
import { MentionsSection } from '@/components/homepage/mentions-section'
import { ProTeaser } from '@/components/homepage/pro-teaser'
import { ResumeBanner } from '@/components/homepage/resume-banner'
import { PUBLIC_RULE_COUNT_LABEL } from '@/components/homepage/rule-count-display'
import {
  SponsorsSectionAsync,
  SponsorsSectionFallback
} from '@/components/homepage/sponsors-section-async'

interface CategorySummary {
  slug: string
  title: string
  description: string
  ruleIds: string[]
  iconName: CategoryIconName
}

interface HomePageContentProps {
  categories: CategorySummary[]
  githubStars: number | null
  checklistsForPreview: ChecklistPreviewData[]
  mentions: Parameters<typeof MentionsSection>[0]['mentions']
}

/**
 * Render the homepage sections after the page resolves its datasets.
 *
 * @param props - Homepage datasets and localized values.
 */
export function HomePageContent({
  categories,
  githubStars,
  checklistsForPreview,
  mentions
}: HomePageContentProps) {
  return (
    <>
      <ErrorBoundary sectionName="Hero">
        <HeroSection ruleCountLabel={PUBLIC_RULE_COUNT_LABEL} githubStars={githubStars} />
      </ErrorBoundary>

      <ErrorBoundary sectionName="Categories">
        <section
          aria-labelledby="categories-heading"
          className="bg-linear-to-b from-background to-background-subtle/30 py-16 sm:py-20 lg:py-24"
        >
          <div className="container-content">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Layers className="size-5 text-accent" />
                  <span className="font-medium text-accent text-sm uppercase tracking-wider">
                    Categories
                  </span>
                </div>
                <h2
                  id="categories-heading"
                  className="font-heading font-semibold text-3xl text-foreground"
                >
                  Browse by Category
                </h2>
                <p className="mt-2 text-foreground-muted">
                  Use curated checklists when you want a guided path, or explore {categories.length}{' '}
                  categories with {PUBLIC_RULE_COUNT_LABEL} rules when you already know the area you
                  need
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="hidden gap-1.5 sm:flex">
                <Link href={routeRules()}>
                  View all rules
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(category => (
                <CategoryCard
                  key={category.slug}
                  slug={category.slug}
                  title={category.title}
                  description={category.description}
                  ruleIds={category.ruleIds}
                  iconName={category.iconName}
                />
              ))}
            </div>
          </div>
        </section>
      </ErrorBoundary>

      <ErrorBoundary sectionName="Checklists">
        <ChecklistsPreview checklists={checklistsForPreview} />
      </ErrorBoundary>

      <ErrorBoundary sectionName="MCP integration">
        <McpSection />
      </ErrorBoundary>

      <ErrorBoundary sectionName="Mentions">
        <MentionsSection mentions={mentions} />
      </ErrorBoundary>

      <ErrorBoundary sectionName="Pro teaser">
        <ProTeaser />
      </ErrorBoundary>

      <ErrorBoundary sectionName="FAQ">
        <FAQSection />
      </ErrorBoundary>

      <ErrorBoundary sectionName="Sponsors">
        <Suspense fallback={<SponsorsSectionFallback />}>
          <SponsorsSectionAsync />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary sectionName="Call to action">
        <BottomCTA />
      </ErrorBoundary>

      <ResumeBanner />
    </>
  )
}
