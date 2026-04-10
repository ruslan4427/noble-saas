import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  console.log('Webhook event:', event.type, event.id)

  try {
    // Check idempotency
    const { data: seen } = await supabase
      .from('billing_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (seen) {
      console.log('Event already processed:', event.id)
      return NextResponse.json({ ok: true })
    }

    // Save event
    await supabase.from('billing_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'processing',
      org_id: null,
      metadata: {},
    })

    await handle(event)

    // Update event status
    await supabase.from('billing_events')
      .update({ status: 'processed' })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed', detail: String(err) }, { status: 500 })
  }
}

async function handle(event: Stripe.Event) {
  console.log('Handling event:', event.type)

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      console.log('Checkout session:', s.id, 'subscription:', s.subscription)
      if (s.subscription) await sync(s.subscription as string)
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      console.log('Invoice:', inv.id, 'subscription:', inv.subscription)
      if (inv.subscription) await sync(inv.subscription as string)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log('Subscription:', sub.id, 'status:', sub.status)
      await sync(sub.id, sub)
      break
    }
    default:
      console.log('Unhandled event type:', event.type)
  }
}

async function sync(subId: string, cached?: Stripe.Subscription) {
  console.log('Syncing subscription:', subId)
  const sub = cached ?? await stripe.subscriptions.retrieve(subId)
  const orgId = sub.metadata?.org_id
  const planId = sub.metadata?.plan_id ?? 'starter'

  console.log('Sub metadata:', { orgId, planId, status: sub.status })

  if (!orgId) {
    console.warn('No org_id in subscription metadata')
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any

  const updateData = {
    plan_id: planId,
    stripe_subscription_id: sub.id,
    sub_status: sub.status,
    current_period_end: subAny.current_period_end
      ? new Date(subAny.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_ends_at: subAny.trial_end
      ? new Date(subAny.trial_end * 1000).toISOString()
      : null,
  }

  console.log('Updating org:', orgId, updateData)

  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId)

  if (error) {
    console.error('Supabase update error:', error)
    throw error
  }

  console.log('Org updated successfully')
}
