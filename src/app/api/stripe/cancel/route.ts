import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { org_id } = await req.json()
  if (!org_id) return NextResponse.json({ error: 'Missing org_id' }, { status: 400 })

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', org_id)
    .single()

  if (!org?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  }

  // Cancel at period end so the user keeps access until billing cycle ends
  await stripe.subscriptions.update(org.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  await supabaseAdmin
    .from('organizations')
    .update({ sub_status: 'canceled' })
    .eq('id', org_id)

  return NextResponse.json({ ok: true })
}
