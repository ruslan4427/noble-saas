'use client'
// Promo video frame — 1080×1920 (TikTok / Instagram Reels)
// Preview in browser at 1/3 scale; record at 1080×1920 in DevTools device emulation
import { useState, useEffect, useRef } from 'react'

// ── Noble brand tokens (mirrors globals.css @theme) ──────────────────────────
const B = {
  black:     'var(--color-noble-black)',    // #0F0A00  — landing bg
  dark:      'var(--color-noble-dark)',     // #1a1208  — header / primary text
  cream:     'var(--color-noble-cream)',    // #f5f0e8  — booking page bg
  gold:      'var(--color-noble-gold)',     // #C9A84C  — accent / CTA
  goldHover: 'var(--color-noble-gold-hover)', // #e8d08a
  border:    'var(--color-noble-border)',   // #e8dfc9  — card borders
  secondary: 'var(--color-noble-text-secondary)', // #6b5744
  muted:     'var(--color-noble-text-muted)',     // #9c8b7a
} as const

// Raw hex values for use in boxShadow / filter (CSS vars don't work there)
const HEX = {
  gold:  '#C9A84C',
  dark:  '#1a1208',
  black: '#0F0A00',
}

// ── Chaos messages ───────────────────────────────────────────────────────────
const MESSAGES = [
  { from: 'Mike',    text: 'Are you free tomorrow?',       avatar: '👨🏻',  delay: 0,    x: 8,   rotate: -2 },
  { from: 'Sarah',   text: 'Can I book for 5 PM?',         avatar: '👩🏼',  delay: 600,  x: 12,  rotate: 1.5 },
  { from: 'Alex',    text: 'Hey, any slots today?',        avatar: '👦🏽',  delay: 1200, x: 6,   rotate: -1 },
  { from: 'Anna',    text: 'What time are you open?',      avatar: '👧🏻',  delay: 1800, x: 14,  rotate: 2 },
  { from: 'Carlos',  text: 'Book me for Wednesday pls',    avatar: '🧔🏾',  delay: 2400, x: 5,   rotate: -3 },
  { from: 'Julia',   text: 'Can I come at 3?',             avatar: '👩🏽',  delay: 2900, x: 10,  rotate: 1 },
  { from: 'Tom',     text: 'Are you free Saturday?',       avatar: '🧑🏼',  delay: 3300, x: 7,   rotate: -1.5 },
  { from: 'Nina',    text: 'Forgot to confirm yesterday',  avatar: '👩🏻',  delay: 3700, x: 13,  rotate: 2.5 },
]

const STEPS = [
  { id: 'chaos',   label: 'Chaos' },
  { id: 'link',    label: 'Link' },
  { id: 'hero',    label: 'Hero' },
  { id: 'booking', label: 'Booking' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'done',    label: 'Done' },
]

// ── Chaos slide component ─────────────────────────────────────────────────────
function ChaosSlide() {
  const [visibleCount, setVisibleCount]   = useState(0)
  const [fadeOut, setFadeOut]             = useState(false)
  const [showLogo, setShowLogo]           = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    MESSAGES.forEach((msg, i) => {
      const t = setTimeout(() => setVisibleCount(i + 1), msg.delay)
      timerRef.current.push(t)
    })
    const tFade = setTimeout(() => setFadeOut(true), 4800)
    const tLogo = setTimeout(() => setShowLogo(true), 5600)
    timerRef.current.push(tFade, tLogo)
    return () => timerRef.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: '#1a1a2e' }}>
      {/* Messenger header */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white text-base font-bold">W</div>
        <div>
          <div className="text-white text-sm font-semibold">Barber Chat 💬</div>
          <div className="text-white/40 text-xs">8 unread messages</div>
        </div>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-red-400" />
        </div>
      </div>

      {/* Messages pile */}
      <div
        className="relative flex-1 overflow-hidden transition-opacity duration-700"
        style={{ opacity: fadeOut ? 0 : 1 }}
      >
        {MESSAGES.slice(0, visibleCount).map((msg, i) => (
          <div
            key={msg.from}
            className="absolute flex items-start gap-2.5 px-4 py-3 rounded-2xl max-w-[85%]"
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              top: 16 + i * 52,
              left: `${msg.x}%`,
              transform: `rotate(${msg.rotate}deg)`,
              animation: 'msgDrop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
              opacity: 0,
            }}
          >
            <span className="text-xl flex-none">{msg.avatar}</span>
            <div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: HEX.gold }}>{msg.from}</div>
              <div className="text-white text-xs leading-snug">{msg.text}</div>
            </div>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
        ))}

        {visibleCount >= 4 && !fadeOut && (
          <div
            className="absolute bottom-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: '#ef4444', color: '#fff', animation: 'msgDrop 0.3s ease forwards', opacity: 0 }}
          >
            {visibleCount} new
          </div>
        )}
      </div>

      {/* Noble logo reveal */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 transition-opacity duration-700"
        style={{ opacity: showLogo ? 1 : 0, pointerEvents: showLogo ? 'auto' : 'none' }}
      >
        <div className="font-serif text-4xl mb-3" style={{ color: HEX.gold }}>✂ Noble</div>
        <p className="text-white/60 text-base leading-relaxed">
          No more chaos.<br />Clients book online.<br />You just show up.
        </p>
      </div>

      <style>{`
        @keyframes msgDrop {
          from { opacity: 0; transform: translateY(-18px) rotate(inherit); }
          to   { opacity: 1; transform: translateY(0) rotate(inherit); }
        }
      `}</style>
    </div>
  )
}

// ── Link slide component ──────────────────────────────────────────────────────
function LinkSlide() {
  const [showCard, setShowCard]     = useState(false)
  const [showLink, setShowLink]     = useState(false)
  const [cursorPos, setCursorPos]   = useState({ x: 180, y: 320 })
  const [clicking, setClicking]     = useState(false)
  const [copied, setCopied]         = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const add = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms); timers.current.push(t)
    }
    add(() => setShowCard(true),  300)
    add(() => setShowLink(true),  1000)
    add(() => setCursorPos({ x: 258, y: 298 }), 2000)
    add(() => setClicking(true),  2800)
    add(() => setClicking(false), 3100)
    add(() => setCopied(true),    3100)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-7"
      style={{ background: B.dark }}
    >
      {/* Section label */}
      <p
        className="text-xs font-bold tracking-widest uppercase mb-5 transition-opacity duration-500"
        style={{ color: B.gold, opacity: showCard ? 1 : 0 }}
      >
        Your Booking Link
      </p>

      {/* Card — slides up + gold glow on appear */}
      <div
        className="w-full rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${showCard ? `${HEX.gold}40` : 'rgba(255,255,255,0.1)'}`,
          boxShadow: showCard
            ? `0 0 48px ${HEX.gold}22, 0 0 96px ${HEX.gold}0e, 0 8px 32px rgba(0,0,0,0.5)`
            : '0 8px 32px rgba(0,0,0,0.5)',
          transform: showCard ? 'translateY(0)' : 'translateY(32px)',
          opacity: showCard ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.55s ease, box-shadow 0.8s ease, border-color 0.8s ease',
        }}
      >
        <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Share this link with clients
        </div>

        {/* Link row */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-3"
          style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid rgba(255,255,255,0.08)` }}
        >
          <span className="text-sm font-mono flex-1 overflow-hidden whitespace-nowrap" style={{ color: B.gold }}>
            {showLink
              ? <TypeWriter text="noblelink.app/noble-barber" speed={45} />
              : <span className="opacity-0">_</span>
            }
          </span>
          {/* Copy button */}
          <button
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{
              background: clicking ? HEX.gold : `${HEX.gold}26`,
              color: clicking ? HEX.dark : HEX.gold,
              border: `1px solid ${HEX.gold}80`,
              boxShadow: clicking ? `0 0 12px ${HEX.gold}60` : 'none',
              transform: clicking ? 'scale(0.91)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            Copy
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          {['Open ↗', 'Share →'].map(label => (
            <div
              key={label}
              className="flex-1 text-center text-xs py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Animated cursor */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: cursorPos.x,
          top:  cursorPos.y,
          transitionDuration: '900ms',
          transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
          transitionProperty: 'left, top',
          opacity: showCard ? 1 : 0,
          filter: clicking ? `drop-shadow(0 0 8px ${HEX.gold})` : 'none',
          transform: clicking ? 'scale(0.82)' : 'scale(1)',
          transition: clicking
            ? 'transform 0.12s ease, filter 0.12s ease, left 900ms cubic-bezier(0.4,0,0.2,1), top 900ms cubic-bezier(0.4,0,0.2,1)'
            : 'left 900ms cubic-bezier(0.4,0,0.2,1), top 900ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 2L18 11L11 13L8 20L4 2Z" fill="white" stroke={B.dark} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* "Link Copied!" toast */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap"
        style={{
          background: B.dark,
          border: `1.5px solid ${HEX.gold}`,
          color: B.gold,
          boxShadow: copied ? `0 0 32px ${HEX.gold}60, 0 0 64px ${HEX.gold}25` : 'none',
          opacity: copied ? 1 : 0,
          transform: copied ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
          transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Link Copied!
      </div>

      {/* Ambient glow behind toast */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 h-10 rounded-full blur-2xl"
        style={{
          background: HEX.gold,
          opacity: copied ? 0.3 : 0,
          transition: 'opacity 0.7s ease',
        }}
      />

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}

// ── Typewriter helper ─────────────────────────────────────────────────────────
function TypeWriter({ text, speed }: { text: string; speed: number }) {
  const [displayed, setDisplayed] = useState('')
  const i = useRef(0)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    i.current = 0
    setDisplayed('')
    const tick = () => {
      if (i.current >= text.length) return
      i.current++
      setDisplayed(text.slice(0, i.current))
      setTimeout(tick, speed)
    }
    setTimeout(tick, speed)
  }, [text, speed])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ animation: 'blink 0.7s step-end infinite', borderRight: `2px solid currentColor` }}>&nbsp;</span>
      )}
    </>
  )
}

// ── Static scene components ───────────────────────────────────────────────────
function HeroScene() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{ background: B.black, animation: 'sceneIn 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
    >
      <div className="font-serif text-3xl mb-2" style={{ color: B.gold }}>✂ Noble</div>
      <h1 className="font-serif font-bold text-4xl leading-tight mb-4 text-white">
        Still booking<br />in DMs?
      </h1>
      <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
        Stop losing clients to slow replies.
      </p>
      {/* Primary CTA — gold accent + glow */}
      <button
        className="font-bold text-lg px-10 py-4 rounded-2xl"
        style={{
          background: HEX.gold,
          color: HEX.dark,
          boxShadow: `0 8px 32px ${HEX.gold}55, 0 2px 8px ${HEX.gold}40`,
        }}
      >
        Book online →
      </button>
      <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>noblelink.app</p>
    </div>
  )
}

const SERVICES = [
  { name: 'Skin Fade',       price: '$45', duration: '45 min' },
  { name: 'Beard Sculpting', price: '$30', duration: '30 min' },
]

function BookingScene() {
  // Animate service selection then slot selection so each step is easy to follow
  const [selectedService, setSelectedService] = useState(-1)
  const [selectedSlot,    setSelectedSlot]    = useState(-1)

  useEffect(() => {
    const t1 = setTimeout(() => setSelectedService(0), 500)
    const t2 = setTimeout(() => setSelectedSlot(3),    1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const DATES = ['Mon 28','Tue 29','Wed 30','Thu 1','Fri 2']
  const SLOTS = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM']
  const STAFF = ['Roman','Jonatan','Ross']

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: B.cream, animation: 'sceneIn 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
    >
      <div className="px-6 pt-10 pb-4" style={{ background: B.dark }}>
        <div className="text-xs font-bold mb-1" style={{ color: B.gold }}>✂ NOBLE BARBER</div>
        <div className="text-white font-serif text-xl font-bold">Book a service</div>
      </div>

      {/* Service selector */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        {SERVICES.map((s, i) => {
          const active = i === selectedService
          return (
            <div
              key={s.name}
              className="flex-1 rounded-xl px-3 py-2.5"
              style={{
                transition: 'background 0.55s ease, box-shadow 0.55s ease, border-color 0.55s ease',
                background: active ? HEX.gold : '#fff',
                border: `1.5px solid ${active ? HEX.gold : B.border}`,
                boxShadow: active ? `0 4px 14px ${HEX.gold}45` : 'none',
              }}
            >
              <div className="text-xs font-bold" style={{ color: active ? HEX.dark : B.dark }}>{s.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: active ? `${HEX.dark}99` : B.muted }}>{s.price} · {s.duration}</div>
            </div>
          )
        })}
      </div>

      {/* Date strip */}
      <div className="flex gap-2 px-4 py-2">
        {DATES.map((d, i) => (
          <div
            key={d}
            className="flex-1 rounded-xl py-2 text-center text-xs font-medium"
            style={i === 1
              ? { background: HEX.gold, color: HEX.dark, boxShadow: `0 4px 12px ${HEX.gold}40` }
              : { background: '#fff', color: B.dark, border: `1px solid ${B.border}` }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Slot grid — selection transitions slowly at 0.65s so it reads clearly on video */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {SLOTS.map((t, i) => {
          const isSelected = i === selectedSlot
          const isBooked   = i === 6
          return (
            <div
              key={t}
              className="rounded-xl py-3 text-center text-xs font-medium"
              style={{
                transition: 'background 0.65s ease, color 0.65s ease, box-shadow 0.65s ease',
                ...(isSelected
                  ? { background: HEX.gold, color: HEX.dark, fontWeight: 700, boxShadow: `0 4px 16px ${HEX.gold}50` }
                  : isBooked
                  ? { background: '#f0ebe0', color: '#c8bfb0', textDecoration: 'line-through' }
                  : { background: '#fff', border: `1px solid ${B.border}`, color: B.dark }),
              }}
            >
              {t}
            </div>
          )
        })}
      </div>

      {/* Staff */}
      <div className="px-4 mt-3">
        <div className="text-xs font-medium mb-2" style={{ color: B.muted }}>SPECIALIST</div>
        <div className="flex gap-2">
          {STAFF.map((n, i) => (
            <div
              key={n}
              className="flex-1 rounded-xl py-2.5 text-center text-xs font-medium border"
              style={i === 0
                ? { background: B.dark, color: '#fff', borderColor: B.dark }
                : { background: '#fff', color: B.dark, borderColor: B.border }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfirmScene() {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: B.cream, animation: 'sceneIn 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
    >
      <div className="px-6 pt-10 pb-5" style={{ background: B.dark }}>
        <div className="text-xs font-bold mb-1" style={{ color: B.gold }}>✂ CHOP-CHOP</div>
        <div className="text-white font-serif text-xl font-bold">Confirm booking</div>
        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Almost done — just a few details</div>
      </div>
      <div className="px-5 py-4 space-y-3 flex-1">
        <div className="bg-white rounded-2xl p-4 text-sm space-y-1.5" style={{ border: `1px solid ${B.border}` }}>
          {[['Specialist','Roman'],['Service','Skin Fade'],['Price','$45'],['Date','Tue, Apr 29'],['Time','10:30 AM']].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span style={{ color: B.muted }}>{k}</span>
              <span className="font-semibold" style={{ color: k === 'Time' ? HEX.gold : B.dark }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 text-sm" style={{ border: `1px solid ${B.border}`, color: B.dark }}>Jane Smith</div>
        <div
          className="bg-white rounded-2xl px-4 py-3 text-sm"
          style={{ border: `1px solid ${HEX.gold}`, boxShadow: `0 0 0 3px ${HEX.gold}22`, color: B.dark }}
        >
          +1 (303) 210-1850
        </div>
        {/* Primary CTA — gold accent */}
        <button
          className="w-full font-bold py-4 rounded-2xl text-base"
          style={{
            background: HEX.gold,
            color: HEX.dark,
            boxShadow: `0 8px 28px ${HEX.gold}50, 0 2px 8px ${HEX.gold}35`,
          }}
        >
          Confirm booking →
        </button>
      </div>
    </div>
  )
}

function DoneScene() {
  const [pulse,   setPulse]   = useState(false)
  const [showSms, setShowSms] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowSms(true), 600)
    const t2 = setTimeout(() => setPulse(true),   400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{ background: B.cream, animation: 'sceneIn 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
    >
      {/* SMS notification banner — slides down from top */}
      <div
        className="absolute top-0 inset-x-0 px-4 pt-3 z-20"
        style={{
          transform: showSms ? 'translateY(0)' : 'translateY(-110%)',
          opacity: showSms ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34,1.4,0.64,1), opacity 0.4s ease',
        }}
      >
        <div
          className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{
            background: 'rgba(26,18,8,0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${HEX.gold}30`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.35)`,
          }}
        >
          {/* App icon */}
          <div
            className="w-9 h-9 rounded-xl flex-none flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: HEX.gold, color: HEX.dark }}
          >
            ✂
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-white">Noble</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>now</span>
            </div>
            <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
              New booking! John Doe — Skin Fade @ 10:30 AM
            </p>
          </div>
        </div>
      </div>

      {/* Success icon — gold ring + checkmark */}
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: pulse ? 'successRing 1.4s ease-out forwards' : 'none',
            background: `${HEX.gold}30`,
          }}
        />
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: `${HEX.gold}22`,
            boxShadow: `0 0 0 4px ${HEX.gold}30, 0 8px 24px ${HEX.gold}35`,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke={HEX.gold}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      <h2 className="font-serif font-bold text-3xl mb-2" style={{ color: B.dark }}>Booking confirmed!</h2>
      <p className="text-base mb-1" style={{ color: B.secondary }}>Tue, April 29 · 10:30 AM</p>
      <p className="text-sm mb-8" style={{ color: B.muted }}>Roman · Skin Fade · $45</p>
      <div className="bg-white rounded-2xl px-6 py-3 text-sm" style={{ border: `1px solid ${B.border}`, color: B.secondary }}>
        Confirmation sent to your email
      </div>
      <p className="text-xs mt-10" style={{ color: B.muted }}>noblelink.app</p>

      <style>{`
        @keyframes successRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// Scene durations in record mode (ms) — tweak to match animation length
const SCENE_DURATIONS = [7000, 5000, 4000, 5000, 4000, 4500]

export default function DemoStage() {
  const [step,      setStep]      = useState(0)
  const [auto,      setAuto]      = useState(false)
  const [recordMode, setRecordMode] = useState(false)
  // Incrementing this key forces every scene to remount (replays all animations)
  const [resetKey,  setResetKey]  = useState(0)

  function handleRestart() {
    setAuto(false)
    setStep(0)
    setResetKey(k => k + 1)
  }

  // Normal auto mode — hold 5 s on DoneScene before looping
  useEffect(() => {
    if (!auto || recordMode) return
    const isLast = step === STEPS.length - 1
    const t = setTimeout(
      () => setStep(s => (s + 1) % STEPS.length),
      isLast ? 5000 : 2500,
    )
    return () => clearTimeout(t)
  }, [step, auto, recordMode])

  // Record mode — reads ?record from URL, auto-advances by scene duration
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!new URLSearchParams(window.location.search).has('record')) return
    setRecordMode(true)
    setStep(0)
    let s = 0
    const advance = () => {
      s++
      if (s >= STEPS.length) return
      setStep(s)
      setTimeout(advance, SCENE_DURATIONS[s])
    }
    const t = setTimeout(advance, SCENE_DURATIONS[0])
    return () => clearTimeout(t)
  }, [])

  if (recordMode) {
    return (
      <div style={{ width: 1080, height: 1920, position: 'relative', overflow: 'hidden', background: HEX.black }}>
        <style>{`@keyframes sceneIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>
        {step === 0 && <ChaosSlide   key="chaos-r" />}
        {step === 1 && <LinkSlide    key="link-r" />}
        {step === 2 && <HeroScene    key="hero-r" />}
        {step === 3 && <BookingScene key="booking-r" />}
        {step === 4 && <ConfirmScene key="confirm-r" />}
        {step === 5 && <DoneScene    key="done-r" />}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-8 gap-6" style={{ background: '#111' }}>
      {/* sceneIn keyframe — available to all scene components */}
      <style>{`@keyframes sceneIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Controls */}
      <div className="flex items-center gap-3 text-white text-sm flex-wrap justify-center">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            style={i === step ? { background: HEX.gold, borderColor: HEX.gold, color: HEX.dark, fontWeight: 700 } : {}}
            className={`px-3 py-1 rounded-full border transition ${i !== step ? 'border-white/20 text-white/50 hover:border-white/50' : ''}`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setAuto(a => !a)}
          style={auto ? { background: '#22c55e', borderColor: '#22c55e', color: '#000', fontWeight: 700 } : {}}
          className={`px-3 py-1 rounded-full border transition ${!auto ? 'border-white/20 text-white/50' : ''}`}
        >
          {auto ? '⏸ Auto' : '▶ Auto'}
        </button>
      </div>

      {/* 1080×1920 frame — previewed at 360×640 (1/3 scale) */}
      <div
        style={{ width: 360, height: 640, background: HEX.black, borderColor: 'rgba(255,255,255,0.1)' }}
        className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black/60 border"
        aria-label="1080×1920 promo frame (preview at 1/3 scale)"
      >
        {/* Status bar */}
        <div className="absolute top-0 inset-x-0 flex justify-between items-center px-6 pt-3 pb-1 text-[10px] z-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="4" width="2" height="6" rx="1"/><rect x="3" y="3" width="2" height="7" rx="1"/><rect x="6" y="1" width="2" height="9" rx="1"/><rect x="9" y="0" width="2" height="10" rx="1"/></svg>
            <span>100%</span>
          </span>
        </div>

        {step === 0 && <ChaosSlide   key={`chaos-${resetKey}`} />}
        {step === 1 && <LinkSlide    key={`link-${resetKey}`} />}
        {step === 2 && <HeroScene    key={`hero-${resetKey}`} />}
        {step === 3 && <BookingScene key={`booking-${resetKey}`} />}
        {step === 4 && <ConfirmScene key={`confirm-${resetKey}`} />}
        {step === 5 && <DoneScene    key={`done-${resetKey}`} />}

        {/* Step dots */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1.5 z-10">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === step ? 16 : 6, background: i === step ? HEX.gold : 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>
      </div>

      {/* Restart — resets step + remounts all scenes for a clean new take */}
      <button
        onClick={handleRestart}
        className="flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        style={{
          borderColor: 'rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        {/* circular arrow icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Restart
      </button>

      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Preview 1/3 scale · 1080×1920px · <code className="opacity-60">?record</code> for clean capture
      </p>
    </div>
  )
}
