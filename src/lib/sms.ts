// SMS via Twilio REST API (no SDK)
// Required env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER  OR  TWILIO_MESSAGING_SERVICE_SID (preferred for A2P 10DLC)

const TWILIO_SID      = process.env.TWILIO_ACCOUNT_SID ?? ''
const TWILIO_TOKEN    = process.env.TWILIO_AUTH_TOKEN ?? ''
const TWILIO_FROM     = process.env.TWILIO_PHONE_NUMBER ?? ''
const TWILIO_MSG_SVC  = process.env.TWILIO_MESSAGING_SERVICE_SID ?? ''

// Auto-enables when account + token + (phone or messaging service) are set
export const SMS_ENABLED = !!(TWILIO_SID && TWILIO_TOKEN && (TWILIO_FROM || TWILIO_MSG_SVC))

// ── Core send ──────────────────────────────────────────────────────────────
export async function sendSMS(to: string, body: string): Promise<{ sid: string } | null> {
  if (!SMS_ENABLED) return null
  if (!TWILIO_SID || !TWILIO_TOKEN || (!TWILIO_FROM && !TWILIO_MSG_SVC)) {
    console.warn('SMS skipped: Twilio env vars not set')
    return null
  }

  const phone = normalisePhone(to)
  if (!phone) {
    console.warn('SMS skipped: invalid phone number', to)
    return null
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  // Prefer MessagingServiceSid (A2P 10DLC compliant) over From phone number
  const params = new URLSearchParams({ To: phone, Body: body })
  if (TWILIO_MSG_SVC) params.set('MessagingServiceSid', TWILIO_MSG_SVC)
  else params.set('From', TWILIO_FROM)

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
  if (/^\+\d{7,15}$/.test(raw)) return raw
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) return `+38${digits.slice(1)}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`
  return null
}

// ── Timezone-aware date formatting ─────────────────────────────────────────
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
    return `${dateStr} o ${timeSlot}`
  }
}

// ── Message templates (no emoji — avoids Twilio 30038 OTP filter) ──────────
interface BookingParams {
  clientName: string
  salonName: string
  masterName: string
  serviceName: string
  date: string
  time: string
  timezone: string
}

export function smsConfirmation(p: BookingParams): string {
  const when = formatDateInTZ(p.date, p.time, p.timezone)
  return `${p.salonName}: Appointment confirmed!\nClient: ${p.clientName}\nWith: ${p.masterName}\nService: ${p.serviceName}\nWhen: ${when}\nReply STOP to unsubscribe.`
}

export function smsReminder(p: BookingParams): string {
  const when = formatDateInTZ(p.date, p.time, p.timezone)
  return `${p.salonName}: Reminder! Your appointment is in 2 hours.\nWith: ${p.masterName}\nService: ${p.serviceName}\nWhen: ${when}\nReply STOP to unsubscribe.`
}

export function smsCancellation(p: BookingParams): string {
  const when = formatDateInTZ(p.date, p.time, p.timezone)
  return `${p.salonName}: Your appointment has been cancelled.\nWith: ${p.masterName}\nService: ${p.serviceName}\nWhen: ${when}\nReply STOP to unsubscribe.`
}

export function smsReschedule(p: BookingParams & { oldDate: string; oldTime: string }): string {
  const newWhen = formatDateInTZ(p.date, p.time, p.timezone)
  const oldWhen = formatDateInTZ(p.oldDate, p.oldTime, p.timezone)
  return `${p.salonName}: Appointment rescheduled.\nFrom: ${oldWhen}\nTo: ${newWhen}\nWith: ${p.masterName}\nService: ${p.serviceName}\nReply STOP to unsubscribe.`
}
