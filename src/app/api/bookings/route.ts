import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email'

// ── Validation schema ────────────────────────────────────────────────────────

const E164 = /^\+[1-9]\d{6,14}$/

const BookingSchema = z.object({
  org_id:        z.string().uuid(),
  master_id:     z.string().uuid(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  time_slot:     z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  slot_start_utc: z.string().datetime({ message: 'Must be ISO 8601 UTC' }),
  slot_end_utc:   z.string().datetime({ message: 'Must be ISO 8601 UTC' }),
  client_name:   z.string().min(2).max(100),
  client_phone:  z.string().regex(E164, 'Must be E.164 format e.g. +12125551234'),
  client_email:  z.string().email().optional().or(z.literal('')),
  service_name:  z.string().min(1).max(120),
  price_cents:   z.number().int().min(0).default(0),
  duration_min:  z.number().int().min(5).max(480).default(30),
})

// ── Error code → HTTP status map ─────────────────────────────────────────────

const ERROR_STATUS: Record<string, number> = {
  SLOT_OCCUPIED:   409,
  CLIENT_OVERLAP:  409,
  INVALID_DATA:    400,
}

function parseDbError(err: unknown): { code: string; message: string; status: number } {
  const msg = err instanceof Error ? err.message : String(err)

  if (msg.includes('SLOT_OCCUPIED')) {
    return { code: 'SLOT_OCCUPIED', message: 'This time slot is already booked.', status: 409 }
  }
  if (msg.includes('CLIENT_OVERLAP')) {
    return { code: 'CLIENT_OVERLAP', message: 'You already have a booking at this time.', status: 409 }
  }
  return { code: 'SERVER_ERROR', message: 'Booking could not be created. Please try again.', status: 500 }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse & validate input
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ code: 'INVALID_DATA', error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BookingSchema.safeParse(body)
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors
    return NextResponse.json({ code: 'INVALID_DATA', error: 'Validation failed', fields }, { status: 400 })
  }

  const d = parsed.data

  // 2. Call stored procedure — atomic overlap check + insert
  const { data: bookingId, error: rpcError } = await supabaseAdmin.rpc('create_booking', {
    p_org_id:       d.org_id,
    p_master_id:    d.master_id,
    p_date:         d.date,
    p_time_slot:    d.time_slot,
    p_slot_start:   d.slot_start_utc,
    p_slot_end:     d.slot_end_utc,
    p_client_name:  d.client_name,
    p_client_phone: d.client_phone,
    p_client_email: d.client_email || null,
    p_service_name: d.service_name,
    p_price_cents:  d.price_cents,
    p_duration_min: d.duration_min,
  })

  if (rpcError) {
    const parsed = parseDbError(rpcError)
    logger.error({ event: 'booking_rpc_failed', code: parsed.code, err: rpcError })
    return NextResponse.json({ code: parsed.code, error: parsed.message }, { status: parsed.status })
  }

  logger.info({
    event:      'booking_created',
    bookingId,
    orgId:      d.org_id,
    masterId:   d.master_id,
    clientName: d.client_name,
    date:       d.date,
    timeSlot:   d.time_slot,
  })

  // 3. Send emails (non-blocking — errors logged, booking still succeeds)
  const [{ data: org }, { data: staff }] = await Promise.all([
    supabaseAdmin.from('organizations').select('name, owner_id').eq('id', d.org_id).single(),
    supabaseAdmin.from('staff').select('name').eq('id', d.master_id).single(),
  ])

  const salonName  = org?.name  ?? ''
  const masterName = staff?.name ?? ''
  const price      = Math.round(d.price_cents / 100)

  if (d.client_email) {
    try {
      await sendBookingConfirmation({
        to: d.client_email, clientName: d.client_name, salonName,
        masterName, serviceName: d.service_name, date: d.date, time: d.time_slot, price,
      })
    } catch (err) {
      logger.error({ event: 'booking_email_client_failed', bookingId, err })
    }
  }

  if (org?.owner_id) {
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(org.owner_id)
      const ownerEmail = userData?.user?.email
      if (ownerEmail) {
        await sendBookingNotification({
          to: ownerEmail, salonName, clientName: d.client_name,
          clientPhone: d.client_phone, masterName,
          serviceName: d.service_name, date: d.date, time: d.time_slot, price,
        })
      }
    } catch (err) {
      logger.error({ event: 'booking_email_owner_failed', bookingId, err })
    }
  }

  return NextResponse.json({ id: bookingId })
}
