import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.noblelink.app'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Look up user — always return success to avoid leaking account existence
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find(u => u.email === email)
  if (!user) return NextResponse.json({ success: true })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h

  await supabaseAdmin.from('email_otps').delete().eq('email', email)

  const { error: dbError } = await supabaseAdmin
    .from('email_otps')
    .insert({ email, code: token, user_id: user.id, expires_at: expiresAt })

  if (dbError) return NextResponse.json({ success: true }) // silent fail

  const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: 'Noble <notifications@noblelink.app>',
    to: email,
    subject: 'Reset your Noble password',
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
                <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:14px;">Password reset</p>
                <h2 style="margin:0 0 16px;color:white;font-size:22px;">Forgot your password?</h2>
                <p style="margin:0 0 28px;color:rgba(255,255,255,0.4);font-size:14px;">Click the button below to set a new password. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#C9A84C;color:#000;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Reset password →</a>
              </td></tr>
              <tr><td align="center" style="padding-top:20px;">
                <p style="margin:0;color:rgba(255,255,255,0.2);font-size:12px;">If you didn't request a password reset, ignore this email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  })

  return NextResponse.json({ success: true })
}
