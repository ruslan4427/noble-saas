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
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  const { data: seen } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (seen) return NextResponse.json({ ok: true })

  try {
    await handle(event)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      if (s.subscription) await sync(s.subscription as string)
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      if (inv.subscription) await sync(inv.subscription as string)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await sync(sub.id, sub)
      break
    }
  }
}

async function sync(subId: string, cached?: Stripe.Subscription) {
  const sub = cached ?? await stripe.subscriptions.retrieve(subId)
  const orgId  = sub.metadata?.org_id
  const planId = sub.metadata?.plan_id ?? 'starter'
  if (!orgId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any

  await supabase.from('organizations').update({
    plan_id:                planId,
    stripe_subscription_id: sub.id,
    sub_status:             sub.status,
    current_period_end:     new Date(subAny.current_period_end * 1000).toISOString(),
    cancel_at_period_end:   sub.cancel_at_period_end,
    trial_ends_at:          subAny.trial_end
      ? new Date(subAny.trial_end * 1000).toISOString()
      : null,
  }).eq('id', orgId)
}
