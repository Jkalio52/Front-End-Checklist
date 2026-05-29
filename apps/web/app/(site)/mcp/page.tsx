import { PageBreadcrumbs } from '@repo/design-system/custom/navigation/page-breadcrumbs'
import { pageMetadata } from '@/lib/seo'
import { getCursorInstallUrl, getVscodeInstallUrl } from './install-links'
import { McpPageContent } from './mcp-page-content'

export const metadata = pageMetadata.mcp

export default async function McpPage() {
  const cursorInstallUrl = getCursorInstallUrl()
  const vscodeInstallUrl = getVscodeInstallUrl()

  return (
    <div className="container-content py-12 sm:py-16 lg:pt-5 lg:pb-20">
      <PageBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'MCP Integration' }]} />

      <McpPageContent cursorInstallUrl={cursorInstallUrl} vscodeInstallUrl={vscodeInstallUrl} />
    </div>
  )
}
