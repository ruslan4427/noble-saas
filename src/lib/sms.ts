import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const FROM = process.env.TWILIO_PHONE_NUMBER!

// ── Types ──────────────────────────────────────────────────────────────────
interface SmsParams {
  to: string
  body: string
}

async function sendSms({ to, body }: SmsParams): Promise<string | null> {
  try {
    const msg = await client.messages.create({ from: FROM, to, body })
    return msg.sid
  } catch (err) {
    console.error('[SMS] send failed:', err)
    return null
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

export async function sendSmsConfirmation({
  to, clientName, salonName, masterName, serviceName, date, time,
}: {
  to: string; clientName: string; salonName: string
  masterName: string; serviceName: string; date: string; time: string
}) {
  const body =
    `✂ ${salonName}\n` +
    `Hi ${clientName}! Your booking is confirmed.\n` +
    `${serviceName} with ${masterName}\n` +
    `${date} at ${time}\n` +
    `Reply STOP to opt out.`
  return sendSms({ to, body })
}

export async function sendSmsReminder({
  to, clientName, salonName, masterName, serviceName, date, time,
}: {
  to: string; clientName: string; salonName: string
  masterName: string; serviceName: string; date: string; time: string
}) {
  const body =
    `✂ ${salonName}\n` +
    `Hi ${clientName}! Reminder: your appointment is in 2 hours.\n` +
    `${serviceName} with ${masterName} at ${time}\n` +
    `Reply STOP to opt out.`
  return sendSms({ to, body })
}

export async function sendSmsCancel({
  to, clientName, salonName, serviceName, date, time,
}: {
  to: string; clientName: string; salonName: string
  serviceName: string; date: string; time: string
}) {
  const body =
    `✂ ${salonName}\n` +
    `Hi ${clientName}, your appointment has been cancelled.\n` +
    `${serviceName} on ${date} at ${time}\n` +
    `Contact us to rebook.\n` +
    `Reply STOP to opt out.`
  return sendSms({ to, body })
}

export async function sendSmsReschedule({
  to, clientName, salonName, masterName, serviceName, newDate, newTime,
}: {
  to: string; clientName: string; salonName: string
  masterName: string; serviceName: string; newDate: string; newTime: string
}) {
  const body =
    `✂ ${salonName}\n` +
    `Hi ${clientName}, your appointment has been rescheduled.\n` +
    `${serviceName} with ${masterName}\n` +
    `New time: ${newDate} at ${newTime}\n` +
    `Reply STOP to opt out.`
  return sendSms({ to, body })
}
