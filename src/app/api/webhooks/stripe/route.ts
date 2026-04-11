import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentSuccess, sendTrialEnding } from '@/lib/email'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }
  try {
    const { data: seen } = await supabase.from('billing_events').select('id').eq('stripe_event_id', event.id).maybeSingle()
    if (seen) return NextResponse.json({ ok: true })
    await supabase.from('billing_events').insert({ stripe_event_id: event.id, event_type: event.type, status: 'processing', org_id: null, metadata: {} })
    await handle(event)
    await supabase.from('billing_events').update({ status: 'processed' }).eq('stripe_event_id', event.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Handler failed', detail: String(err) }, { status: 500 })
  }
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      if (s.subscription) await sync(s.subscription as string)
      break
    }
    case 'invoice.paid': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      if (inv.subscription) {
        await sync(inv.subscription as string)
        await notifyPaymentSuccess(inv.subscription as string, inv.amount_paid)
      }
      break
    }
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
    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription
      await notifyTrialEnding(sub)
      break
    }
    default:
      console.log('Unhandled event type:', event.type)
  }
}

async function sync(subId: string, cached?: Stripe.Subscription) {
  const sub = cached ?? await stripe.subscriptions.retrieve(subId)
  const orgId = sub.metadata?.org_id
  if (!orgId) { console.warn('No org_id in subscription metadata'); return }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any
  const { error } = await supabase.from('organizations').update({
    plan_id: sub.metadata?.plan_id ?? 'starter',
    stripe_subscription_id: sub.id,
    sub_status: sub.status,
    current_period_end: subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_ends_at: subAny.trial_end ? new Date(subAny.trial_end * 1000).toISOString() : null,
  }).eq('id', orgId)
  if (error) throw error
}

async function notifyPaymentSuccess(subId: string, amountPaid: number) {
  try {
    const sub = await stripe.subscriptions.retrieve(subId)
    const orgId = sub.metadata?.org_id
    if (!orgId) return
    const { data: org } = await supabase.from('organizations').select('name, owner_id').eq('id', orgId).single()
    if (!org) return
    const { data: ud } = await supabase.auth.admin.getUserById(org.owner_id)
    const email = ud?.user?.email
    if (!email) return
    const ownerName = ud?.user?.user_metadata?.full_name ?? 'there'
    const plans: Record<string, string> = { starter: 'Starter', pro: 'Pro', business: 'Business' }
    const planId = sub.metadata?.plan_id ?? 'starter'
    await sendPaymentSuccess({ to: email, ownerName, salonName: org.name, planName: plans[planId] ?? 'Starter', amount: Math.round(amountPaid / 100) })
    console.log('Payment success email sent to', email)
  } catch (err) { console.error('notifyPaymentSuccess error:', err) }
}

async function notifyTrialEnding(sub: Stripe.Subscription) {
  try {
    const orgId = sub.metadata?.org_id
    if (!orgId) return
    const { data: org } = await supabase.from('organizations').select('name, owner_id').eq('id', orgId).single()
    if (!org) return
    const { data: ud } = await supabase.auth.admin.getUserById(org.owner_id)
    const email = ud?.user?.email
    if (!email) return
    const ownerName = ud?.user?.user_metadata?.full_name ?? 'there'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subAny = sub as any
    const trialEnd = subAny.trial_end ? new Date(subAny.trial_end * 1000) : null
    const daysLeft = trialEnd ? Math.max(1, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 3
    await sendTrialEnding({ to: email, ownerName, salonName: org.name, daysLeft })
    console.log('Trial ending email sent to', email)
  } catch (err) { console.error('notifyTrialEnding error:', err) }
}
