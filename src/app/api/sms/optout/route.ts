import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const from = params.get('From') || ''
    const body = (params.get('Body') || '').trim().toUpperCase()
    if (!from) return new Response('', { status: 200 })
    const STOP_WORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
    const START_WORDS = ['START', 'YES', 'UNSTOP']
    const isStop = STOP_WORDS.some(w => body === w || body.startsWith(w + ' '))
    const isStart = START_WORDS.includes(body)
    if (isStop || isStart) {
      await supabase.from('sms_consent').update({
        consented: isStart,
      }).eq('phone', from)
    }
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (err) {
    console.error('SMS optout error:', err)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}
