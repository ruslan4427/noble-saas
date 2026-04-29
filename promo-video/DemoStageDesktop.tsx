'use client'
// Desktop promo — replicates the real Noble dashboard UI
// 960×600 browser preview · ?record for clean capture
import { useState, useEffect, useRef } from 'react'

const G = '#C9A84C'   // gold
const D = '#0F0A00'   // noble black (page bg)
const W10 = 'rgba(255,255,255,0.10)'
const W5  = 'rgba(255,255,255,0.05)'
const W6  = 'rgba(255,255,255,0.06)'
const W20 = 'rgba(255,255,255,0.20)'
const W40 = 'rgba(255,255,255,0.40)'
const W60 = 'rgba(255,255,255,0.60)'

// ── Shared primitives ─────────────────────────────────────────────────────────

function Nav({ orgName = 'Chop-Chop Barbershop', ownerName = 'Roman' }: { orgName?: string; ownerName?: string }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 48, flexShrink: 0,
      borderBottom: `1px solid ${W10}`,
      background: 'rgba(15,10,0,0.97)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'Georgia, serif', color: G, fontSize: 15.5 }}>✂ Noble</span>
        <span style={{ color: W20, fontSize: 14 }}>|</span>
        <span style={{ color: W60, fontSize: 12.5 }}>{orgName}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontSize: 10.5, background: `${G}1a`, border: `1px solid ${G}4d`,
          color: G, padding: '2px 8px', borderRadius: 999,
        }}>Starter plan</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: G,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: D, flexShrink: 0,
          }}>{ownerName[0]}</div>
          <div>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, lineHeight: 1.2 }}>{ownerName}</div>
            <div style={{ fontSize: 10, color: G }}>Manager</div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: W40 }}>Sign out</span>
      </div>
    </nav>
  )
}

function Tabs({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: W5, borderRadius: 8, padding: 4, width: 'fit-content', flexShrink: 0 }}>
      {tabs.map(tab => (
        <div key={tab} style={{
          padding: '6px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
          background: tab === active ? G : 'transparent',
          color: tab === active ? '#000' : W40,
          cursor: 'default',
        }}>{tab}</div>
      ))}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: W5, border: `1px solid ${W10}`, borderRadius: 12, padding: '20px 24px', ...style }}>
      {children}
    </div>
  )
}

// Browser chrome wrapper
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1a1a1a' }}>
      {/* Chrome bar */}
      <div style={{
        height: 36, flexShrink: 0,
        background: '#2a2a2a',
        borderBottom: '1px solid rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        </div>
        {/* URL bar */}
        <div style={{
          flex: 1, height: 24, background: '#1a1a1a', borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>noblelink.app/dashboard</span>
        </div>
        <div style={{ width: 52 }} />
      </div>
      {/* Page */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

// ── Scene 0 — Chaos ───────────────────────────────────────────────────────────
const EMAILS = [
  { from: 'Mike T.',    subj: 'Are you free tomorrow?',         time: '9:02 AM',  delay: 0    },
  { from: 'Sarah K.',   subj: 'Booking request — Friday 5 PM',  time: '9:18 AM',  delay: 650  },
  { from: 'Alex M.',    subj: 'Quick question about your hours', time: '10:05 AM', delay: 1250 },
  { from: 'Anna R.',    subj: 'Re: Appointment next week',       time: '10:34 AM', delay: 1850 },
  { from: 'Carlos D.',  subj: 'Wednesday booking plz',          time: '11:12 AM', delay: 2350 },
  { from: 'Julia S.',   subj: 'Is 3 PM available?',             time: '11:45 AM', delay: 2850 },
  { from: 'Tom N.',     subj: 'Saturday — any openings?',       time: '12:03 PM', delay: 3250 },
]
const AVATAR_HUE = ['#e05', '#07c', '#0a8', '#a50', '#60a', '#c40', '#06b']

function ChaosScene() {
  const [count,    setCount]    = useState(0)
  const [fadeOut,  setFadeOut]  = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    EMAILS.forEach((e, i) => { const t = setTimeout(() => setCount(i + 1), e.delay); timers.current.push(t) })
    const t1 = setTimeout(() => setFadeOut(true),  5000); timers.current.push(t1)
    const t2 = setTimeout(() => setShowLogo(true), 5800); timers.current.push(t2)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, animation: 'sceneIn 0.5s ease both' }}>
      <BrowserFrame>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
          {/* Toolbar */}
          <div style={{ height: 40, flexShrink: 0, background: '#f8f9fa', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            <div style={{ height: 26, width: 200, borderRadius: 13, background: '#e8eaed', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: '#5f6368' }}>
              🔍  Search mail
            </div>
            {count >= 3 && (
              <div style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 10, animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                {count} new
              </div>
            )}
          </div>
          {/* Sidebar + rows */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Gmail sidebar */}
            <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid #e5e7eb', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[['Inbox', count, true], ['Sent', '', false], ['Drafts', 3, false], ['Spam', 12, false]].map(([label, cnt, active]) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 16, background: active ? '#e8f0fe' : 'transparent', fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#1a73e8' : '#444' }}>
                  <span>{String(label)}</span>
                  {cnt ? <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#1a73e8' : '#666' }}>{String(cnt)}</span> : null}
                </div>
              ))}
            </div>
            {/* Inbox rows */}
            <div style={{ flex: 1, overflow: 'hidden', opacity: fadeOut ? 0 : 1, transition: 'opacity 0.8s ease' }}>
              {EMAILS.slice(0, count).map((e, i) => (
                <div key={e.from} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #f1f3f4', background: '#fff', animation: 'rowSlide 0.3s ease both', opacity: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: AVATAR_HUE[i % 7], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{e.from[0]}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>{e.from}</span>
                      <span style={{ fontSize: 11, color: '#5f6368', flexShrink: 0 }}>{e.time}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subj}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4285f4', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Noble reveal */}
          <div style={{ position: 'absolute', inset: 0, background: D, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: showLogo ? 1 : 0, transition: 'opacity 0.8s ease', pointerEvents: showLogo ? 'auto' : 'none' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: G, marginBottom: 14 }}>✂ Noble</div>
            <p style={{ color: W60, fontSize: 15, textAlign: 'center', lineHeight: 1.7 }}>No more inbox chaos.<br />Clients book themselves.</p>
          </div>
        </div>
      </BrowserFrame>
      <style>{`
        @keyframes rowSlide { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
        @keyframes popIn    { from { opacity:0; transform:scale(0.6);       } to { opacity:1; transform:scale(1);   } }
      `}</style>
    </div>
  )
}

// ── Scene 1 — Overview tab ────────────────────────────────────────────────────
function OverviewScene() {
  const [showCards, setShowCards] = useState(false)
  const [showLink,  setShowLink]  = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowCards(true), 400)
    const t2 = setTimeout(() => setShowLink(true),  1100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const STATS = [
    { label: 'Staff members', value: '3' },
    { label: 'Services',      value: '2' },
    { label: 'Status',        value: 'active' },
    { label: 'Trial days left', value: '11' },
  ]

  const RECENT = [
    { client: 'John Doe',  service: 'Skin Fade',       time: '10:30 AM', price: '$45', staff: 'Roman'   },
    { client: 'Sarah K.',  service: 'Beard Sculpting', time: '11:00 AM', price: '$30', staff: 'Jonatan' },
    { client: 'Mike T.',   service: 'Skin Fade',       time: '2:30 PM',  price: '$45', staff: 'Roman'   },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, animation: 'sceneIn 0.5s ease both' }}>
      <BrowserFrame>
        <div style={{ height: '100%', background: D, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Nav />
          <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Tabs tabs={['Overview', 'Calendar', 'Staff', 'Services', 'Settings']} active="Overview" />

            {/* Stats grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8,
              opacity: showCards ? 1 : 0, transform: showCards ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.5s ease', flexShrink: 0,
            }}>
              {STATS.map(s => (
                <Card key={s.label} style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: W40, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{s.value}</div>
                </Card>
              ))}
            </div>

            {/* Booking link card */}
            <Card style={{
              opacity: showLink ? 1 : 0,
              transform: showLink ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.5s ease',
              flexShrink: 0, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Your booking page</div>
              <div style={{ fontSize: 11, color: W40, marginBottom: 10 }}>Share this link with clients so they can book online.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '7px 12px', borderRadius: 6, flex: 1 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: G }}>noblelink.app/salon/chop-chop</span>
                </div>
                <button style={{ background: G, color: '#000', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'default', whiteSpace: 'nowrap' }}>Copy link</button>
                <button style={{ border: `1px solid ${W20}`, color: W60, fontSize: 12, padding: '6px 10px', borderRadius: 6, background: 'transparent', cursor: 'default' }}>Open ↗</button>
              </div>
            </Card>

            {/* Recent bookings — exact RecentBookings.tsx style */}
            <div style={{
              flex: 1, overflow: 'hidden', background: W5, border: `1px solid ${W10}`, borderRadius: 12,
              display: 'flex', flexDirection: 'column',
              opacity: showLink ? 1 : 0, transition: 'opacity 0.5s ease 0.2s',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: `1px solid ${W10}`, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Recent bookings</span>
                {/* Filter tabs */}
                <div style={{ display: 'flex', overflow: 'hidden', background: W5, border: `1px solid ${W10}`, borderRadius: 7 }}>
                  {['All', 'Today', 'Week'].map((tab, i) => (
                    <div key={tab} style={{ padding: '3px 10px', fontSize: 11, fontWeight: i === 0 ? 700 : 400, background: i === 0 ? G : 'transparent', color: i === 0 ? '#000' : W40 }}>{tab}</div>
                  ))}
                </div>
              </div>
              {/* Today group header */}
              <div style={{ padding: '5px 20px', background: `${G}0d`, borderBottom: `1px solid rgba(255,255,255,0.05)`, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: G, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today · Apr 28</span>
              </div>
              {/* Rows */}
              {RECENT.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < RECENT.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                  {/* Date badge */}
                  <div style={{ flexShrink: 0, textAlign: 'center', width: 40 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: G, lineHeight: 1.3 }}>APR</div>
                    <div style={{ fontSize: 10, color: W40, lineHeight: 1.3 }}>28</div>
                  </div>
                  {/* Divider */}
                  <div style={{ width: 1, height: 32, background: W10, flexShrink: 0 }} />
                  {/* Avatar */}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: D, flexShrink: 0 }}>{r.client[0]}</div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.client}</div>
                    <div style={{ fontSize: 11, color: W40 }}>{r.service} · {r.staff} · {r.time}</div>
                  </div>
                  {/* Price */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: G, flexShrink: 0 }}>{r.price}</div>
                  {/* Status badge */}
                  <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#4ade80', flexShrink: 0 }}>confirmed</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  )
}

// ── Scene 2 — Calendar tab (week grid) ───────────────────────────────────────
function CalendarScene() {
  const [showGrid, setShowGrid] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowGrid(true), 500)
    return () => clearTimeout(t)
  }, [])

  const DAYS_HDR = [
    { abbr: 'MON', date: 28, isToday: true  },
    { abbr: 'TUE', date: 29, isToday: false },
    { abbr: 'WED', date: 30, isToday: false },
    { abbr: 'THU', date: 1,  isToday: false },
    { abbr: 'FRI', date: 2,  isToday: false },
    { abbr: 'SAT', date: 3,  isToday: false },
    { abbr: 'SUN', date: 4,  isToday: false },
  ]
  const HOURS = [9, 10, 11, 12, 13, 14, 15]

  const SC: Record<string, { bg: string; border: string; text: string }> = {
    roman:   { bg: 'rgba(201,168,76,0.2)',  border: '#C9A84C', text: '#C9A84C'  },
    jonatan: { bg: 'rgba(59,130,246,0.2)',  border: '#60a5fa', text: '#60a5fa' },
    ross:    { bg: 'rgba(16,185,129,0.2)',  border: '#34d399', text: '#34d399' },
  }

  const CALS = [
    { hour: 9,  day: 0, client: 'Mike T.',   service: 'Skin Fade',       staff: 'roman'   },
    { hour: 9,  day: 0, client: 'Sarah K.',  service: 'Beard Sculpting', staff: 'jonatan' },
    { hour: 10, day: 0, client: 'Alex M.',   service: 'Skin Fade',       staff: 'roman'   },
    { hour: 11, day: 0, client: 'Anna R.',   service: 'Beard Sculpting', staff: 'ross'    },
    { hour: 13, day: 1, client: 'Carlos D.', service: 'Skin Fade',       staff: 'roman'   },
    { hour: 14, day: 1, client: 'Julia S.',  service: 'Beard Sculpting', staff: 'ross'    },
    { hour: 10, day: 2, client: 'Tom N.',    service: 'Skin Fade',       staff: 'roman'   },
    { hour: 9,  day: 4, client: 'James H.',  service: 'Skin Fade',       staff: 'jonatan' },
  ]

  function hourLabel(h: number) {
    return h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
  }

  return (
    <div style={{ position: 'absolute', inset: 0, animation: 'sceneIn 0.5s ease both' }}>
      <BrowserFrame>
        <div style={{ height: '100%', background: D, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Nav />
          <div style={{ flex: 1, overflow: 'hidden', padding: '14px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Tabs tabs={['Overview', 'Calendar', 'Staff', 'Services', 'Settings']} active="Calendar" />

            {/* Calendar sub-tabs + week nav on same row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 4, background: W5, borderRadius: 8, padding: 4 }}>
                {['📅 Bookings', '🚫 Blocks'].map((t, i) => (
                  <div key={t} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: i === 0 ? G : 'transparent', color: i === 0 ? '#000' : W40, fontWeight: i === 0 ? 600 : 400 }}>{t}</div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {['‹', '›'].map(ch => (
                  <div key={ch} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${W10}`, background: W5, color: W40, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>{ch}</div>
                ))}
                <span style={{ fontSize: 12.5, fontWeight: 500, color: W60 }}>Apr 28 — May 4, 2025</span>
                <div style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${G}44`, background: `${G}0d`, color: G, fontSize: 11, fontWeight: 600, cursor: 'default' }}>Today</div>
              </div>
            </div>

            {/* Week grid */}
            <div style={{
              flex: 1, overflow: 'hidden',
              opacity: showGrid ? 1 : 0, transform: showGrid ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.5s ease',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Day headers row */}
              <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', flexShrink: 0 }}>
                <div />
                {DAYS_HDR.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', paddingBottom: 6, borderLeft: `1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ fontSize: 9.5, color: W40, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{d.abbr}</div>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', margin: '0 auto',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: d.isToday ? G : 'transparent',
                      color: d.isToday ? '#000' : W60,
                      fontSize: 12.5, fontWeight: d.isToday ? 700 : 400,
                    }}>{d.date}</div>
                  </div>
                ))}
              </div>
              {/* Hour rows */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {HOURS.map(hour => (
                  <div key={hour} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.2)', textAlign: 'right', paddingRight: 7, paddingTop: 3, flexShrink: 0 }}>{hourLabel(hour)}</div>
                    {DAYS_HDR.map((d, dayIdx) => {
                      const cellBks = CALS.filter(b => b.hour === hour && b.day === dayIdx)
                      return (
                        <div key={dayIdx} style={{
                          borderTop: `1px solid rgba(255,255,255,0.05)`,
                          borderLeft: `1px solid rgba(255,255,255,0.05)`,
                          padding: '2px 2px 2px 3px',
                          minHeight: 46,
                          background: d.isToday ? `${G}07` : 'transparent',
                        }}>
                          {cellBks.map((b, bi) => {
                            const sc = SC[b.staff]
                            return (
                              <div key={bi} style={{
                                borderRadius: 3, padding: '2px 5px', marginBottom: 2,
                                borderLeft: `2px solid ${sc.border}`,
                                background: sc.bg, color: sc.text,
                                fontSize: 9.5, lineHeight: 1.4, overflow: 'hidden',
                              }}>
                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.client}</div>
                                <div style={{ opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.service}</div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  )
}

// ── Scene 3 — New booking coming in ──────────────────────────────────────────
function LiveBookingScene() {
  const [showToast,   setShowToast]   = useState(false)
  const [showBadge,   setShowBadge]   = useState(false)
  const [highlightRow, setHighlightRow] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowToast(true),    800)
    const t2 = setTimeout(() => setShowBadge(true),    1400)
    const t3 = setTimeout(() => setHighlightRow(true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const ROWS = [
    { client: 'Mike T.',   service: 'Skin Fade',       time: 'Today 9:00 AM',  staff: 'Roman',   isNew: false },
    { client: 'Sarah K.',  service: 'Beard Sculpting', time: 'Today 9:30 AM',  staff: 'Jonatan', isNew: false },
    { client: 'Alex M.',   service: 'Skin Fade',       time: 'Today 10:00 AM', staff: 'Roman',   isNew: false },
    { client: 'John Doe',  service: 'Skin Fade',       time: 'Today 2:30 PM',  staff: 'Jonatan', isNew: true  },
    { client: 'Anna R.',   service: 'Beard Sculpting', time: 'Today 4:00 PM',  staff: 'Ross',    isNew: false },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, animation: 'sceneIn 0.5s ease both' }}>
      <BrowserFrame>
        <div style={{ height: '100%', background: D, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <Nav />
          <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tabs tabs={['Overview', 'Calendar', 'Staff', 'Services', 'Settings']} active="Calendar" />
              {showBadge && (
                <div style={{ fontSize: 11, fontWeight: 700, background: '#22c55e', color: '#fff', padding: '3px 10px', borderRadius: 10, animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>+1 new booking</div>
              )}
            </div>

            {/* Booking rows */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>
              {ROWS.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: r.isNew && highlightRow ? `${G}0d` : W5,
                  border: `1px solid ${r.isNew && highlightRow ? `${G}45` : W10}`,
                  borderRadius: 10, padding: '10px 14px',
                  opacity: r.isNew && !showToast ? 0 : 1,
                  animation: r.isNew && showToast ? 'rowSlide 0.45s cubic-bezier(0.34,1.2,0.64,1) both' : 'none',
                  transition: 'background 0.4s ease, border-color 0.4s ease',
                  flexShrink: 0,
                  boxShadow: r.isNew && highlightRow ? `0 4px 20px ${G}20` : 'none',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: D, flexShrink: 0 }}>{r.client[0]}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{r.client}</span>
                  <span style={{ fontSize: 12, color: W60 }}>{r.service}</span>
                  <span style={{ fontSize: 12, color: W40 }}>{r.time}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: G, background: `${G}1a`, padding: '2px 8px', borderRadius: 5 }}>{r.staff}</span>
                  {r.isNew && highlightRow
                    ? <span style={{ fontSize: 10.5, fontWeight: 700, background: '#22c55e1a', color: '#22c55e', padding: '2px 8px', borderRadius: 5 }}>NEW</span>
                    : <span style={{ fontSize: 10.5, fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '2px 8px', borderRadius: 5 }}>confirmed</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Toast slides in from top-right */}
          <div style={{
            position: 'absolute', top: 56, right: 14,
            background: 'rgba(20,14,2,0.97)',
            border: `1.5px solid ${G}45`,
            borderRadius: 12, padding: '12px 14px', width: 270,
            boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px ${G}15`,
            transform: showToast ? 'translateX(0)' : 'translateX(300px)',
            opacity: showToast ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.34,1.3,0.64,1), opacity 0.35s ease',
            zIndex: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: D, fontWeight: 700 }}>✂</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Noble</span>
              <span style={{ fontSize: 10, color: W40, marginLeft: 'auto' }}>just now</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: G, marginBottom: 4 }}>New booking received!</div>
            <div style={{ fontSize: 11.5, color: W60, lineHeight: 1.5 }}>
              John Doe · Skin Fade · Today 2:30 PM<br />
              <span style={{ color: W40, fontSize: 10.5 }}>Jonatan · Email confirmation sent ✓</span>
            </div>
          </div>
        </div>
      </BrowserFrame>
      <style>{`
        @keyframes rowSlide { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
        @keyframes popIn    { from { opacity:0; transform:scale(0.6);       } to { opacity:1; transform:scale(1);   } }
      `}</style>
    </div>
  )
}

// ── Scene 4 — Staff + Services tabs ──────────────────────────────────────────
function StaffServicesScene() {
  const [showStaff,    setShowStaff]    = useState(false)
  const [showServices, setShowServices] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowStaff(true),    400)
    const t2 = setTimeout(() => setShowServices(true), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const STAFF = [
    { name: 'Roman',   role: 'Barber',    initials: 'R' },
    { name: 'Jonatan', role: 'Barber',    initials: 'J' },
    { name: 'Ross',    role: 'Colorist',  initials: 'R' },
  ]
  const SERVICES = [
    { name: 'Skin Fade',       duration: 45, price: 45 },
    { name: 'Beard Sculpting', duration: 30, price: 30 },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, animation: 'sceneIn 0.5s ease both' }}>
      <BrowserFrame>
        <div style={{ height: '100%', background: D, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Nav />
          <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px', display: 'flex', gap: 16 }}>
            {/* Staff column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Staff</span>
                <button style={{ background: G, color: '#000', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'default' }}>+ Add staff</button>
              </div>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 4, background: W5, borderRadius: 8, padding: 4, width: 'fit-content', flexShrink: 0 }}>
                {['Members', 'Schedule'].map((t, i) => (
                  <div key={t} style={{ padding: '4px 14px', borderRadius: 6, fontSize: 12, background: i === 0 ? W10 : 'transparent', color: i === 0 ? '#fff' : W40 }}>{t}</div>
                ))}
              </div>
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', gap: 7,
                opacity: showStaff ? 1 : 0, transform: showStaff ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.5s ease',
              }}>
                {STAFF.map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: W5, border: `1px solid ${W10}`, borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: D }}>{s.initials}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: W40 }}>{s.role}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Schedule', 'Edit', 'Remove'].map(btn => (
                        <button key={btn} style={{ fontSize: 11, color: W40, border: `1px solid ${W10}`, padding: '3px 8px', borderRadius: 5, background: 'transparent', cursor: 'default' }}>{btn}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: W10, flexShrink: 0 }} />

            {/* Services column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Services</span>
                <button style={{ background: G, color: '#000', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'default' }}>+ Add service</button>
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 7,
                opacity: showServices ? 1 : 0, transform: showServices ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.5s ease',
              }}>
                {SERVICES.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: W5, border: `1px solid ${W10}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: W40, marginTop: 2 }}>{s.duration} min</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: G }}>${s.price}</span>
                      {['Edit', 'Remove'].map(btn => (
                        <button key={btn} style={{ fontSize: 11, color: W40, border: `1px solid ${W10}`, padding: '3px 8px', borderRadius: 5, background: 'transparent', cursor: 'default' }}>{btn}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  )
}

// ── Scene 5 — Hero ────────────────────────────────────────────────────────────
function HeroScene() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: D,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 80px',
      animation: 'sceneIn 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both',
    }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: G, marginBottom: 18 }}>✂ Noble</div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 38, color: '#fff', lineHeight: 1.2, marginBottom: 18 }}>
        Stop managing.<br />Start growing.
      </h1>
      <p style={{ fontSize: 15, color: W40, marginBottom: 36, lineHeight: 1.7 }}>
        Bookings · Schedule · Analytics<br />all in one place.
      </p>
      <div style={{ fontWeight: 700, fontSize: 15, padding: '13px 34px', borderRadius: 10, background: G, color: D, boxShadow: `0 8px 28px ${G}55`, marginBottom: 14 }}>
        Start free at noblelink.app →
      </div>
      <div style={{ fontSize: 11.5, color: W20 }}>No credit card required</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'chaos',    label: 'Chaos'       },
  { id: 'overview', label: 'Overview'    },
  { id: 'calendar', label: 'Calendar'    },
  { id: 'live',     label: 'Live Booking'},
  { id: 'staff',    label: 'Staff'       },
  { id: 'hero',     label: 'Hero'        },
]
const SCENES   = [ChaosScene, OverviewScene, CalendarScene, LiveBookingScene, StaffServicesScene, HeroScene]
const DURATIONS = [7500, 6000, 5500, 5500, 5500, 5000]

export default function DemoStageDesktop() {
  const [step,       setStep]       = useState(0)
  const [auto,       setAuto]       = useState(false)
  const [resetKey,   setResetKey]   = useState(0)
  const [recordMode, setRecordMode] = useState(false)

  function handleRestart() { setAuto(false); setStep(0); setResetKey(k => k + 1) }

  useEffect(() => {
    if (!auto || recordMode) return
    const isLast = step === STEPS.length - 1
    const t = setTimeout(() => setStep(s => (s + 1) % STEPS.length), isLast ? 5000 : 2500)
    return () => clearTimeout(t)
  }, [step, auto, recordMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!new URLSearchParams(window.location.search).has('record')) return
    setRecordMode(true); setStep(0)
    let s = 0
    const advance = () => { s++; if (s >= STEPS.length) return; setStep(s); setTimeout(advance, DURATIONS[s]) }
    const t = setTimeout(advance, DURATIONS[0])
    return () => clearTimeout(t)
  }, [])

  const ActiveScene = SCENES[step]

  const frame = (
    <div style={{ width: 960, height: 600, position: 'relative', overflow: 'hidden', background: D, borderRadius: recordMode ? 0 : 12 }}>
      <style>{`@keyframes sceneIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <ActiveScene key={`${STEPS[step].id}-${resetKey}`} />
    </div>
  )

  if (recordMode) return frame

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '28px 24px 32px', gap: 18, background: '#111' }}>
      <style>{`@keyframes sceneIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)} style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', border: `1px solid ${i === step ? G : 'rgba(255,255,255,0.18)'}`, background: i === step ? G : 'transparent', color: i === step ? D : 'rgba(255,255,255,0.5)', fontWeight: i === step ? 700 : 400 }}>{s.label}</button>
        ))}
        <button onClick={() => setAuto(a => !a)} style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', border: `1px solid ${auto ? '#22c55e' : 'rgba(255,255,255,0.18)'}`, background: auto ? '#22c55e' : 'transparent', color: auto ? '#000' : 'rgba(255,255,255,0.5)', fontWeight: auto ? 700 : 400 }}>{auto ? '⏸ Auto' : '▶ Auto'}</button>
      </div>

      <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 28px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)' }}>
        {frame}
      </div>

      <button onClick={handleRestart} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 18px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Restart
      </button>

      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
        960×600 · <code style={{ opacity: 0.55 }}>?record</code> for clean capture
      </p>
    </div>
  )
}
