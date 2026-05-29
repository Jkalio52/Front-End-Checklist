describe('@repo/emails/server', () => {
  const originalApiKey = process.env.RESEND_API_KEY
  const originalTopicId = process.env.RESEND_TOPIC_ID

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY
    } else {
      process.env.RESEND_API_KEY = originalApiKey
    }
    if (originalTopicId === undefined) {
      delete process.env.RESEND_TOPIC_ID
    } else {
      process.env.RESEND_TOPIC_ID = originalTopicId
    }
    jest.resetModules()
  })

  it('returns null when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY
    const { getResendClient, isResendConfigured } = await import('../server')

    expect(getResendClient()).toBeNull()
    expect(isResendConfigured()).toBe(false)
  })

  it('returns a client when RESEND_API_KEY is present', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    const { getResendClient, isResendConfigured } = await import('../server')

    const client = getResendClient()

    expect(client).not.toBeNull()
    expect(client?.constructor.name).toBe('Resend')
    expect(isResendConfigured()).toBe(true)
  })

  it('resolves the shared Resend topic id', async () => {
    delete process.env.RESEND_TOPIC_ID
    const { getResendTopicId } = await import('../server')

    expect(getResendTopicId()).toBe('cdb0d440-4825-412a-8152-29681e8155b7')

    process.env.RESEND_TOPIC_ID = ' topic_override '
    expect(getResendTopicId()).toBe('topic_override')
  })

  it('builds subscriber contact payloads with topic opt-in and properties', async () => {
    const { createResendContactPayload } = await import('../server')

    expect(createResendContactPayload('test@example.com', 'subscriber')).toEqual({
      email: 'test@example.com',
      properties: {
        product: 'newsletter',
        user_type: 'subscriber',
        language: 'en',
        source_domain: 'frontendchecklist.io',
        brand: 'frontendchecklist'
      },
      topics: [{ id: 'cdb0d440-4825-412a-8152-29681e8155b7', subscription: 'opt_in' }]
    })
  })

  it('builds waitlist contact payloads with distinct properties', async () => {
    const { createResendContactPayload } = await import('../server')

    expect(createResendContactPayload('test@example.com', 'waitlist', ' seg_waitlist ')).toEqual({
      email: 'test@example.com',
      properties: {
        product: 'waitlist',
        user_type: 'waitlist',
        language: 'en',
        source_domain: 'frontendchecklist.io',
        brand: 'frontendchecklist'
      },
      segments: [{ id: 'seg_waitlist' }],
      topics: [{ id: 'cdb0d440-4825-412a-8152-29681e8155b7', subscription: 'opt_in' }]
    })
  })
})
