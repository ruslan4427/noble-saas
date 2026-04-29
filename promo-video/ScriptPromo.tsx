'use client'
// Script-driven mobile promo — 390×780, ?record for clean capture
// Scenes follow the marketing script line-by-line
import { useState, useEffect, useRef } from 'react'

const G   = '#C9A84C'
const D   = '#0F0A00'
const W5  = 'rgba(255,255,255,0.05)'
const W10 = 'rgba(255,255,255,0.10)'
const W20 = 'rgba(255,255,255,0.20)'
const W40 = 'rgba(255,255,255,0.40)'
const W60 = 'rgba(255,255,255,0.60)'
const W80 = 'rgba(255,255,255,0.80)'

// ── Caption — staggers lines in one by one ────────────────────────────────────
function Caption({
  lines, size = 18, color = '#fff', center = false, bold = false, delay = 400, lineDelay = 650,
}: {
  lines: string[]; size?: number; color?: string; center?: boolean; bold?: boolean; delay?: number; lineDelay?: number
}) {
  const [shown, setShown] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let n = 0
    const next = () => {
      n++; setShown(n)
      if (n < lines.length) { const t = setTimeout(next, lineDelay); timers.current.push(t) }
    }
    const t = setTimeout(next, delay); timers.current.push(t)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: center ? 'center' : 'left' }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize: line === '' ? 0 : size,
          lineHeight: 1.4,
          color: line.startsWith('__gold__') ? G : color,
          fontWeight: bold || i === 0 ? 700 : 400,
          opacity: i < shown ? 1 : 0,
          transform: i < shown ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          height: line === '' ? 8 : undefined,
        }}>
          {line.replace('__gold__', '')}
        </div>
      ))}
    </div>
  )
}

// ── Scene 0 — Pain Point ──────────────────────────────────────────────────────
const MSGS = [
  { from: 'Mike',   text: 'Hey, are you free tomorrow?',      time: '9:02 AM', delay: 0    },
  { from: 'Sarah',  text: 'Can I book Friday 5 PM?',          time: '9:18 AM', delay: 550  },
  { from: 'Alex',   text: 'What are your hours again?',       time: '10:05',   delay: 1050 },
  { from: 'Anna',   text: 'Did you get my message?? 😤',      time: '10:34',   delay: 1500 },
  { from: 'Carlos', text: 'Need an appointment ASAP please',  time: '11:12',   delay: 1950 },
]
const BUBBLECLR = ['#e03050', '#0077cc', '#0a8a60', '#a55000', '#6030aa']

function PainScene() {
  const [count,      setCount]      = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    MSGS.forEach((m, i) => { const t = setTimeout(() => setCount(i + 1), m.delay); timers.current.push(t) })
    const t1 = setTimeout(() => setShowOverlay(true), 3600); timers.current.push(t1)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, animation: 'sceneIn 0.5s ease both', overflow: 'hidden' }}>
      {/* WhatsApp-style messenger */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {/* Header */}
        <div style={{ background: '#075e54', padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontFamily: 'serif' }}>✂</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Bookings inbox</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>
              {count > 0 ? `${count} unread message${count > 1 ? 's' : ''}` : 'online'}
            </div>
          </div>
          {count >= 3 && (
            <div style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, animation: 'popIn 0.3s cubic-bezier(0.34,1.5,0.64,1) both' }}>
              {count} new
            </div>
          )}
        </div>
        {/* Chat area */}
        <div style={{ flex: 1, background: '#e5ddd5', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {MSGS.slice(0, count).map((m, i) => (
            <div key={m.from} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', animation: 'msgPop 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: BUBBLECLR[i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                {m.from[0]}
              </div>
              <div style={{ background: '#fff', borderRadius: '2px 14px 14px 14px', padding: '8px 12px', maxWidth: '78%', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#075e54', marginBottom: 2 }}>{m.from}</div>
                <div style={{ fontSize: 13.5, color: '#202020', lineHeight: 1.4 }}>{m.text}</div>
                <div style={{ fontSize: 10, color: '#aaa', textAlign: 'right', marginTop: 3 }}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dark overlay with script text */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15,10,0,0.93)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '0 36px',
        opacity: showOverlay ? 1 : 0, transition: 'opacity 0.75s ease',
        textAlign: 'center',
      }}>
        {showOverlay && (
          <Caption
            lines={[
              'Still booking clients',
              'through messages and calls?',
              '',
              "It's slow, messy…",
              'and easy to lose customers.',
            ]}
            size={21} center delay={100} lineDelay={700}
          />
        )}
      </div>

      <style>{`
        @keyframes msgPop { from { opacity:0; transform:scale(0.82) translateX(-8px); } to { opacity:1; transform:scale(1) translateX(0); } }
        @keyframes popIn  { from { opacity:0; transform:scale(0.6); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  )
}

// ── Scene 1 — Meet Noble ──────────────────────────────────────────────────────
function MeetNobleScene() {
  const [showText, setShowText] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShowText(true), 900); return () => clearTimeout(t) }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0, background: D,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 40px', animation: 'sceneIn 0.5s ease both',
    }}>
      {/* Scissors icon */}
      <div style={{ fontSize: 14, color: `${G}88`, letterSpacing: 6, marginBottom: 10, animation: 'fadeUp 0.6s ease 0.2s both' }}>— — —</div>
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 56, color: G,
        textShadow: `0 0 50px ${G}99, 0 0 100px ${G}44`,
        animation: 'logoIn 0.9s cubic-bezier(0.25,0.46,0.45,0.94) both',
        marginBottom: 32,
      }}>
        ✂ Noble
      </div>
      {showText && (
        <Caption
          lines={[
            'Meet Noble',
            'A simple booking system',
            'made for salons and barbers.',
          ]}
          size={20} color={W80} center delay={0} lineDelay={700}
        />
      )}
      <style>{`
        @keyframes logoIn  { from { opacity:0; transform:scale(0.6) translateY(14px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}

// ── Scene 2 — Setup ────────────────────────────────────────────────────────────
const SVCLIST = [
  { name: 'Skin Fade',       meta: '45 min · $45' },
  { name: 'Beard Sculpting', meta: '30 min · $30' },
]
const STAFFLIST = [
  { name: 'Roman',   role: 'Barber'   },
  { name: 'Jonatan', role: 'Barber'   },
  { name: 'Ross',    role: 'Colorist' },
]

function SetupScene() {
  const [showSvc,   setShowSvc]   = useState(false)
  const [showStaff, setShowStaff] = useState(false)
  const [showReady, setShowReady] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t1 = setTimeout(() => setShowSvc(true),   350);  timers.current.push(t1)
    const t2 = setTimeout(() => setShowStaff(true), 1300); timers.current.push(t2)
    const t3 = setTimeout(() => setShowReady(true), 2400); timers.current.push(t3)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, background: D, display: 'flex', flexDirection: 'column', animation: 'sceneIn 0.5s ease both' }}>
      {/* Header */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${W10}`, flexShrink: 0 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: G }}>✂ Noble</div>
        <div style={{ fontSize: 12, color: W40, marginTop: 3 }}>Setup · Chop-Chop Barbershop</div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Services */}
        <div style={{ opacity: showSvc ? 1 : 0, transform: showSvc ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.55s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: W40, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Services</div>
          {SVCLIST.map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: W5, border: `1px solid ${W10}`, borderRadius: 12, padding: '12px 16px', marginBottom: 7,
              animation: 'slideR 0.4s ease both', animationDelay: `${0.35 + i * 0.15}s`, opacity: 0,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.name}</span>
              <span style={{ fontSize: 12, color: W40 }}>{s.meta}</span>
            </div>
          ))}
        </div>

        {/* Staff */}
        <div style={{ opacity: showStaff ? 1 : 0, transform: showStaff ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.55s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: W40, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Staff</div>
          {STAFFLIST.map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: W5, border: `1px solid ${W10}`, borderRadius: 12, padding: '10px 16px', marginBottom: 7,
              animation: 'slideR 0.4s ease both', animationDelay: `${1.3 + i * 0.12}s`, opacity: 0,
            }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: D, flexShrink: 0 }}>{s.name[0]}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: W40 }}>{s.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ready badge */}
        {showReady && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, border: `1px solid ${G}44`, background: `${G}0d`, animation: 'sceneIn 0.4s ease both' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: D, fontWeight: 700, flexShrink: 0 }}>✓</div>
            <span style={{ fontSize: 13.5, color: G, fontWeight: 600 }}>Your booking page is ready!</span>
          </div>
        )}
      </div>
      <style>{`@keyframes slideR { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  )
}

// ── Scene 3 — Share Link ───────────────────────────────────────────────────────
const LINK_URL = 'noblelink.app/noble-barber'

function ShareLinkScene() {
  const [showCard,   setShowCard]   = useState(false)
  const [urlLen,     setUrlLen]     = useState(0)
  const [copied,     setCopied]     = useState(false)
  const [showCaption, setShowCaption] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t1 = setTimeout(() => setShowCard(true), 350); timers.current.push(t1)
    let n = 0
    const typeChar = () => {
      n++; setUrlLen(n)
      if (n < LINK_URL.length) { const t = setTimeout(typeChar, 55); timers.current.push(t) }
      else {
        const t2 = setTimeout(() => setCopied(true),      500);  timers.current.push(t2)
        const t3 = setTimeout(() => setShowCaption(true), 1100); timers.current.push(t3)
      }
    }
    const t0 = setTimeout(typeChar, 800); timers.current.push(t0)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0, background: D,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 28px', animation: 'sceneIn 0.5s ease both',
    }}>
      {/* Section heading */}
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: G, marginBottom: 30, opacity: showCard ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        Your Booking Link
      </div>

      {/* Link card */}
      <div style={{
        width: '100%', background: W5,
        border: `1.5px solid ${copied ? G : W20}`,
        borderRadius: 20, padding: '22px 20px',
        boxShadow: copied ? `0 0 32px ${G}44, 0 0 70px ${G}22` : 'none',
        transition: 'all 0.55s ease',
        opacity: showCard ? 1 : 0,
        transform: showCard ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
      }}>
        <div style={{ fontSize: 11, color: W40, marginBottom: 10 }}>Share this link with your clients</div>
        <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, color: G }}>
            {LINK_URL.slice(0, urlLen)}
            {urlLen < LINK_URL.length && (
              <span style={{ borderRight: `2px solid ${G}`, marginLeft: 1 }}>&nbsp;</span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1, background: G, color: '#000', fontSize: 15, fontWeight: 700,
            padding: '13px', borderRadius: 12, border: 'none', cursor: 'default',
            boxShadow: copied ? `0 6px 22px ${G}55` : 'none', transition: 'all 0.4s ease',
          }}>
            {copied ? '✓ Link Copied!' : 'Copy Link'}
          </button>
          <button style={{ padding: '13px 15px', borderRadius: 12, border: `1px solid ${W20}`, background: 'transparent', color: W60, fontSize: 14, cursor: 'default' }}>
            ↗
          </button>
        </div>
      </div>

      {/* Caption */}
      {showCaption && (
        <div style={{ marginTop: 34, width: '100%', textAlign: 'center' }}>
          <Caption
            lines={['Just share your link —', 'clients book anytime, 24/7.']}
            size={17} color={W60} center delay={0}
          />
        </div>
      )}
    </div>
  )
}

// ── Scene 4 — No Calls ─────────────────────────────────────────────────────────
function NoCallsScene() {
  const [step, setStep] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 550);  timers.current.push(t1)
    const t2 = setTimeout(() => setStep(2), 1500); timers.current.push(t2)
    const t3 = setTimeout(() => setStep(3), 2600); timers.current.push(t3)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  const ITEMS = [
    { icon: '📞', label: 'No calls.',             gone: true  },
    { icon: '💬', label: 'No back-and-forth.',     gone: true  },
    { icon: '✂',  label: 'Just Noble.',            gone: false, gold: true },
    { icon: '🕐', label: 'Clients book 24/7.',     gone: false },
  ]

  return (
    <div style={{
      position: 'absolute', inset: 0, background: D,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 36px', animation: 'sceneIn 0.5s ease both',
    }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ITEMS.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 18,
            opacity: i < step ? 1 : 0,
            transform: i < step ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: item.gold ? G : W10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {item.icon}
            </div>
            <span style={{
              fontSize: 24, fontWeight: 700,
              color: item.gold ? G : '#fff',
              position: 'relative',
              opacity: item.gone && step >= 3 ? 0.3 : 1,
              transition: 'opacity 0.5s ease',
            }}>
              {item.label}
              {item.gone && step >= 3 && (
                <span style={{
                  position: 'absolute', left: 0, right: 0, top: '50%',
                  height: 2, background: W40,
                  transform: 'translateY(-50%)',
                }} />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scene 5 — Booking Flow ─────────────────────────────────────────────────────
const TIMESLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM']

function BookingFlowScene() {
  const [hoverIdx,   setHoverIdx]   = useState(-1)
  const [selected,   setSelected]   = useState<string | null>(null)
  const [phase,      setPhase]      = useState<'slots' | 'confirm' | 'done'>('slots')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let idx = 0
    const hover = () => {
      setHoverIdx(idx); idx++
      if (idx <= 2) { const t = setTimeout(hover, 750); timers.current.push(t) }
      else {
        const t1 = setTimeout(() => { setHoverIdx(2); setSelected('10:00 AM') }, 800)
        const t2 = setTimeout(() => setPhase('confirm'), 1800)
        const t3 = setTimeout(() => setPhase('done'),    3500)
        timers.current.push(t1, t2, t3)
      }
    }
    const t0 = setTimeout(hover, 600); timers.current.push(t0)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f5f0e8', animation: 'sceneIn 0.5s ease both', display: 'flex', flexDirection: 'column' }}>
      {/* Booking page header */}
      <div style={{ background: '#1a1208', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: G }}>✂ Noble</div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>|</span>
        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>Chop-Chop Barbershop</span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Slot selection */}
        {phase === 'slots' && (
          <div style={{ padding: '22px 20px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1208', marginBottom: 4 }}>Choose a time</div>
            <div style={{ fontSize: 12.5, color: '#9c8b7a', marginBottom: 20 }}>Skin Fade · Roman · Mon Apr 28</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TIMESLOTS.map((slot, i) => {
                const isHover = i === hoverIdx
                const isSel   = slot === selected
                return (
                  <div key={slot} style={{
                    padding: '14px 10px', borderRadius: 14, textAlign: 'center',
                    fontSize: 14.5, fontWeight: 500,
                    border: `1.5px solid ${isSel ? '#C9A84C' : isHover ? '#C9A84C' : '#e8dfc9'}`,
                    background: isSel ? '#C9A84C' : isHover ? 'rgba(201,168,76,0.14)' : '#fff',
                    color: isSel ? '#000' : '#1a1208',
                    transition: 'all 0.5s ease',
                    boxShadow: isSel ? '0 4px 18px rgba(201,168,76,0.4)' : 'none',
                  }}>{slot}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* Confirm screen */}
        {phase === 'confirm' && (
          <div style={{ padding: '22px 20px', animation: 'sceneIn 0.4s ease both' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1208', marginBottom: 20 }}>Confirm booking</div>
            {[
              ['Service', 'Skin Fade'],
              ['Staff',   'Roman'],
              ['Date',    'Mon, Apr 28'],
              ['Time',    '10:00 AM'],
              ['Price',   '$45'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #e8dfc9' }}>
                <span style={{ fontSize: 13.5, color: '#9c8b7a' }}>{k}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1208' }}>{v}</span>
              </div>
            ))}
            <button style={{ width: '100%', marginTop: 24, background: '#C9A84C', color: '#000', fontWeight: 700, fontSize: 17, padding: '15px', borderRadius: 16, border: 'none', cursor: 'default', boxShadow: '0 6px 24px rgba(201,168,76,0.45)' }}>
              Book Now
            </button>
          </div>
        )}

        {/* Done screen */}
        {phase === 'done' && (
          <div style={{ padding: '28px 20px', animation: 'sceneIn 0.4s ease both', textAlign: 'center' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', margin: '0 auto 18px',
              border: '2px solid #C9A84C', background: 'rgba(201,168,76,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, animation: 'successRing 0.6s ease both',
            }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1208', marginBottom: 6 }}>Booking confirmed!</div>
            <div style={{ fontSize: 13.5, color: '#9c8b7a', marginBottom: 28 }}>Confirmation sent to your email</div>
            {/* Fake email */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8dfc9', padding: '16px 18px', textAlign: 'left', animation: 'slideUp 0.45s ease 0.3s both', opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1208', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'serif', color: '#C9A84C' }}>✂</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1208' }}>Noble Bookings</div>
                  <div style={{ fontSize: 11, color: '#9c8b7a' }}>noreply@noblelink.app</div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1208', marginBottom: 6 }}>Your appointment is confirmed ✓</div>
              <div style={{ fontSize: 12.5, color: '#6b5744', lineHeight: 1.6 }}>
                <b>Skin Fade</b> with Roman<br />
                Mon Apr 28 · 10:00 AM · $45<br />
                Chop-Chop Barbershop
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes successRing { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
        @keyframes slideUp     { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}

// ── Scene 6 — Organized ────────────────────────────────────────────────────────
const ORG_STATS = [
  { label: 'Today',     value: '7',      sub: 'bookings' },
  { label: 'This week', value: '34',     sub: 'bookings' },
  { label: 'Revenue',   value: '$1,230', sub: 'this week' },
]
const ORG_ROWS = [
  { client: 'John D.',  service: 'Skin Fade',       time: '10:00 AM', staff: 'Roman'   },
  { client: 'Sarah K.', service: 'Beard Sculpting', time: '11:00 AM', staff: 'Jonatan' },
  { client: 'Mike T.',  service: 'Skin Fade',       time: '2:30 PM',  staff: 'Roman'   },
  { client: 'Anna R.',  service: 'Beard Sculpting', time: '4:00 PM',  staff: 'Ross'    },
]

function OrganizedScene() {
  const [showStats, setShowStats] = useState(false)
  const [showRows,  setShowRows]  = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t1 = setTimeout(() => setShowStats(true), 350);  timers.current.push(t1)
    const t2 = setTimeout(() => setShowRows(true),  1000); timers.current.push(t2)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, background: D, display: 'flex', flexDirection: 'column', animation: 'sceneIn 0.5s ease both' }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${W10}`, flexShrink: 0 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: G }}>✂ Noble</div>
        <div style={{ fontSize: 12, color: W40, marginTop: 3 }}>Dashboard · Today</div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, opacity: showStats ? 1 : 0, transform: showStats ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.55s ease' }}>
          {ORG_STATS.map(s => (
            <div key={s.label} style={{ background: W5, border: `1px solid ${W10}`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: G, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: W40, marginTop: 4, lineHeight: 1.3 }}>{s.label}<br />{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Today header */}
        <div style={{ opacity: showRows ? 1 : 0, transition: 'opacity 0.4s ease' }}>
          <div style={{ padding: '5px 0', borderBottom: `1px solid ${W10}` }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: G, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today's bookings</span>
          </div>
        </div>

        {/* Rows */}
        {ORG_ROWS.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: W5, border: `1px solid ${W10}`, borderRadius: 12, padding: '11px 16px',
            flexShrink: 0,
            opacity: showRows ? 1 : 0,
            transform: showRows ? 'translateX(0)' : 'translateX(-18px)',
            transition: `opacity 0.45s ease ${1.0 + i * 0.11}s, transform 0.45s ease ${1.0 + i * 0.11}s`,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: D, flexShrink: 0 }}>{r.client[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.client}</div>
              <div style={{ fontSize: 11.5, color: W40 }}>{r.service} · {r.staff}</div>
            </div>
            <span style={{ fontSize: 12, color: W60, flexShrink: 0 }}>{r.time}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#4ade80', flexShrink: 0 }}>✓</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scene 7 — CTA ─────────────────────────────────────────────────────────────
function CTAScene() {
  const [p, setP] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t1 = setTimeout(() => setP(1), 500);  timers.current.push(t1)
    const t2 = setTimeout(() => setP(2), 1200); timers.current.push(t2)
    const t3 = setTimeout(() => setP(3), 2000); timers.current.push(t3)
    const t4 = setTimeout(() => setP(4), 2800); timers.current.push(t4)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0, background: D,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 36px', animation: 'sceneIn 0.5s ease both', textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 52, color: G, marginBottom: 30,
        textShadow: `0 0 50px ${G}99, 0 0 100px ${G}44`,
        opacity: p >= 1 ? 1 : 0, transform: p >= 1 ? 'scale(1)' : 'scale(0.75)',
        transition: 'all 0.65s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>✂ Noble</div>

      {/* Headline */}
      <div style={{
        fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 14,
        opacity: p >= 2 ? 1 : 0, transform: p >= 2 ? 'translateY(0)' : 'translateY(14px)',
        transition: 'all 0.5s ease',
      }}>
        Start your free<br />booking page today.
      </div>

      {/* Subline */}
      <div style={{
        fontSize: 15, color: W40, lineHeight: 1.6, marginBottom: 42,
        opacity: p >= 3 ? 1 : 0, transition: 'opacity 0.5s ease',
      }}>
        Noble — simple booking<br />for modern salons.
      </div>

      {/* CTA button */}
      <div style={{
        width: '100%',
        background: G, color: '#000', fontWeight: 700, fontSize: 18,
        padding: '17px', borderRadius: 18,
        boxShadow: `0 10px 36px ${G}66, 0 0 70px ${G}22`,
        opacity: p >= 4 ? 1 : 0,
        transform: p >= 4 ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
        transition: 'all 0.55s cubic-bezier(0.34,1.2,0.64,1)',
      }}>
        Get started free →
      </div>

      <div style={{ fontSize: 12, color: W20, marginTop: 16, opacity: p >= 4 ? 1 : 0, transition: 'opacity 0.5s ease 0.3s' }}>
        noblelink.app · No credit card required
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'pain',    label: 'Pain'    },
  { id: 'intro',   label: 'Intro'   },
  { id: 'setup',   label: 'Setup'   },
  { id: 'link',    label: 'Link'    },
  { id: 'nocalls', label: 'No Calls'},
  { id: 'booking', label: 'Booking' },
  { id: 'dash',    label: 'Dash'    },
  { id: 'cta',     label: 'CTA'     },
]
const SCENES    = [PainScene, MeetNobleScene, SetupScene, ShareLinkScene, NoCallsScene, BookingFlowScene, OrganizedScene, CTAScene]
const DURATIONS = [8500,      5500,           6500,       6000,           5000,         7500,             6000,           7000]

export default function ScriptPromo() {
  const [step,       setStep]       = useState(0)
  const [auto,       setAuto]       = useState(false)
  const [resetKey,   setResetKey]   = useState(0)
  const [recordMode, setRecordMode] = useState(false)

  function handleRestart() { setAuto(false); setStep(0); setResetKey(k => k + 1) }

  // Auto advance — 6s hold on last scene
  useEffect(() => {
    if (!auto || recordMode) return
    const isLast = step === STEPS.length - 1
    const t = setTimeout(() => setStep(s => (s + 1) % STEPS.length), isLast ? 6000 : 2500)
    return () => clearTimeout(t)
  }, [step, auto, recordMode])

  // Record mode — advances by DURATIONS
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

  const phoneFrame = (
    <div style={{
      width: 390, height: 780,
      position: 'relative', overflow: 'hidden',
      background: D,
      borderRadius: recordMode ? 0 : 50,
      boxShadow: recordMode ? 'none' : `0 0 0 10px #1c1c1c, 0 0 0 12px #2a2a2a, 0 50px 100px rgba(0,0,0,0.75)`,
    }}>
      {/* Status bar (hidden in record) */}
      {!recordMode && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px 0', pointerEvents: 'none' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
          <div style={{ width: 100, height: 24, borderRadius: 20, background: '#000' }} />
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>●●●</span>
          </div>
        </div>
      )}
      <style>{`@keyframes sceneIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <ActiveScene key={`${STEPS[step].id}-${resetKey}`} />
    </div>
  )

  if (recordMode) return phoneFrame

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '28px 24px 40px', gap: 22, background: '#111' }}>
      <style>{`@keyframes sceneIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Scene nav */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STEPS.map((s, i) => (
          <button key={s.id}
            onClick={() => { setStep(i); setResetKey(k => k + 1) }}
            style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${i === step ? G : 'rgba(255,255,255,0.18)'}`, background: i === step ? G : 'transparent', color: i === step ? D : 'rgba(255,255,255,0.5)', fontWeight: i === step ? 700 : 400 }}>
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setAuto(a => !a)}
          style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${auto ? '#22c55e' : 'rgba(255,255,255,0.18)'}`, background: auto ? '#22c55e' : 'transparent', color: auto ? '#000' : 'rgba(255,255,255,0.5)', fontWeight: auto ? 700 : 400 }}>
          {auto ? '⏸ Auto' : '▶ Auto'}
        </button>
      </div>

      {phoneFrame}

      <button onClick={handleRestart} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 20px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Restart
      </button>

      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
        390×780 · <code style={{ opacity: 0.55 }}>?record</code> for clean 1:1 capture
      </p>
    </div>
  )
}
