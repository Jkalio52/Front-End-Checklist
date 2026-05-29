/**
 * @jest-environment node
 */

const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()
const mockFetch = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@repo/auth/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate
    }
  }
}))

const { getProfileForUser } = require('../profile-service')

function createUser(overrides = {}) {
  return {
    username: null,
    githubUsername: 'TheDavidDias',
    headline: null,
    bio: null,
    githubUrl: null,
    xUrl: null,
    linkedinUrl: null,
    githubProfileImportedAt: new Date('2026-05-29T19:00:00.000Z'),
    isProfilePublic: false,
    showProgress: true,
    showChecklists: true,
    ...overrides
  }
}

describe('getProfileForUser', () => {
  const originalFetch = global.fetch

  beforeAll(() => {
    global.fetch = mockFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockRejectedValue(new Error('Unexpected GitHub fetch'))
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('backfills username from GitHub and makes the profile public', async () => {
    const user = createUser()
    mockFindUnique.mockImplementation(({ where }) => (where.id ? user : null))
    mockUpdate.mockResolvedValue({})

    const profile = await getProfileForUser('user-1')

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { username: 'thedaviddias', isProfilePublic: true }
    })
    expect(profile).toMatchObject({
      username: 'thedaviddias',
      githubUsername: 'TheDavidDias',
      githubUrl: 'https://github.com/TheDavidDias',
      isProfilePublic: true
    })
  })

  it('does not overwrite an existing username', async () => {
    const user = createUser({ username: 'custom-name', isProfilePublic: true })
    mockFindUnique.mockResolvedValue(user)

    const profile = await getProfileForUser('user-1')

    expect(mockFindUnique).toHaveBeenCalledTimes(1)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(profile).toMatchObject({
      username: 'custom-name',
      isProfilePublic: true
    })
  })

  it('preserves private visibility when no username backfill is needed', async () => {
    const user = createUser({ username: 'custom-name', isProfilePublic: false })
    mockFindUnique.mockResolvedValue(user)

    const profile = await getProfileForUser('user-1')

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(profile).toMatchObject({
      username: 'custom-name',
      isProfilePublic: false
    })
  })

  it('handles a taken GitHub-derived username without throwing', async () => {
    const user = createUser()
    mockFindUnique.mockImplementation(({ where }) => (where.id ? user : { id: 'other-user' }))

    const profile = await getProfileForUser('user-1')

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(profile).toMatchObject({
      username: undefined,
      isProfilePublic: false
    })
  })

  it('keeps the profile public when a username backfill races a unique constraint', async () => {
    const user = createUser()
    mockFindUnique.mockImplementation(({ where }) => (where.id ? user : null))
    mockUpdate.mockRejectedValueOnce({ code: 'P2002' }).mockResolvedValueOnce({})

    const profile = await getProfileForUser('user-1')

    expect(mockUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      data: { username: 'thedaviddias', isProfilePublic: true }
    })
    expect(mockUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
      data: { isProfilePublic: true }
    })
    expect(profile).toMatchObject({
      username: undefined,
      isProfilePublic: true
    })
  })

  it('backfills empty editable fields from GitHub public profile data once', async () => {
    const importedAt = '2026-05-28T10:30:00Z'
    const user = createUser({
      username: 'thedaviddias',
      githubProfileImportedAt: null,
      isProfilePublic: true
    })
    mockFindUnique.mockResolvedValue(user)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        login: 'TheDavidDias',
        bio: 'Frontend engineer',
        twitter_username: 'thedaviddias',
        company: 'Frontend Checklist',
        blog: 'https://frontendchecklist.io',
        location: 'Montreal',
        public_repos: 42,
        public_gists: 7,
        followers: 1000,
        following: 125,
        created_at: '2012-04-18T12:00:00Z',
        updated_at: importedAt
      })
    })
    mockUpdate.mockResolvedValue({})

    const profile = await getProfileForUser('user-1')

    expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/users/thedaviddias', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Front-End-Checklist',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        githubUsername: 'TheDavidDias',
        githubUrl: 'https://github.com/TheDavidDias',
        bio: 'Frontend engineer',
        xUrl: 'https://x.com/thedaviddias',
        githubCompany: 'Frontend Checklist',
        githubPublicRepos: 42,
        githubPublicGists: 7,
        githubFollowers: 1000,
        githubFollowing: 125,
        githubCreatedAt: new Date('2012-04-18T12:00:00Z'),
        githubUpdatedAt: new Date(importedAt)
      }),
      select: { id: true }
    })
    expect(profile).toMatchObject({
      bio: 'Frontend engineer',
      githubUrl: 'https://github.com/TheDavidDias',
      xUrl: 'https://x.com/thedaviddias'
    })
    expect(profile.githubProfileImportedAt).toEqual(expect.any(String))
  })

  it('preserves user-edited profile fields during GitHub import', async () => {
    const user = createUser({
      username: 'thedaviddias',
      bio: 'Local bio',
      githubUrl: 'https://github.com/local',
      xUrl: 'https://x.com/local',
      githubProfileImportedAt: null,
      isProfilePublic: true
    })
    mockFindUnique.mockResolvedValue(user)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        login: 'TheDavidDias',
        bio: 'GitHub bio',
        twitter_username: 'github',
        company: 'Frontend Checklist'
      })
    })
    mockUpdate.mockResolvedValue({})

    const profile = await getProfileForUser('user-1')

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.not.objectContaining({
        bio: 'GitHub bio',
        githubUrl: 'https://github.com/TheDavidDias',
        xUrl: 'https://x.com/github'
      }),
      select: { id: true }
    })
    expect(profile).toMatchObject({
      bio: 'Local bio',
      githubUrl: 'https://github.com/local',
      xUrl: 'https://x.com/local'
    })
  })

  it('does not block profile loading when the GitHub import fails', async () => {
    const user = createUser({
      username: 'thedaviddias',
      githubProfileImportedAt: null,
      isProfilePublic: true
    })
    mockFindUnique.mockResolvedValue(user)
    mockFetch.mockRejectedValue(new Error('GitHub unavailable'))

    const profile = await getProfileForUser('user-1')

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(profile).toMatchObject({
      username: 'thedaviddias',
      githubProfileImportedAt: undefined
    })
  })
})
