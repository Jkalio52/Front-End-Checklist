import { routeAbout, routeChecklists, routeHome, routeRules } from '@repo/config'
import { ArrowLeft, Check, Home } from '@repo/design-system/icons'
import { Button } from '@repo/design-system/ui/button'
import { cn } from '@repo/utils'
import Link from 'next/link'
import { Footer } from '@/components/navigation/footer'

/**
 * Sticky header with logo and nav links for error/not-found pages.
 */
function SimpleHeader() {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-[60px] w-full',
        'border-border border-b',
        'bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80'
      )}
    >
      <div className="container-wide flex h-full items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href={routeHome()}
            className="flex items-center gap-2 rounded-md text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-accent-foreground">
              <Check className="h-4 w-4" strokeWidth={3} />
            </div>
            <span className="hidden font-semibold text-lg sm:inline">Front-End Checklist</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <Link
              href={routeRules()}
              className={cn(
                'rounded-md px-3 py-2 font-medium text-sm',
                'text-foreground-muted',
                'hover:bg-background-subtle hover:text-foreground',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              Rules
            </Link>
            <Link
              href={routeChecklists()}
              className={cn(
                'rounded-md px-3 py-2 font-medium text-sm',
                'text-foreground-muted',
                'hover:bg-background-subtle hover:text-foreground',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              Checklists
            </Link>
            <Link
              href={routeAbout()}
              className={cn(
                'rounded-md px-3 py-2 font-medium text-sm',
                'text-foreground-muted',
                'hover:bg-background-subtle hover:text-foreground',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SimpleHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-md text-center">
          <p className="font-bold font-heading text-8xl text-accent">404</p>
          <h1 className="mt-4 font-heading font-semibold text-3xl text-foreground tracking-tight">
            Page not found
          </h1>
          <p className="mt-3 text-base text-foreground-muted">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={routeHome()}>
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={routeRules()}>
                <ArrowLeft className="h-4 w-4" />
                Browse rules
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
