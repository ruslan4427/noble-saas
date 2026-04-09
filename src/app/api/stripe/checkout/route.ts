import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_IDS: Record<string, string> = {
  starter:  process.env.STRIPE_STARTER_PRICE_ID!,
  pro:      process.env.STRIPE_PRO_PRICE_ID!,
  business: process.env.STRIPE_BUSINESS_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  const { org_id, plan } = await req.json()

  if (!org_id || !plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id, name, owner_id')
    .eq('id', org_id)
    .single()

  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

  const { data: userData } = await supabase.auth.admin.getUserById(org.owner_id)
  const email = userData?.user?.email ?? ''

  let customerId = org.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: org.name,
      metadata: { org_id },
    })
    customerId = customer.id
    await supabase.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org_id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { org_id, plan_id: plan },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
    metadata: { org_id, plan_id: plan },
  })

  return NextResponse.json({ url: session.url })
}
