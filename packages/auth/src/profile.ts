const GITHUB_USERNAME_MAX = 39
const GITHUB_USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/

/**
 * Normalize a GitHub login into the public profile username format.
 *
 * @param value - Raw GitHub login value.
 * @returns Lowercase public username or undefined when the value is invalid.
 */
export function normalizeGithubUsername(value: string | null | undefined): string | undefined {
  const username = value?.trim().toLowerCase()
  if (!username || username.length > GITHUB_USERNAME_MAX) {
    return undefined
  }

  return GITHUB_USERNAME_REGEX.test(username) ? username : undefined
}

/**
 * Read a string property from an unknown object shape.
 *
 * @param source - Unknown provider or database-hook payload.
 * @param key - Property name to read.
 * @returns String value when present.
 */
export function getStringProperty(source: unknown, key: string): string | undefined {
  if (!source || typeof source !== 'object') {
    return undefined
  }

  const value = Object.getOwnPropertyDescriptor(source, key)?.value
  return typeof value === 'string' ? value : undefined
}

/**
 * Read the GitHub login field from an OAuth profile object.
 *
 * @param profile - Provider profile returned by Better Auth.
 * @returns GitHub login when present.
 */
export function getGithubLogin(profile: unknown): string | undefined {
  return getStringProperty(profile, 'login')
}
