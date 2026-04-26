'use client'
import { useLayoutEffect, useRef } from 'react'

const ITEM_H = 40
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINS  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const AMPM  = ['AM', 'PM']

function DrumColumn({
  items, value, onChange, width = 'w-10',
}: { items: string[]; value: string; onChange: (v: string) => void; width?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const settling = useRef(false)

  useLayoutEffect(() => {
    const idx = items.indexOf(value)
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H
    }
  }, [value, items])

  function onScroll() {
    if (settling.current) return
    settling.current = true
    setTimeout(() => {
      settling.current = false
      if (!ref.current) return
      const idx = Math.round(ref.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      ref.current.scrollTop = clamped * ITEM_H
      onChange(items[clamped])
    }, 120)
  }

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={`${width} overflow-y-scroll`}
      style={{ height: ITEM_H * 3, scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
    >
      <div style={{ height: ITEM_H, flexShrink: 0 }} />
      {items.map(item => (
        <div
          key={item}
          style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          className={`flex items-center justify-center text-sm font-semibold select-none transition-colors ${
            item === value ? 'text-white' : 'text-white/25'
          }`}
        >
          {item}
        </div>
      ))}
      <div style={{ height: ITEM_H, flexShrink: 0 }} />
    </div>
  )
}

export default function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr) || 0
  const rawM = parseInt(mStr) || 0
  const nearestM = MINS.reduce((a, b) =>
    Math.abs(parseInt(b) - rawM) < Math.abs(parseInt(a) - rawM) ? b : a)
  const isPM = h24 >= 12
  const h12 = String(h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24)

  function emit(newH12: string, newM: string, newAmPm: string) {
    const h = parseInt(newH12)
    const h24out = newAmPm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h)
    onChange(`${String(h24out).padStart(2, '0')}:${newM}`)
  }

  return (
    <div className="relative flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-3"
        style={{
          top: ITEM_H,
          height: ITEM_H,
          borderTop: '1px solid rgba(201,168,76,0.4)',
          borderBottom: '1px solid rgba(201,168,76,0.4)',
          borderRadius: 6,
          background: 'rgba(201,168,76,0.06)',
        }}
      />
      <DrumColumn items={HOURS} value={h12} width="w-8"
        onChange={v => emit(v, nearestM, isPM ? 'PM' : 'AM')} />
      <span className="text-white/30 font-bold text-sm z-10">:</span>
      <DrumColumn items={MINS} value={nearestM} width="w-10"
        onChange={v => emit(h12, v, isPM ? 'PM' : 'AM')} />
      <DrumColumn items={AMPM} value={isPM ? 'PM' : 'AM'} width="w-10"
        onChange={v => emit(h12, nearestM, v)} />
    </div>
  )
}
