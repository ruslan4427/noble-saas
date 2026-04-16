// SMS via Twilio
// Required env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER   (e.g. +1234567890)

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM  = process.env.TWILIO_PHONE_NUMBER!

// ── Core send ──────────────────────────────────────────────────────────────
export async function sendSMS(to: string, body: string): Promise<{ sid: string } | null> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.warn('SMS skipped: Twilio env vars not set')
    return null
  }

  // Normalise phone — ensure E.164 format
  const phone = normalisePhone(to)
  if (!phone) {
    console.warn('SMS skipped: invalid phone number', to)
    return null
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({ To: phone, From: TWILIO_FROM, Body: body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
    },
    body: params.toString(),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Twilio error:', data)
    throw new Error(`Twilio ${data.code}: ${data.message}`)
  }

  return { sid: data.sid }
}

// ── Phone normalisation ────────────────────────────────────────────────────
function normalisePhone(raw: string): string | null {
  // Already E.164
  if (/^\+\d{7,15}$/.test(raw)) return raw
  // US number without country code — add +1
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  // Ukraine
  if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`
  return null
}

// ── Timezone-aware date formatting ────────────────────────────────────────
export function formatDateInTZ(dateStr: string, timeSlot: string, timezone: string): string {
  try {
    const dt = new Date(`${dateStr}T${timeSlot}:00`)
    return dt.toLocaleString('uk-UA', {
      timeZone: timezone,
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return `${dateStr} о ${timeSlot}`
  }
}

// ── Message templates ─────────────────────────────────────────────────────
interface BookingParams {
  clientName: string
  salonName: string
  masterName: string
  serviceName: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  timezone: string
}

export function smsConfirmation(p: BookingParams): string {
  const when = formatDateInTZ(p.date, p.time, p.timezone)
  return `✂ ${p.salonName}\n\nПривіт, ${p.clientName}! Ваш запис підтверджено.\n\n📅 ${when}\n💈 ${p.masterName} — ${p.serviceName}\n\nВідповідь STOP — відписатись.`
}

export function smsReminder(p: BookingParams): string {
  const when = formatDateInTZ(p.date, p.time, p.timezone)
  return `✂ ${p.salonName}\n\nНагадування: ваш запис через 2 години!\n\n📅 ${when}\n💈 ${p.masterName} — ${p.serviceName}\n\nВідповідь STOP — відписатись.`
}

export function smsCancellation(p: Omit<BookingParams, 'date' | 'time' | 'timezone'> & { date: string; time: string; timezone: string }): string {
  const when = formatDateInTZ(p.date, p.time, p.timezone)
  return `✂ ${p.salonName}\n\nВаш запис скасовано.\n\n📅 ${when}\n💈 ${p.masterName} — ${p.serviceName}\n\nЩоб записатись знову: noblelink.app/salon/\n\nВідповідь STOP — відписатись.`
}

export function smsReschedule(p: BookingParams & { oldDate: string; oldTime: string }): string {
  const newWhen = formatDateInTZ(p.date, p.time, p.timezone)
  const oldWhen = formatDateInTZ(p.oldDate, p.oldTime, p.timezone)
  return `✂ ${p.salonName}\n\nВаш запис перенесено.\n\n❌ Було: ${oldWhen}\n✅ Тепер: ${newWhen}\n💈 ${p.masterName} — ${p.serviceName}\n\nВідповідь STOP — відписатись.`
}
