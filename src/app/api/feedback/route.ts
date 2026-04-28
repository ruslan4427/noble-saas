import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SPREADSHEET_ID = '1QDw3x1XaXlqYVNnfgNf77ESJM4XdF269wcz0nxIwQ0s'
const SHEET_NAME     = 'Лист1'

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function POST(req: NextRequest) {
  // Auth — get salon_id and email from server session
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  // Validate body
  const body = await req.json()
  const { category, message, rating } = body

  if (!category || !message || typeof rating !== 'number') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (message.trim().length < 5) {
    return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  }

  const row = [
    new Date().toISOString(),          // Timestamp
    org?.id   ?? '—',                  // Salon ID
    org?.name ?? '—',                  // Salon Name
    user.email ?? '—',                 // User Email
    category,                          // Category
    message.trim(),                    // Message
    rating,                            // Rating (1-5)
    'New',                             // Status
  ]

  try {
    const sheets = await getSheets()
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range:         `${SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })
  } catch (err) {
    console.error('Google Sheets error:', err)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
