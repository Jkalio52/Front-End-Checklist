import { createResendContactPayload, getResendClient } from '@repo/emails/server'
import { NextResponse } from 'next/server'
import { captureServerException } from '@/lib/telemetry-server'

const SUBSCRIBE_SECRET = process.env.SUBSCRIBE_SECRET

/**
 * Internal API: add an email to the mailing list audience.
 * Called from auth databaseHooks.user.create.after with x-subscribe-secret.
 * Do not expose this as a public endpoint without rate limiting and validation.
 */
export async function POST(request: Request) {
  try {
    if (!SUBSCRIBE_SECRET) {
      return NextResponse.json({ error: 'Subscribe not configured' }, { status: 503 })
    }

    const secret = request.headers.get('x-subscribe-secret')
    if (secret !== SUBSCRIBE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { email?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
    }

    const { error } = await resend.contacts.create(
      createResendContactPayload(email, 'subscriber', process.env.RESEND_AUDIENCE_ID)
    )

    if (error) {
      const message = error.message ?? 'Failed to add contact'
      const statusCode =
        error.name === 'validation_error' || message.toLowerCase().includes('already') ? 400 : 500
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    captureServerException(error, { route: '/api/subscribe' })
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 })
  }
}
