import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Category, CuratedChecklist, Rule } from '@repo/types'
import { getToolDefinitions } from '../../src/server-tools'
import { executeReviewCode, executeSearchRules, type ReviewCodeInput } from '../../src/tools'

type RulePriority = Rule['priority']

interface RetrievalCase {
  query: string
  expectedSlugs: string[]
}

interface ReviewEvalCase {
  name: string
  input: ReviewCodeInput
  expectPresent?: string[]
  expectAbsent?: string[]
}

interface QualityReport {
  retrieval: {
    cases: number
    recallAtFive: number
    meanReciprocalRank: number
  }
  reviewCode: {
    truePositives: number
    falseNegatives: number
    falsePositives: number
    trueNegatives: number
    precision: number
    recall: number
    falsePositiveRate: number
  }
  toolContracts: {
    toolsChecked: number
  }
}

const ACCESSIBILITY: Category[] = ['accessibility']
const IMAGES: Category[] = ['images']
const JAVASCRIPT: Category[] = ['javascript']
const SECURITY: Category[] = ['security']
const HTML: Category[] = ['html']

const CATEGORY_VALUES = [
  'html',
  'css',
  'javascript',
  'performance',
  'accessibility',
  'seo',
  'security',
  'images',
  'testing',
  'privacy',
  'pwa',
  'i18n'
]

const PRIORITY_VALUES = ['critical', 'high', 'medium', 'low']

function isCategory(value: string): value is Category {
  return CATEGORY_VALUES.includes(value)
}

function isPriority(value: string): value is RulePriority {
  return PRIORITY_VALUES.includes(value)
}

function readFrontmatterValue(frontmatter: string, key: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '')
}

function parseCategoryList(rawValue: string): Category[] {
  return rawValue
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map(value => value.trim().replace(/^['"]|['"]$/g, ''))
    .filter(isCategory)
}

function readFrontmatterCategories(frontmatter: string, fallbackCategory: string): Category[] {
  const rawValue = readFrontmatterValue(frontmatter, 'categories') ?? ''
  const inlineValues = parseCategoryList(rawValue)

  if (inlineValues.length > 0) {
    return inlineValues
  }

  const blockMatch = frontmatter.match(/^categories:\s*\n((?:\s+- .+\n?)+)/m)
  const blockValues =
    blockMatch?.[1]
      ?.split('\n')
      .map(line => line.replace(/^\s+-\s*/, '').trim())
      .filter(Boolean)
      .filter(isCategory) ?? []

  if (blockValues.length > 0) {
    return blockValues
  }

  return isCategory(fallbackCategory) ? [fallbackCategory] : ['general']
}

function loadRulesFromMdx(): Rule[] {
  const rulesDir = path.resolve(__dirname, '..', '..', '..', 'content', 'rules', 'en')
  const rules: Rule[] = []

  for (const category of fs.readdirSync(rulesDir).sort()) {
    const categoryDir = path.join(rulesDir, category)
    if (!fs.statSync(categoryDir).isDirectory()) {
      continue
    }

    for (const filename of fs.readdirSync(categoryDir).sort()) {
      if (!filename.endsWith('.mdx')) {
        continue
      }

      const slug = filename.replace(/\.mdx$/, '')
      const filePath = path.join(categoryDir, filename)
      const source = fs.readFileSync(filePath, 'utf8')
      const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
      const frontmatter = frontmatterMatch?.[1] ?? ''
      const content = frontmatterMatch?.[2] ?? source
      const categories = readFrontmatterCategories(frontmatter, category)
      const primaryCategory = categories[0]
      const rawPriority = readFrontmatterValue(frontmatter, 'priority') ?? 'medium'
      const priority = isPriority(rawPriority) ? rawPriority : 'medium'

      rules.push({
        title: readFrontmatterValue(frontmatter, 'title') ?? slug,
        slug,
        categories,
        priority,
        primaryCategory,
        content,
        url: `/rules/${primaryCategory}/${slug}`,
        prompts: {
          check: readFrontmatterValue(frontmatter, 'check') ?? `Check ${slug}.`,
          fix: readFrontmatterValue(frontmatter, 'fix') ?? `Fix ${slug}.`,
          explain: readFrontmatterValue(frontmatter, 'explain') ?? `Explain ${slug}.`
        }
      })
    }
  }

  return rules
}

const CHECKLIST: CuratedChecklist = {
  id: 'mcp-quality-eval',
  slug: 'mcp-quality-eval',
  title: 'MCP Quality Eval',
  description: 'Small checklist fixture used to expose checklist-backed tools.',
  icon: 'check',
  rules: ['html/doctype', 'accessibility/alt-text', 'seo/canonical-url'],
  language: 'en',
  url: '/checklists/mcp-quality-eval'
}

const RETRIEVAL_CASES: RetrievalCase[] = [
  {
    query: 'image alt text accessibility',
    expectedSlugs: ['alt-text', 'decorative-elements']
  },
  {
    query: 'canonical duplicate url seo',
    expectedSlugs: ['canonical-url', 'canonical-chain', 'canonical-header']
  },
  {
    query: 'dangerous eval javascript security',
    expectedSlugs: ['avoid-eval']
  },
  {
    query: 'reduced motion animation accessibility',
    expectedSlugs: ['reduced-motion', 'animated-content']
  },
  {
    query: 'content security policy header',
    expectedSlugs: ['content-security-policy']
  },
  {
    query: 'lazy loading images performance',
    expectedSlugs: ['lazy-loading']
  },
  {
    query: 'button accessible name',
    expectedSlugs: ['button-name']
  },
  {
    query: 'hreflang localized pages seo',
    expectedSlugs: ['hreflang']
  }
]

const REVIEW_EVAL_CASES: ReviewEvalCase[] = [
  {
    name: 'document missing doctype',
    input: {
      code: '<html lang="en"><head><title>Example</title></head><body></body></html>',
      focus: HTML,
      minPriority: 'low'
    },
    expectPresent: ['doctype']
  },
  {
    name: 'missing image alt text',
    input: {
      code: '<main><img src="/hero.jpg"></main>',
      focus: IMAGES,
      minPriority: 'low'
    },
    expectPresent: ['alt-text']
  },
  {
    name: 'decorative image with empty alt text',
    input: {
      code: '<main><img src="/divider.svg" alt=""></main>',
      focus: IMAGES,
      minPriority: 'low'
    },
    expectAbsent: ['alt-text']
  },
  {
    name: 'image without intrinsic dimensions',
    input: {
      code: '<img src="/gallery.jpg" alt="Gallery preview">',
      focus: IMAGES,
      minPriority: 'low'
    },
    expectPresent: ['dimensions']
  },
  {
    name: 'image with intrinsic dimensions',
    input: {
      code: '<img src="/gallery.jpg" alt="Gallery preview" width="640" height="360">',
      focus: IMAGES,
      minPriority: 'low'
    },
    expectAbsent: ['dimensions']
  },
  {
    name: 'empty button accessible name',
    input: {
      code: '<button type="button"></button>',
      focus: ACCESSIBILITY,
      minPriority: 'low'
    },
    expectPresent: ['button-name']
  },
  {
    name: 'button with aria-label accessible name',
    input: {
      code: '<button type="button" aria-label="Close"><svg aria-hidden="true"></svg></button>',
      focus: ACCESSIBILITY,
      minPriority: 'low'
    },
    expectAbsent: ['button-name']
  },
  {
    name: 'eval usage in JavaScript',
    input: {
      code: 'const result = eval(userInput)',
      focus: JAVASCRIPT,
      minPriority: 'low'
    },
    expectPresent: ['avoid-eval']
  },
  {
    name: 'safe string containing eval characters',
    input: {
      code: 'const label = "evaluation score"',
      focus: JAVASCRIPT,
      minPriority: 'low'
    },
    expectAbsent: ['avoid-eval']
  },
  {
    name: 'mixed content asset',
    input: {
      code: '<main data-origin="https://example.com"><img src="http://cdn.example.com/photo.jpg" alt="Photo"></main>',
      focus: SECURITY,
      minPriority: 'low'
    },
    expectPresent: ['mixed-content']
  },
  {
    name: 'secure asset URL',
    input: {
      code: '<img src="https://cdn.example.com/photo.jpg" alt="Photo">',
      focus: SECURITY,
      minPriority: 'low'
    },
    expectAbsent: ['mixed-content']
  },
  {
    name: 'viewport disables zoom',
    input: {
      code: '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">',
      focus: ACCESSIBILITY,
      minPriority: 'low'
    },
    expectPresent: ['viewport-zoom']
  },
  {
    name: 'viewport allows zoom',
    input: {
      code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      focus: ACCESSIBILITY,
      minPriority: 'low'
    },
    expectAbsent: ['viewport-zoom']
  }
]

function reciprocalRank(results: string[], expectedSlugs: string[]): number {
  const rank = results.findIndex(slug => expectedSlugs.includes(slug))
  return rank === -1 ? 0 : 1 / (rank + 1)
}

function calculateRetrievalMetrics(rules: Rule[]): QualityReport['retrieval'] {
  let hitsAtFive = 0
  let reciprocalRankTotal = 0

  for (const evalCase of RETRIEVAL_CASES) {
    const result = executeSearchRules({ query: evalCase.query, limit: 10 }, rules)
    const slugs = result.rules.map(rule => rule.slug)
    const topFive = slugs.slice(0, 5)

    if (topFive.some(slug => evalCase.expectedSlugs.includes(slug))) {
      hitsAtFive += 1
    }

    reciprocalRankTotal += reciprocalRank(slugs, evalCase.expectedSlugs)
  }

  return {
    cases: RETRIEVAL_CASES.length,
    recallAtFive: hitsAtFive / RETRIEVAL_CASES.length,
    meanReciprocalRank: reciprocalRankTotal / RETRIEVAL_CASES.length
  }
}

function calculateReviewMetrics(rules: Rule[]): QualityReport['reviewCode'] {
  let truePositives = 0
  let falseNegatives = 0
  let falsePositives = 0
  let trueNegatives = 0

  for (const evalCase of REVIEW_EVAL_CASES) {
    const result = executeReviewCode(evalCase.input, rules)
    const detectedSlugs = new Set(result.issues.map(issue => issue.rule))

    for (const expectedSlug of evalCase.expectPresent ?? []) {
      if (detectedSlugs.has(expectedSlug)) {
        truePositives += 1
      } else {
        falseNegatives += 1
      }
    }

    for (const forbiddenSlug of evalCase.expectAbsent ?? []) {
      if (detectedSlugs.has(forbiddenSlug)) {
        falsePositives += 1
      } else {
        trueNegatives += 1
      }
    }
  }

  return {
    truePositives,
    falseNegatives,
    falsePositives,
    trueNegatives,
    precision: truePositives / Math.max(truePositives + falsePositives, 1),
    recall: truePositives / Math.max(truePositives + falseNegatives, 1),
    falsePositiveRate: falsePositives / Math.max(falsePositives + trueNegatives, 1)
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function buildQualityReport(rules: Rule[]): QualityReport {
  return {
    retrieval: calculateRetrievalMetrics(rules),
    reviewCode: calculateReviewMetrics(rules),
    toolContracts: {
      toolsChecked: getToolDefinitions([CHECKLIST]).length
    }
  }
}

describe('MCP quality evaluation', () => {
  const rules = loadRulesFromMdx()

  it('meets retrieval quality thresholds for golden discovery queries', () => {
    const metrics = calculateRetrievalMetrics(rules)

    expect(metrics.recallAtFive).toBeGreaterThanOrEqual(0.8)
    expect(metrics.meanReciprocalRank).toBeGreaterThanOrEqual(0.5)
  })

  it('meets review_code precision and recall thresholds on labeled fixtures', () => {
    const metrics = calculateReviewMetrics(rules)

    expect(metrics.precision).toBeGreaterThanOrEqual(0.9)
    expect(metrics.recall).toBeGreaterThanOrEqual(0.85)
    expect(metrics.falsePositiveRate).toBeLessThanOrEqual(0.1)
  })

  it('keeps exposed tool contracts agent-friendly', () => {
    const definitions = getToolDefinitions([CHECKLIST])
    const names = definitions.map(definition => definition.name)

    expect(new Set(names).size).toBe(definitions.length)
    expect(names).toEqual(
      expect.arrayContaining([
        'review_code',
        'audit_url',
        'get_workflow',
        'get_checklist_rules',
        'get_quick_reference',
        'get_rule',
        'search_rules',
        'check_rule',
        'fix_rule',
        'explain_rule',
        'list_categories'
      ])
    )

    for (const definition of definitions) {
      expect(definition.name).toMatch(/^[a-z]+(?:_[a-z]+)*$/)
      expect(definition.description.length).toBeGreaterThanOrEqual(80)
      expect(definition.inputSchema.type).toBe('object')
      expect(definition.outputSchema.type).toBe('object')
      expect(definition.annotations?.readOnlyHint).toBe(true)
      expect(definition.annotations?.destructiveHint).toBe(false)
      expect(definition.annotations?.idempotentHint).toBe(true)
    }
  })

  it('prints a compact report for pnpm mcp:evaluate', () => {
    const report = buildQualityReport(rules)

    console.log('\nMCP Quality Report')
    console.log(`  Tools checked: ${report.toolContracts.toolsChecked}`)
    console.log(
      `  Retrieval: Recall@5 ${formatPercent(report.retrieval.recallAtFive)}, MRR ${report.retrieval.meanReciprocalRank.toFixed(2)} across ${report.retrieval.cases} cases`
    )
    console.log(
      `  review_code: precision ${formatPercent(report.reviewCode.precision)}, recall ${formatPercent(report.reviewCode.recall)}, false-positive rate ${formatPercent(report.reviewCode.falsePositiveRate)}`
    )

    expect(report.toolContracts.toolsChecked).toBe(11)
  })
})
