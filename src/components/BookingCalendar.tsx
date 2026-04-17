'use client'
import { toAmPm } from '@/lib/time'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

interface Booking {
  id: string; client_name: string; client_phone: string; client_email: string | null
  service_name: string; master_id: string; date: string; time_slot: string
  start_time: string; price_cents: number; status: string
}
interface CalendarBlock {
  id: string; org_id: string; staff_id: string | null
  start_time: string; end_time: string; reason: string
}
interface Staff { id: string; name: string; role: string }
interface Props { orgId: string; orgTimezone: string; staff: Staff[] }
interface DragState { bookingId: string; originDate: string; originTime: string; originMasterId: string }
interface DropTarget { date: string; time: string; masterId: string }
interface RescheduleConfirm { booking: Booking; newDate: string; newTime: string; newMasterId: string }

const STATUS_CONFIG: Record<string, { label: string; badge: string; cardBg: string; cardBorder: string; cardText: string }> = {
  pending:   { label: 'Pending',   badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', cardBg: 'bg-yellow-500/10', cardBorder: 'border-yellow-400',  cardText: 'text-yellow-300' },
  confirmed: { label: 'Confirmed', badge: 'bg-green-500/20 text-green-400 border-green-500/30',   cardBg: '',                 cardBorder: '',                   cardText: '' },
  completed: { label: 'Completed', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',      cardBg: 'bg-blue-500/10',   cardBorder: 'border-blue-400',    cardText: 'text-blue-300' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-500/20 text-red-400 border-red-500/30',         cardBg: 'bg-red-500/10',    cardBorder: 'border-red-400',     cardText: 'text-red-300' },
  no_show:   { label: 'No-show',   badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',cardBg: 'bg-orange-500/10', cardBorder: 'border-orange-400',  cardText: 'text-orange-300' },
}
const STATUS_ACTIONS: Record<string, { action: string; label: string; style: string }[]> = {
  pending:   [{ action:'confirmed',label:'Confirm',style:'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'},{ action:'cancelled',label:'Cancel',style:'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'}],
  confirmed: [{ action:'completed',label:'Complete',style:'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'},{ action:'no_show',label:'No-show',style:'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'},{ action:'cancelled',label:'Cancel',style:'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'}],
  completed: [], cancelled: [], no_show: [],
}
const STAFF_COLORS = [
  { bg:'bg-[#C9A84C]/20', border:'border-[#C9A84C]', text:'text-[#C9A84C]', dot:'#C9A84C' },
  { bg:'bg-blue-500/20',  border:'border-blue-400',  text:'text-blue-400',  dot:'#60a5fa' },
  { bg:'bg-emerald-500/20',border:'border-emerald-400',text:'text-emerald-400',dot:'#34d399' },
  { bg:'bg-rose-500/20',  border:'border-rose-400',  text:'text-rose-400',  dot:'#fb7185' },
  { bg:'bg-violet-500/20',border:'border-violet-400',text:'text-violet-400',dot:'#a78bfa' },
  { bg:'bg-orange-500/20',border:'border-orange-400',text:'text-orange-400',dot:'#fb923c' },
]
function getStaffColor(i: number) { return STAFF_COLORS[i % STAFF_COLORS.length] }

function startOfWeek(date: Date): Date { const d=new Date(date); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d }
function addDays(date: Date, n: number): Date { const d=new Date(date); d.setDate(d.getDate()+n); return d }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate() }
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function formatDate(d: Date) { return d.toLocaleDateString('en-US',{day:'numeric',month:'short'}) }
function formatDateFull(d: Date) { return d.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) }

const HOURS = Array.from({length:11},(_,i)=>i+9)

function isHourBlocked(dateStr: string, hour: number, staffId: string | null, blocks: CalendarBlock[]): CalendarBlock | null {
  const slotStart = new Date(`${dateStr}T${String(hour).padStart(2,'0')}:00:00`).getTime()
  const slotEnd = slotStart + 60 * 60 * 1000
  return blocks.find(b => {
    const bs = new Date(b.start_time).getTime()
    const be = new Date(b.end_time).getTime()
    return bs < slotEnd && be > slotStart && (b.staff_id === null || b.staff_id === staffId)
  }) || null
}

function BlockOverlay({ block }: { block: CalendarBlock }) {
  return (
    <div className="absolute inset-0 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center pointer-events-none z-0">
      <div className="flex items-center gap-1 px-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        <p className="text-red-400/80 text-[9px] font-medium truncate">{block.reason}</p>
      </div>
    </div>
  )
}

function RescheduleModal({ confirm, staffList, onConfirm, onCancel, saving }: {
  confirm: RescheduleConfirm; staffList: Staff[]; onConfirm:()=>void; onCancel:()=>void; saving:boolean
}) {
  const ns=staffList.find(s=>s.id===confirm.newMasterId); const os=staffList.find(s=>s.id===confirm.booking.master_id)
  useEffect(()=>{ const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')onCancel()}; window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn) },[onCancel])
  const ch={date:confirm.newDate!==confirm.booking.date,time:confirm.newTime!==confirm.booking.time_slot,master:confirm.newMasterId!==confirm.booking.master_id}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel}/>
      <div className="relative bg-[#1a1208] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h2 className="font-bold text-white text-lg mb-1">Reschedule booking?</h2>
        <p className="text-white/50 text-sm mb-4">{confirm.booking.client_name} — {confirm.booking.service_name}</p>
        <div className="bg-white/5 rounded-xl p-4 space-y-3 mb-5 text-sm">
          <div className="flex items-start gap-3"><span className="text-white/30 w-12 flex-none text-xs pt-0.5">Date</span><div className="flex items-center gap-2 flex-wrap"><span className={ch.date?'line-through text-white/30':'text-white'}>{new Date(confirm.booking.date+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short'})}</span>{ch.date&&<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg><span className="text-[#C9A84C] font-semibold">{new Date(confirm.newDate+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short'})}</span></>}</div></div>
          <div className="flex items-start gap-3"><span className="text-white/30 w-12 flex-none text-xs pt-0.5">Time</span><div className="flex items-center gap-2"><span className={ch.time?'line-through text-white/30':'text-white'}>{toAmPm(confirm.booking.time_slot)}</span>{ch.time&&<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg><span className="text-[#C9A84C] font-semibold">{toAmPm(confirm.newTime)}</span></>}</div></div>
          {ch.master&&<div className="flex items-start gap-3"><span className="text-white/30 w-12 flex-none text-xs pt-0.5">Master</span><div className="flex items-center gap-2"><span className="line-through text-white/30">{os?.name}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg><span className="text-[#C9A84C] font-semibold">{ns?.name}</span></div></div>}
        </div>
        <p className="text-white/30 text-xs mb-4">Client will be notified of the change.</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} disabled={saving} className="flex-1 bg-[#C9A84C] text-black font-bold py-2.5 rounded-xl hover:bg-[#e8d08a] transition disabled:opacity-50 text-sm">{saving?<span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>Saving...</span>:'Confirm'}</button>
          <button onClick={onCancel} disabled={saving} className="flex-1 border border-white/20 text-white/60 py-2.5 rounded-xl hover:border-white/40 hover:text-white transition text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function BookingModal({ booking, staffList, staffColorMap, onClose, onStatusChange }: {
  booking: Booking; staffList: Staff[]; staffColorMap: Map<string,typeof STAFF_COLORS[0]>
  onClose:()=>void; onStatusChange:(id:string,status:string)=>Promise<void>
}) {
  const sm=staffList.find(s=>s.id===booking.master_id); const color=staffColorMap.get(booking.master_id)||STAFF_COLORS[0]
  const statusCfg=STATUS_CONFIG[booking.status]??STATUS_CONFIG.confirmed; const actions=STATUS_ACTIONS[booking.status]??[]
  const [updating,setUpdating]=useState<string|null>(null)
  useEffect(()=>{ const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}; window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn) },[onClose])
  async function handleAction(ns:string){setUpdating(ns);await onStatusChange(booking.id,ns);setUpdating(null);onClose()}
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-[#1a1208] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full sm:hidden"/>
        <div className="flex items-start justify-between mb-5 mt-2 sm:mt-0">
          <div><h2 className="font-bold text-white text-lg">{booking.client_name}</h2><a href={`tel:${booking.client_phone}`} className="text-white/50 text-sm hover:text-white transition">{booking.client_phone}</a></div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none ${color.bg} border ${color.border}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={color.text}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div><p className="text-white/40 text-xs">Master</p><p className={`text-sm font-medium ${color.text}`}>{sm?.name??'—'}</p></div></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white/5 border border-white/10"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><p className="text-white/40 text-xs">Date & time</p><p className="text-white text-sm font-medium">{new Date(booking.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'})} at {toAmPm(booking.time_slot)}</p></div></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white/5 border border-white/10"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div><p className="text-white/40 text-xs">Price</p><p className="text-[#C9A84C] text-sm font-bold">${(booking.price_cents/100).toFixed(0)}</p></div></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white/5 border border-white/10"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg></div><div><p className="text-white/40 text-xs">Service</p><p className="text-white text-sm font-medium">{booking.service_name}</p></div></div>
        </div>
        <div className="flex items-center justify-between mb-4"><span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${statusCfg.badge}`}>{statusCfg.label}</span>{booking.client_email&&<a href={`mailto:${booking.client_email}`} className="text-white/40 hover:text-white text-xs transition truncate max-w-[180px]">{booking.client_email}</a>}</div>
        {actions.length>0&&<div className="flex gap-2 flex-wrap border-t border-white/10 pt-4">{actions.map(({action,label,style})=><button key={action} onClick={()=>handleAction(action)} disabled={!!updating} className={`flex-1 text-sm font-semibold py-2 rounded-xl border transition disabled:opacity-50 ${style}`}>{updating===action?<span className="flex items-center justify-center gap-1.5"><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>{label}...</span>:label}</button>)}</div>}
      </div>
    </div>
  )
}

function BookingCard({ booking, staffColor, onDragStart, onBookingClick, isDragging }: {
  booking:Booking; staffColor:typeof STAFF_COLORS[0]
  onDragStart:(b:Booking)=>void; onBookingClick:(b:Booking)=>void; isDragging:boolean
}) {
  const statusCfg=STATUS_CONFIG[booking.status]; const useStatus=booking.status!=='confirmed'&&booking.status!=='pending'
  const bg=useStatus?statusCfg.cardBg:staffColor.bg; const border=useStatus?statusCfg.cardBorder:staffColor.border; const text=useStatus?statusCfg.cardText:staffColor.text
  return (
    <div draggable onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('bookingId',booking.id);onDragStart(booking)}} onClick={()=>onBookingClick(booking)} role="button" tabIndex={0}
      className={`relative z-10 w-full text-left rounded px-1.5 py-1 mb-0.5 border-l-2 cursor-grab active:cursor-grabbing transition select-none ${bg} ${border} ${isDragging?'opacity-40 scale-95':'hover:brightness-125'}`}>
      <p className={`text-xs font-semibold truncate ${text}`}>{booking.client_name}</p>
      <div className="flex items-center gap-1">
        <p className="text-white/40 text-[10px] truncate flex-1">{booking.service_name}</p>
        {useStatus&&<span className={`text-[9px] font-bold px-1 py-0.5 rounded ${statusCfg.badge}`}>{booking.status==='no_show'?'NS':statusCfg.label.slice(0,4).toUpperCase()}</span>}
      </div>
    </div>
  )
}

function DropCell({ date, time, masterId, children, onDrop, isOver, isToday, block }: {
  date:string; time:string; masterId:string; children:React.ReactNode
  onDrop:(t:DropTarget)=>void; isOver:boolean; isToday:boolean; block:CalendarBlock|null
}) {
  const [hover,setHover]=useState(false)
  return (
    <div className={`border-t border-white/5 px-0.5 pt-0.5 relative min-h-[56px] transition-colors ${isToday?'bg-[#C9A84C]/3':''} ${hover&&isOver&&!block?'bg-[#C9A84C]/10':''}`}
      onDragOver={e=>{if(block)return;e.preventDefault();e.dataTransfer.dropEffect='move';setHover(true)}}
      onDragLeave={()=>setHover(false)}
      onDrop={e=>{if(block)return;e.preventDefault();setHover(false);onDrop({date,time,masterId})}}>
      {block && <BlockOverlay block={block} />}
      {hover&&isOver&&!block&&<div className="absolute inset-0 border-2 border-dashed border-[#C9A84C]/40 rounded pointer-events-none"/>}
      {children}
    </div>
  )
}

function WeekView({ weekStart, bookings, blocks, staffColorMap, staff, onBookingClick, dragState, onDragStart, onDrop }: {
  weekStart:Date; bookings:Booking[]; blocks:CalendarBlock[]
  staffColorMap:Map<string,typeof STAFF_COLORS[0]>; staff:Staff[]
  onBookingClick:(b:Booking)=>void; dragState:DragState|null
  onDragStart:(b:Booking)=>void; onDrop:(t:DropTarget)=>void
}) {
  const days=Array.from({length:7},(_,i)=>addDays(weekStart,i)); const today=new Date()
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-white/10 mb-1">
          <div/>
          {days.map(d=>{const it=isSameDay(d,today);return(
            <div key={d.toISOString()} className="text-center pb-2 px-1">
              <p className="text-white/40 text-xs uppercase tracking-wide">{d.toLocaleDateString('en-US',{weekday:'short'})}</p>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold ${it?'bg-[#C9A84C] text-black':'text-white/70'}`}>{d.getDate()}</div>
            </div>
          )})}
        </div>
        <div>
          {HOURS.map(hour=>{
            const hourLabel = (h: number): string => { const p = h>=12?"PM":"AM"; const hh = h%12||12; return hh+":00 "+p; };
            const label = toAmPm(`${String(hour).padStart(2,'0')}:00`)
            return (
              <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)]">
                <div className="text-white/20 text-[10px] pr-2 pt-0.5 text-right select-none leading-tight">{label}</div>
                {days.map(d=>{
                  const dateStr=toDateStr(d); const timeStr=`${String(hour).padStart(2,'0')}:00`
                  const cell=bookings.filter(b=>b.date===dateStr&&parseInt(b.time_slot.split(':')[0])===hour)
                  const blk=isHourBlocked(dateStr, hour, dragState?.originMasterId||null, blocks)
                  return(
                    <DropCell key={d.toISOString()} date={dateStr} time={timeStr} masterId={dragState?.originMasterId||(staff[0]?.id??'')} onDrop={onDrop} isOver={!!dragState} isToday={isSameDay(d,today)} block={blk}>
                      {cell.map(b=><BookingCard key={b.id} booking={b} staffColor={staffColorMap.get(b.master_id)||STAFF_COLORS[0]} onDragStart={onDragStart} onBookingClick={onBookingClick} isDragging={dragState?.bookingId===b.id}/>)}
                    </DropCell>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DayView({ date, bookings, blocks, staffColorMap, staff, onBookingClick, dragState, onDragStart, onDrop }: {
  date:Date; bookings:Booking[]; blocks:CalendarBlock[]
  staffColorMap:Map<string,typeof STAFF_COLORS[0]>; staff:Staff[]
  onBookingClick:(b:Booking)=>void; dragState:DragState|null
  onDragStart:(b:Booking)=>void; onDrop:(t:DropTarget)=>void
}) {
  const dateStr=toDateStr(date); const dayBookings=bookings.filter(b=>b.date===dateStr)
  return (
    <div>
      <div className="mb-3 text-white/50 text-sm font-medium">{formatDateFull(date)}</div>
      {HOURS.map(hour=>{
        const timeStr=`${String(hour).padStart(2,'0')}:00`
        const slotBookings=dayBookings.filter(b=>parseInt(b.time_slot.split(':')[0])===hour)
        const blk=isHourBlocked(dateStr, hour, null, blocks)
        return(
          <DropCell key={hour} date={dateStr} time={timeStr} masterId={dragState?.originMasterId||(staff[0]?.id??'')} onDrop={onDrop} isOver={!!dragState} isToday={false} block={blk}>
            <div className="flex gap-3 min-h-[52px]">
              <div className="w-14 text-white/20 text-[10px] pt-1 text-right flex-none select-none leading-tight">{toAmPm(timeStr)}</div>
              <div className="flex-1 py-0.5 space-y-1">
                {slotBookings.map(b=>{
                  const sc=staffColorMap.get(b.master_id)||STAFF_COLORS[0]; const s=STATUS_CONFIG[b.status]; const us=b.status!=='confirmed'&&b.status!=='pending'
                  const bg=us?s?.cardBg:sc.bg; const border=us?s?.cardBorder:sc.border; const text=us?s?.cardText:sc.text
                  return(
                    <div key={b.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('bookingId',b.id);onDragStart(b)}} onClick={()=>onBookingClick(b)} role="button" tabIndex={0}
                      className={`relative z-10 w-full text-left rounded-lg px-3 py-2 border-l-2 cursor-grab active:cursor-grabbing select-none transition ${bg} ${border} ${dragState?.bookingId===b.id?'opacity-40 scale-95':'hover:brightness-125'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0"><p className={`text-sm font-semibold truncate ${text}`}>{b.client_name}</p><p className="text-white/50 text-xs">{b.service_name} · {toAmPm(b.time_slot)}</p></div>
                        <div className="flex items-center gap-1.5 flex-none">{us&&s&&<span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${s.badge}`}>{s.label}</span>}<span className="text-white/30 text-xs">${(b.price_cents/100).toFixed(0)}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </DropCell>
        )
      })}
      {dayBookings.length===0&&<div className="text-center py-12 text-white/20 text-sm">No bookings</div>}
    </div>
  )
}

export default function BookingCalendar({ orgId, orgTimezone, staff }: Props) {
  const [view, setView] = useState<'week'|'day'>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStaff, setFilterStaff] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking|null>(null)
  const [dragState, setDragState] = useState<DragState|null>(null)
  const [rescheduleConfirm, setRescheduleConfirm] = useState<RescheduleConfirm|null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const staffColorMap = new Map(staff.map((s,i) => [s.id, getStaffColor(i)]))
  const weekStart = startOfWeek(currentDate)
  const rangeStart = view==='week' ? weekStart : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const rangeEnd = view==='week' ? addDays(weekStart,7) : addDays(rangeStart,1)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const start = rangeStart.toISOString().split('T')[0]
    const end = rangeEnd.toISOString().split('T')[0]
    let q = supabase.from('bookings').select('*').eq('org_id',orgId).gte('date',start).lt('date',end).order('date').order('time_slot')
    if (filterStaff !== 'all') q = q.eq('master_id', filterStaff)
    const [{ data: bData }, { data: blkData }] = await Promise.all([
      q,
      supabase.from('calendar_blocks').select('*').eq('org_id', orgId)
        .gte('end_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString()),
    ])
    setBookings(bData || [])
    setBlocks(blkData || [])
    setLoading(false)
  }, [orgId, filterStaff, rangeStart.toISOString(), rangeEnd.toISOString()])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setBookings(prev => prev.map(b => b.id===bookingId ? {...b, status:newStatus} : b))
    setSelectedBooking(prev => prev?.id===bookingId ? {...prev, status:newStatus} : prev)
    const { error } = await supabase.from('bookings').update({ status:newStatus }).eq('id',bookingId)
    if (error) { console.error('Status update failed:', error); fetchBookings() }
  }

  function handleDragStart(b: Booking) {
    setDragState({ bookingId:b.id, originDate:b.date, originTime:b.time_slot, originMasterId:b.master_id })
  }

  function handleDrop(target: DropTarget) {
    if (!dragState) return
    const b = bookings.find(x => x.id===dragState.bookingId)
    if (!b) { setDragState(null); return }
    if (target.date===b.date && target.time===b.time_slot) { setDragState(null); return }
    setRescheduleConfirm({ booking:b, newDate:target.date, newTime:target.time, newMasterId:target.masterId })
    setDragState(null)
  }

  async function handleConfirmReschedule() {
    if (!rescheduleConfirm) return
    setSaving(true)
    const { booking:b, newDate, newTime, newMasterId } = rescheduleConfirm
    const [h,m] = newTime.split(':').map(Number)
    const newStart = new Date(`${newDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
    const newReminderAt = new Date(newStart.getTime() - 2*60*60*1000)
    setBookings(prev => prev.map(x => x.id===b.id ? {...x, date:newDate, time_slot:newTime, master_id:newMasterId, start_time:newStart.toISOString()} : x))
    try {
      const { error } = await supabase.from('bookings').update({ date:newDate, time_slot:newTime, master_id:newMasterId, start_time:newStart.toISOString(), reminder_at:newReminderAt.toISOString(), reminder_sent:false }).eq('id',b.id)
      if (error) throw error
      const sm = staff.find(s => s.id===newMasterId)
      fetch('/api/email/reschedule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({booking_id:b.id,org_id:orgId,client_name:b.client_name,client_phone:b.client_phone,client_email:b.client_email,master_name:sm?.name??'',service_name:b.service_name,old_date:b.date,old_time:b.time_slot,new_date:newDate,new_time:newTime})}).catch(()=>{})
      fetch('/api/sms/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'reschedule',booking_id:b.id,old_date:b.date,old_time:b.time_slot})}).catch(()=>{})
    } catch(err) { console.error('Reschedule failed:', err); fetchBookings() }
    setSaving(false); setRescheduleConfirm(null)
  }

  const headerLabel = view==='week' ? `${formatDate(weekStart)} — ${formatDate(addDays(weekStart,6))}` : formatDate(currentDate)
  const isToday = view==='day' && isSameDay(currentDate, new Date())
  const isCurrentWeek = view==='week' && isSameDay(weekStart, startOfWeek(new Date()))

  return (
    <div className="space-y-4" onDragEnd={() => setDragState(null)}>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date())} disabled={isToday||isCurrentWeek}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition disabled:opacity-30 disabled:cursor-default">Today</button>
          <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
            <button onClick={() => setCurrentDate(d => addDays(d, view==='week'?-7:-1))} className="px-3 py-1.5 text-white/50 hover:text-white hover:bg-white/5 transition min-h-[32px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="px-3 py-1.5 text-white/80 text-sm font-medium border-x border-white/10 whitespace-nowrap">{headerLabel}</span>
            <button onClick={() => setCurrentDate(d => addDays(d, view==='week'?7:1))} className="px-3 py-1.5 text-white/50 hover:text-white hover:bg-white/5 transition min-h-[32px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {staff.length > 1 && (
            <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 outline-none focus:border-[#C9A84C] transition">
              <option value="all">All staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {(['week','day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${view===v?'bg-[#C9A84C] text-black':'text-white/50 hover:text-white'}`}>
                {v==='week'?'Week':'Day'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {staff.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {staff.map((s,i) => {
            const color = getStaffColor(i)
            return (
              <button key={s.id} onClick={() => setFilterStaff(filterStaff===s.id?'all':s.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition ${filterStaff===s.id||filterStaff==='all'?`${color.bg} ${color.border} ${color.text}`:'border-white/10 text-white/30'}`}>
                <span className="w-2 h-2 rounded-full" style={{background:color.dot}}/>{s.name}
              </button>
            )
          })}
          <div className="w-px bg-white/10 mx-1"/>
          {(['pending','completed','cancelled','no_show'] as const).map(s => (
            <span key={s} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${STATUS_CONFIG[s].badge}`}>{STATUS_CONFIG[s].label}</span>
          ))}
          {blocks.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-red-500/10 border-red-500/30 text-red-400">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Blocked
            </span>
          )}
        </div>
      )}

      {bookings.length > 0 && <p className="text-white/20 text-xs">Drag to reschedule · Click to view & update status</p>}

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative min-h-[400px]">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#0F0A00]/50 rounded-xl z-10"><svg className="animate-spin w-5 h-5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg></div>}
        {view==='week' && <WeekView weekStart={weekStart} bookings={bookings} blocks={blocks} staffColorMap={staffColorMap} staff={staff} onBookingClick={setSelectedBooking} dragState={dragState} onDragStart={handleDragStart} onDrop={handleDrop}/>}
        {view==='day' && <DayView date={currentDate} bookings={bookings} blocks={blocks} staffColorMap={staffColorMap} staff={staff} onBookingClick={setSelectedBooking} dragState={dragState} onDragStart={handleDragStart} onDrop={handleDrop}/>}
      </div>

      {orgTimezone && <p className="text-white/20 text-xs text-right">Timezone: {orgTimezone}</p>}
      {selectedBooking && !rescheduleConfirm && <BookingModal booking={selectedBooking} staffList={staff} staffColorMap={staffColorMap} onClose={() => setSelectedBooking(null)} onStatusChange={handleStatusChange}/>}
      {rescheduleConfirm && <RescheduleModal confirm={rescheduleConfirm} staffList={staff} onConfirm={handleConfirmReschedule} onCancel={() => { setRescheduleConfirm(null); setDragState(null) }} saving={saving}/>}
    </div>
  )
}
