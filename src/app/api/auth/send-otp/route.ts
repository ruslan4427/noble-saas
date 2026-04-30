import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email, userId } = await req.json()
  if (!email || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Delete any existing code for this email first, then insert fresh.
  await supabaseAdmin.from('email_otps').delete().eq('email', email)

  const { error: dbError } = await supabaseAdmin
    .from('email_otps')
    .insert({ email, code, user_id: userId, expires_at: expiresAt })

  if (dbError) return NextResponse.json({ error: 'Failed to save code' }, { status: 500 })

  const { error: emailError } = await resend.emails.send({
    from: 'Noble <notifications@noblelink.app>',
    to: email,
    subject: 'Your Noble verification code',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0F0A00;font-family:sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0A00;padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
              <tr><td align="center" style="padding-bottom:28px;">
                <span style="font-size:22px;color:#C9A84C;font-weight:bold;">✂ Noble</span>
              </td></tr>
              <tr><td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px 32px;text-align:center;">
                <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:14px;">Your verification code</p>
                <h1 style="margin:0 0 24px;color:#C9A84C;font-size:48px;font-weight:bold;letter-spacing:12px;">${code}</h1>
                <p style="margin:0;color:rgba(255,255,255,0.3);font-size:13px;">Enter this code on the signup page.<br>Expires in 10 minutes.</p>
              </td></tr>
              <tr><td align="center" style="padding-top:20px;">
                <p style="margin:0;color:rgba(255,255,255,0.2);font-size:12px;">If you didn't create a Noble account, ignore this email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  })

  if (emailError) return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })

  return NextResponse.json({ success: true })
}
