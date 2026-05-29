/**
 * @jest-environment node
 */

const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()

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
    isProfilePublic: false,
    showProgress: true,
    showChecklists: true,
    ...overrides
  }
}

describe('getProfileForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})
