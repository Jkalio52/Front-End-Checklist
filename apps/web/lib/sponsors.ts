import type { Sponsor, SponsorsData, SponsorTier } from '@repo/types'
// Optional static fallback when APIs return no sponsors (e.g. dev or API down)
import sponsorsFallbackData from '@/data/sponsors-fallback.json'
import { fetchGitHubSponsors, getGitHubSponsorsUrl } from './github-sponsors'
import { fetchOpenCollectiveSponsors, getOpenCollectiveUrl } from './open-collective'

export interface UnifiedSponsorsData extends SponsorsData {
  githubSponsorsUrl: string
  openCollectiveUrl: string
}

const DEFAULT_TIER: SponsorTier = {
  id: 'backer',
  name: 'Backer',
  level: 'backer',
  monthlyPriceInDollars: 10,
  description: 'Backer',
  benefits: []
}

/**
 * Returns static fallback sponsor list when live APIs return no data (e.g. dev or API down).
 * @returns {Sponsor[]} Normalized list of fallback sponsors
 */
function getFallbackSponsors(): Sponsor[] {
  const raw = sponsorsFallbackData as {
    sponsors?: Array<{
      login: string
      name?: string | null
      avatarUrl: string
      websiteUrl?: string
    }>
  }
  const list = raw?.sponsors ?? []
  return list
    .filter((s): s is typeof s & { login: string; avatarUrl: string } =>
      Boolean(s?.login && s?.avatarUrl)
    )
    .map(s => ({
      login: s.login,
      name: s.name ?? null,
      avatarUrl: s.avatarUrl,
      websiteUrl: s.websiteUrl,
      tier: DEFAULT_TIER,
      createdAt: new Date(0).toISOString(),
      totalDonations: 10
    }))
}

/**
 * Fetch and combine sponsors from both GitHub Sponsors and Open Collective
 * Deduplicates by login/slug and merges donation amounts.
 * Uses static fallback from data/sponsors-fallback.json when both APIs return empty.
 */
export async function fetchAllSponsors(): Promise<UnifiedSponsorsData> {
  // Fetch from both sources in parallel
  const [githubData, ocSponsors] = await Promise.all([
    fetchGitHubSponsors(),
    fetchOpenCollectiveSponsors()
  ])

  // Add source to GitHub sponsors
  const githubSponsors: Sponsor[] = githubData.sponsors.map(sponsor => ({
    ...sponsor,
    source: 'github' as const,
    totalDonations: sponsor.tier.monthlyPriceInDollars || 10 // Default to $10 if unknown
  }))

  // Combine and deduplicate sponsors
  // If same login exists in both, merge and sum donations
  const sponsorMap = new Map<string, Sponsor>()

  // Add GitHub sponsors first
  for (const sponsor of githubSponsors) {
    sponsorMap.set(sponsor.login.toLowerCase(), sponsor)
  }

  // Add Open Collective sponsors, merging if duplicate
  for (const sponsor of ocSponsors) {
    const key = sponsor.login.toLowerCase()
    const existing = sponsorMap.get(key)

    if (existing) {
      // Merge: sum donations, keep the better avatar/name
      sponsorMap.set(key, {
        ...existing,
        totalDonations: (existing.totalDonations || 0) + (sponsor.totalDonations || 0),
        // Keep the non-null name
        name: existing.name || sponsor.name,
        // Keep website if available
        websiteUrl: existing.websiteUrl || sponsor.websiteUrl
      })
    } else {
      sponsorMap.set(key, sponsor)
    }
  }

  // Convert to array and sort by total donations (highest first)
  let allSponsors = Array.from(sponsorMap.values()).sort(
    (a, b) => (b.totalDonations || 0) - (a.totalDonations || 0)
  )

  // When both APIs return empty, use static fallback so the section can still show sponsors
  if (allSponsors.length === 0) {
    allSponsors = getFallbackSponsors()
  }

  return {
    tiers: githubData.tiers,
    sponsors: allSponsors,
    totalCount: allSponsors.length,
    monthlyRevenue: allSponsors.reduce((sum, s) => sum + (s.totalDonations || 0), 0),
    githubSponsorsUrl: getGitHubSponsorsUrl(),
    openCollectiveUrl: getOpenCollectiveUrl()
  }
}

/**
 * Calculate the size of a sponsor bubble based on their donation amount
 * Returns a size in pixels for the avatar
 */
export function getSponsorBubbleSize(
  totalDonations: number,
  minSize: number = 40,
  maxSize: number = 120
): number {
  // Use logarithmic scale for more balanced sizing
  // $10 = minSize, $2000+ = maxSize
  if (totalDonations <= 0) return minSize

  const minDonation = 10
  const maxDonation = 2000

  // Clamp the donation amount
  const clampedDonation = Math.min(Math.max(totalDonations, minDonation), maxDonation)

  // Logarithmic interpolation for smoother scaling
  const logMin = Math.log(minDonation)
  const logMax = Math.log(maxDonation)
  const logValue = Math.log(clampedDonation)

  const ratio = (logValue - logMin) / (logMax - logMin)
  return Math.round(minSize + ratio * (maxSize - minSize))
}

/**
 * Get tier-based color for sponsor bubble border
 */
export function getSponsorTierColor(tier: Sponsor['tier']): string {
  switch (tier.level) {
    case 'diamond':
      return '#b9f2ff' // Light cyan/diamond
    case 'gold':
      return '#ffd700' // Gold
    case 'silver':
      return '#c0c0c0' // Silver
    case 'bronze':
      return '#cd7f32' // Bronze
    default:
      return 'transparent'
  }
}
