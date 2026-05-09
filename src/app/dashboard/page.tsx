'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'
import CapacityWidget from '@/components/CapacityWidget'
import BookingCalendar from '@/components/BookingCalendar'
import StaffSchedule from '@/components/StaffSchedule'
import RecentBookings from '@/components/RecentBookings'
import CalendarBlocks from '@/components/CalendarBlocks'
import TimePicker from '@/components/TimePicker'
import FeedbackButton from '@/components/FeedbackButton'

const APP_URL = 'https://www.noblelink.app'
const SUPABASE_URL = 'https://ecszrloosntejjawlalv.supabase.co'

type Lang = 'en' | 'es'
const DT = {
  en: {
    tabs: { overview: 'Overview', calendar: 'Calendar', staff: 'Staff', services: 'Services', settings: 'Settings' },
    calTabs: { bookings: '📅 Bookings', blocks: '🚫 Blocks' },
    staffTabs: { members: 'Members', schedule: 'Schedule' },
    signOut: 'Sign out',
    overview: {
      statsLabels: ['Staff members', 'Services', 'Status', 'Trial days left'],
      bookingPage: 'Your booking page',
      bookingPageSub: 'Share this link with clients so they can book online.',
      copyLink: 'Copy link', open: 'Open ↗',
      quickActions: 'Quick actions',
      actions: ['📅 Calendar', '+ Add staff', '+ Add service', '⚙ Settings'],
    },
    checklist: {
      title: 'Get started',
      steps: [
        { label: 'Add your first service', sub: 'e.g. Haircut · 30 min · $25', cta: 'Add service' },
        { label: 'Add a staff member', sub: 'Let clients choose their barber', cta: 'Add staff' },
        { label: 'Share your booking link', sub: 'Copy and send to your clients', cta: 'Copy link' },
      ],
      of: 'of', completed: 'steps completed',
    },
    staff: {
      title: 'Staff', addBtn: '+ Add staff',
      newMember: 'New staff member', editMember: 'Edit staff member',
      namePh: 'Full name', rolePh: 'Specialty (e.g. Barber, Colorist, Nail tech...)',
      add: 'Add', save: 'Save changes', saving: 'Saving...', cancel: 'Cancel',
      noStaff: 'No staff members yet. Add your first barber!',
      scheduleBtn: 'Schedule', editBtn: 'Edit', removeBtn: 'Remove',
      toastAdded: 'Staff member added!', toastUpdated: 'Staff member updated!', toastRemoved: 'Staff member removed.',
      confirmRemove: 'Remove this staff member? Their bookings will remain.',
      limitReached: 'Starter plan allows up to 5 staff members.', upgradeCta: 'Upgrade →',
    },
    services: {
      title: 'Services', addBtn: '+ Add service',
      newService: 'New service', editService: 'Edit service',
      namePh: 'Service name (e.g. Haircut)',
      priceLabel: 'Price ($)', durationLabel: 'Duration (min)',
      add: 'Add', save: 'Save changes', saving: 'Saving...', cancel: 'Cancel',
      noServices: 'No services yet.',
      editBtn: 'Edit', removeBtn: 'Remove',
      toastAdded: 'Service added!', toastUpdated: 'Service updated!', toastRemoved: 'Service removed.',
      confirmRemove: 'Remove this service?',
    },
    settings: {
      title: 'Settings',
      salon: 'Salon', salonName: 'Salon name', bookingUrl: 'Booking URL',
      urlWarning: 'Changing this will break existing links shared with clients.',
      phone: 'Phone', address: 'Address',
      workingHours: 'Working hours', workingHoursSub: 'Sets the booking window for all staff. Changes apply to existing schedules.',
      opensAt: 'Opens at', closesAt: 'Closes at',
      managerProfile: 'Manager profile', yourName: 'Your name',
      socialMedia: 'Social media', socialSub: 'Links appear on your booking page so clients can follow you.',
      save: 'Save all settings', saving: 'Saving...',
      subscription: 'Subscription', plan: 'Plan', status: 'Status', manageBilling: 'Manage billing →',
      toastSaved: 'Settings saved!', toastCopied: 'Link copied!',
      urlTaken: 'This URL is already taken.',
    },
    upload: { upload: 'Upload photo', uploading: 'Uploading...', remove: 'Remove', hint: 'JPG, PNG, WebP · max 2MB' },
    loading: 'Loading...',
  },
  es: {
    tabs: { overview: 'Resumen', calendar: 'Calendario', staff: 'Personal', services: 'Servicios', settings: 'Ajustes' },
    calTabs: { bookings: '📅 Reservas', blocks: '🚫 Bloqueos' },
    staffTabs: { members: 'Miembros', schedule: 'Horario' },
    signOut: 'Cerrar sesión',
    overview: {
      statsLabels: ['Miembros del personal', 'Servicios', 'Estado', 'Días de prueba restantes'],
      bookingPage: 'Tu página de reservas',
      bookingPageSub: 'Comparte este enlace con los clientes para que puedan reservar en línea.',
      copyLink: 'Copiar enlace', open: 'Abrir ↗',
      quickActions: 'Acciones rápidas',
      actions: ['📅 Calendario', '+ Agregar personal', '+ Agregar servicio', '⚙ Ajustes'],
    },
    checklist: {
      title: 'Comenzar',
      steps: [
        { label: 'Agrega tu primer servicio', sub: 'ej. Corte · 30 min · $25', cta: 'Agregar servicio' },
        { label: 'Agrega un miembro del personal', sub: 'Deja que los clientes elijan su barbero', cta: 'Agregar personal' },
        { label: 'Comparte tu enlace de reservas', sub: 'Cópialo y envíalo a tus clientes', cta: 'Copiar enlace' },
      ],
      of: 'de', completed: 'pasos completados',
    },
    staff: {
      title: 'Personal', addBtn: '+ Agregar personal',
      newMember: 'Nuevo miembro del personal', editMember: 'Editar miembro del personal',
      namePh: 'Nombre completo', rolePh: 'Especialidad (ej. Barbero, Colorista, Manicurista...)',
      add: 'Agregar', save: 'Guardar cambios', saving: 'Guardando...', cancel: 'Cancelar',
      noStaff: 'Aún no hay personal. ¡Agrega tu primer barbero!',
      scheduleBtn: 'Horario', editBtn: 'Editar', removeBtn: 'Eliminar',
      toastAdded: '¡Miembro agregado!', toastUpdated: '¡Miembro actualizado!', toastRemoved: 'Miembro eliminado.',
      confirmRemove: '¿Eliminar este miembro? Sus reservas se mantendrán.',
      limitReached: 'El plan Starter permite hasta 5 miembros.', upgradeCta: 'Mejorar →',
    },
    services: {
      title: 'Servicios', addBtn: '+ Agregar servicio',
      newService: 'Nuevo servicio', editService: 'Editar servicio',
      namePh: 'Nombre del servicio (ej. Corte de pelo)',
      priceLabel: 'Precio ($)', durationLabel: 'Duración (min)',
      add: 'Agregar', save: 'Guardar cambios', saving: 'Guardando...', cancel: 'Cancelar',
      noServices: 'Aún no hay servicios.',
      editBtn: 'Editar', removeBtn: 'Eliminar',
      toastAdded: '¡Servicio agregado!', toastUpdated: '¡Servicio actualizado!', toastRemoved: 'Servicio eliminado.',
      confirmRemove: '¿Eliminar este servicio?',
    },
    settings: {
      title: 'Ajustes',
      salon: 'Salón', salonName: 'Nombre del salón', bookingUrl: 'URL de reservas',
      urlWarning: 'Cambiar esto romperá los enlaces existentes compartidos con los clientes.',
      phone: 'Teléfono', address: 'Dirección',
      workingHours: 'Horario de trabajo', workingHoursSub: 'Define la ventana de reservas para todo el personal.',
      opensAt: 'Abre a las', closesAt: 'Cierra a las',
      managerProfile: 'Perfil del manager', yourName: 'Tu nombre',
      socialMedia: 'Redes sociales', socialSub: 'Los enlaces aparecen en tu página de reservas.',
      save: 'Guardar ajustes', saving: 'Guardando...',
      subscription: 'Suscripción', plan: 'Plan', status: 'Estado', manageBilling: 'Gestionar facturación →',
      toastSaved: '¡Ajustes guardados!', toastCopied: '¡Enlace copiado!',
      urlTaken: 'Esta URL ya está en uso.',
    },
    upload: { upload: 'Subir foto', uploading: 'Subiendo...', remove: 'Eliminar', hint: 'JPG, PNG, WebP · máx 2MB' },
    loading: 'Cargando...',
  },
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: 3, gap: 2 }}>
      {(['en', 'es'] as Lang[]).map(l => (
        <button key={l} onClick={() => onChange(l)} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', border: 'none', cursor: 'pointer', minHeight: 28, background: lang === l ? '#C9A84C' : 'transparent', color: lang === l ? '#000' : 'rgba(255,255,255,0.5)' }}>{l}</button>
      ))}
    </div>
  )
}

interface Org {
  id: string; name: string; slug: string; plan_id: string
  sub_status: string; trial_ends_at: string | null; timezone?: string
  owner_name?: string | null; owner_avatar_url?: string | null
  instagram?: string | null; facebook?: string | null; tiktok?: string | null
  phone?: string | null; address?: string | null
  work_start?: string | null; work_end?: string | null
}
interface Staff { id: string; name: string; role: string; is_active: boolean; avatar_url?: string | null }
interface Service { id: string; name: string; price_cents: number; duration_min: number; is_active: boolean }

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#C9A84C] text-black text-sm font-bold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      {message}
    </div>
  )
}

function Avatar({ name, url, size = 8 }: { name?: string | null; url?: string | null; size?: number }) {
  const initials = name ? name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  const sizeClass = `w-${size} h-${size}`
  if (url) return <img src={url} alt={name || ''} className={`${sizeClass} rounded-full object-cover flex-none`} />
  return (
    <div className={`${sizeClass} rounded-full bg-[#C9A84C] flex items-center justify-center flex-none`}>
      <span className="text-black text-xs font-bold">{initials}</span>
    </div>
  )
}

function AvatarUpload({ currentUrl, name, onUploaded, path }: {
  currentUrl?: string | null; name?: string | null
  onUploaded: (url: string) => void; path: string
}) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${path}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (!error) onUploaded(`${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}?t=${Date.now()}`)
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} url={currentUrl} size={12} />
      <div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="text-xs text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 px-3 py-1.5 rounded transition disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Upload photo'}
        </button>
        {currentUrl && <button onClick={() => onUploaded('')} className="ml-2 text-xs text-white/30 hover:text-red-400 transition">Remove</button>}
        <p className="text-white/20 text-[10px] mt-1">JPG, PNG, WebP · max 2MB</p>
        {/* Note: AvatarUpload is reused across contexts; upload labels stay in English */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

function OnboardingChecklist({ hasService, hasStaff, hasCopiedLink, onAddService, onAddStaff, onCopyLink, checklist }: {
  hasService: boolean; hasStaff: boolean; hasCopiedLink: boolean
  onAddService: () => void; onAddStaff: () => void; onCopyLink: () => void
  checklist: typeof DT['en']['checklist']
}) {
  const steps = [
    { id: 'service', done: hasService, label: checklist.steps[0].label, sub: checklist.steps[0].sub, action: onAddService, cta: checklist.steps[0].cta },
    { id: 'staff', done: hasStaff, label: checklist.steps[1].label, sub: checklist.steps[1].sub, action: onAddStaff, cta: checklist.steps[1].cta },
    { id: 'link', done: hasCopiedLink, label: checklist.steps[2].label, sub: checklist.steps[2].sub, action: onCopyLink, cta: checklist.steps[2].cta },
  ]
  const doneCount = steps.filter(s => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)
  if (doneCount === steps.length) return null
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div><h3 className="font-semibold text-white">{checklist.title}</h3><p className="text-white/40 text-xs mt-0.5">{doneCount} {checklist.of} {steps.length} {checklist.completed}</p></div>
        <span className="text-[#C9A84C] text-sm font-bold">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.id} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${step.done ? 'opacity-50' : 'bg-white/5'}`}>
            <div className={`w-7 h-7 rounded-full flex-none flex items-center justify-center border-2 transition ${step.done ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-white/20'}`}>
              {step.done ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : <span className="text-white/30 text-xs font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'line-through text-white/40' : 'text-white'}`}>{step.label}</p>
              {!step.done && <p className="text-white/30 text-xs mt-0.5">{step.sub}</p>}
            </div>
            {!step.done && <button onClick={step.action} className="flex-none text-xs font-bold text-black bg-[#C9A84C] hover:bg-[#e8d08a] transition px-3 py-1.5 rounded-lg whitespace-nowrap">{step.cta} →</button>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32)
}

const PLAN_STAFF_LIMIT: Record<string, number> = { starter: 5, pro: Infinity, business: Infinity }

const COPIED_LINK_KEY = 'noble_onboarding_copied_link'
const TABS = ['overview', 'calendar', 'staff', 'services', 'settings'] as const
type Tab = typeof TABS[number]
const STAFF_TABS = ['members', 'schedule'] as const
type StaffTab = typeof STAFF_TABS[number]
const CALENDAR_TABS = ['bookings', 'blocks'] as const
type CalendarTab = typeof CALENDAR_TABS[number]

export default function Dashboard() {
  const [lang, setLang] = useState<Lang>('en')
  const t = DT[lang]
  const [org, setOrg] = useState<Org | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [staffTab, setStaffTab] = useState<StaffTab>('members')
  const [calendarTab, setCalendarTab] = useState<CalendarTab>('bookings')
  const [toast, setToast] = useState<string | null>(null)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Staff
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('')
  const [newStaffAvatarUrl, setNewStaffAvatarUrl] = useState('')
  const [newStaffTempId] = useState(() => crypto.randomUUID())
  const [staffSaving, setStaffSaving] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [editStaffName, setEditStaffName] = useState('')
  const [editStaffRole, setEditStaffRole] = useState('')
  const [editStaffAvatarUrl, setEditStaffAvatarUrl] = useState('')
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)

  // Services
  const [showAddService, setShowAddService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState('30')
  const [serviceSaving, setServiceSaving] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editServiceName, setEditServiceName] = useState('')
  const [editServicePrice, setEditServicePrice] = useState('')
  const [editServiceDuration, setEditServiceDuration] = useState('30')
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)

  // Settings
  const [settingsName, setSettingsName] = useState('')
  const [settingsSlug, setSettingsSlug] = useState('')
  const [settingsPhone, setSettingsPhone] = useState('')
  const [settingsAddress, setSettingsAddress] = useState('')
  const [settingsOwnerName, setSettingsOwnerName] = useState('')
  const [settingsOwnerAvatarUrl, setSettingsOwnerAvatarUrl] = useState('')
  const [settingsInstagram, setSettingsInstagram] = useState('')
  const [settingsFacebook, setSettingsFacebook] = useState('')
  const [settingsTiktok, setSettingsTiktok] = useState('')
  const [settingsWorkStart, setSettingsWorkStart] = useState('09:00')
  const [settingsWorkEnd, setSettingsWorkEnd] = useState('19:00')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    setHasCopiedLink(!!localStorage.getItem(COPIED_LINK_KEY))
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (!user.email_confirmed_at) { router.push('/verify-email'); return }
      const { data: orgData, error: orgError } = await supabase.from('organizations').select('*').eq('owner_id', user.id).maybeSingle()
      // PGRST116 = no rows — genuine new user. Any other error = RLS or DB issue, don't silently redirect.
      if (orgError) { console.error('[dashboard] org query error:', orgError); setLoading(false); return }
      if (!orgData) { router.push('/onboarding'); return }
      setOrg(orgData)
      setSettingsName(orgData.name); setSettingsSlug(orgData.slug)
      setSettingsPhone(orgData.phone || ''); setSettingsAddress(orgData.address || '')
      setSettingsOwnerName(orgData.owner_name || ''); setSettingsOwnerAvatarUrl(orgData.owner_avatar_url || '')
      setSettingsInstagram(orgData.instagram || ''); setSettingsFacebook(orgData.facebook || ''); setSettingsTiktok(orgData.tiktok || '')
      setSettingsWorkStart(orgData.work_start || '09:00'); setSettingsWorkEnd(orgData.work_end || '19:00')
      const [{ data: staffData }, { data: servicesData }] = await Promise.all([
        supabase.from('staff').select('*').eq('org_id', orgData.id).eq('is_active', true),
        supabase.from('services').select('*').eq('org_id', orgData.id).eq('is_active', true),
      ])
      setStaff(staffData || []); setServices(servicesData || []); setLoading(false)
    }
    load()
  }, [])

  const showToast = useCallback((msg: string) => setToast(msg), [])

  async function handleCopy() {
    try { await navigator.clipboard.writeText(bookingUrl); localStorage.setItem(COPIED_LINK_KEY, '1'); setHasCopiedLink(true); showToast(t.settings.toastCopied) }
    catch { showToast(t.settings.toastCopied) }
  }

  async function handleAddStaff() {
    if (!newStaffName.trim() || !org) return
    setStaffSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ org_id: org.id, name: newStaffName.trim(), role: newStaffRole.trim(), avatar_url: newStaffAvatarUrl || undefined }),
    })
    const json = await res.json()
    setStaffSaving(false)
    if (!res.ok) {
      if (res.status === 403) showToast(t.staff.limitReached)
      else showToast(json.error ?? 'Something went wrong')
      return
    }
    const { data } = await supabase.from('staff').select('*').eq('org_id', org.id).eq('is_active', true)
    setStaff(data || []); setNewStaffName(''); setNewStaffRole(''); setNewStaffAvatarUrl(''); setShowAddStaff(false)
    showToast(t.staff.toastAdded)
  }

  function openEditStaff(s: Staff) { setEditingStaff(s); setEditStaffName(s.name); setEditStaffRole(s.role); setEditStaffAvatarUrl(s.avatar_url || ''); setShowAddStaff(false) }

  async function handleSaveStaff() {
    if (!editingStaff || !editStaffName.trim()) return
    setStaffSaving(true)
    await supabase.from('staff').update({ name: editStaffName.trim(), role: editStaffRole.trim(), avatar_url: editStaffAvatarUrl || null }).eq('id', editingStaff.id)
    setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, name: editStaffName.trim(), role: editStaffRole.trim(), avatar_url: editStaffAvatarUrl || null } : s))
    setEditingStaff(null); setStaffSaving(false); showToast(t.staff.toastUpdated)
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm(t.staff.confirmRemove)) return
    setDeletingStaffId(id)
    await supabase.from('staff').update({ is_active: false }).eq('id', id)
    setStaff(prev => prev.filter(s => s.id !== id)); setDeletingStaffId(null); showToast(t.staff.toastRemoved)
  }

  async function handleAddService() {
    if (!newServiceName.trim() || !newServicePrice || !org) return
    setServiceSaving(true)
    const price_cents = Math.round(parseFloat(newServicePrice) * 100)
    await supabase.from('services').insert({ org_id: org.id, name: newServiceName.trim(), price_cents, duration_min: parseInt(newServiceDuration), is_active: true })
    const { data } = await supabase.from('services').select('*').eq('org_id', org.id).eq('is_active', true)
    setServices(data || []); setNewServiceName(''); setNewServicePrice(''); setNewServiceDuration('30'); setShowAddService(false); setServiceSaving(false)
    showToast(t.services.toastAdded)
  }

  function openEditService(s: Service) {
    setEditingService(s); setEditServiceName(s.name)
    setEditServicePrice(String((s.price_cents / 100).toFixed(0))); setEditServiceDuration(String(s.duration_min)); setShowAddService(false)
  }

  async function handleSaveService() {
    if (!editingService || !editServiceName.trim() || !editServicePrice) return
    setServiceSaving(true)
    const price_cents = Math.round(parseFloat(editServicePrice) * 100); const duration_min = parseInt(editServiceDuration)
    await supabase.from('services').update({ name: editServiceName.trim(), price_cents, duration_min }).eq('id', editingService.id)
    setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, name: editServiceName.trim(), price_cents, duration_min } : s))
    setEditingService(null); setServiceSaving(false); showToast(t.services.toastUpdated)
  }

  async function handleDeleteService(id: string) {
    if (!confirm(t.services.confirmRemove)) return
    setDeletingServiceId(id)
    await supabase.from('services').update({ is_active: false }).eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id)); setDeletingServiceId(null); showToast(t.services.toastRemoved)
  }

  async function handleSaveSettings() {
    if (!org || !settingsName.trim() || !settingsSlug.trim()) return
    setSettingsSaving(true); setSettingsError('')
    const slug = generateSlug(settingsSlug)
    const { error } = await supabase.from('organizations').update({
      name: settingsName.trim(), slug,
      phone: settingsPhone.trim() || null,
      address: settingsAddress.trim() || null,
      owner_name: settingsOwnerName.trim() || null,
      owner_avatar_url: settingsOwnerAvatarUrl || null,
      instagram: settingsInstagram.trim() || null,
      facebook: settingsFacebook.trim() || null,
      tiktok: settingsTiktok.trim() || null,
      work_start: settingsWorkStart,
      work_end: settingsWorkEnd,
    }).eq('id', org.id)
    if (error) { setSettingsError(error.message.includes('unique') ? t.settings.urlTaken : error.message); setSettingsSaving(false); return }
    // Propagate new hours to all existing staff working days
    await supabase.from('staff_schedule')
      .update({ work_start: settingsWorkStart, work_end: settingsWorkEnd })
      .eq('org_id', org.id)
      .eq('is_day_off', false)
    setOrg(prev => prev ? {
      ...prev, name: settingsName.trim(), slug,
      phone: settingsPhone.trim() || null, address: settingsAddress.trim() || null,
      owner_name: settingsOwnerName.trim() || null, owner_avatar_url: settingsOwnerAvatarUrl || null,
      instagram: settingsInstagram.trim() || null, facebook: settingsFacebook.trim() || null, tiktok: settingsTiktok.trim() || null,
      work_start: settingsWorkStart, work_end: settingsWorkEnd,
    } : prev)
    setSettingsSlug(slug); setSettingsSaving(false); showToast(t.settings.toastSaved)
  }

  async function handleLogout() { await supabase.auth.signOut(); router.push('/') }

  const days = useMemo(() => {
    if (!org?.trial_ends_at) return null
    // eslint-disable-next-line react-hooks/purity
    return Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
  }, [org?.trial_ends_at])
  const bookingUrl = `${APP_URL}/salon/${org?.slug}`
  const staffLimit = PLAN_STAFF_LIMIT[org?.plan_id ?? 'starter'] ?? 5
  const atStaffLimit = staff.length >= staffLimit

  if (loading) return (
    <main className="min-h-screen bg-[#0F0A00] flex items-center justify-center">
      <div className="text-[#C9A84C] text-lg font-serif">{t.loading}</div>
    </main>
  )

  const inputCls = "w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]"

  return (
    <main className="min-h-screen bg-[#0F0A00] text-white">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <TrialBanner />

      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/10 sticky top-0 bg-[#0F0A00]/95 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[#C9A84C] text-lg">✂ Noble</span>
          <span className="text-white/20">|</span>
          <span className="text-white/60 text-sm hidden sm:inline">{org?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] px-2 py-1 rounded capitalize hidden sm:inline">{org?.plan_id} plan</span>
          <div className="flex items-center gap-2.5">
            <Avatar name={org?.owner_name} url={org?.owner_avatar_url} size={8} />
            <div className="hidden md:block">
              <p className="text-white text-sm font-medium leading-none">{org?.owner_name || 'Manager'}</p>
              <p className="text-[#C9A84C] text-[10px] mt-0.5">Manager</p>
            </div>
          </div>
          <LangToggle lang={lang} onChange={setLang} />
          <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white transition">{t.signOut}</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 w-full md:w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-[#C9A84C] text-black' : 'text-white/50 hover:text-white'}`}>
              {t.tabs[tab]}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <OnboardingChecklist
              hasService={services.length > 0} hasStaff={staff.length > 0} hasCopiedLink={hasCopiedLink}
              onAddService={() => { setActiveTab('services'); setShowAddService(true) }}
              onAddStaff={() => { setActiveTab('staff'); setShowAddStaff(true) }}
              onCopyLink={handleCopy}
              checklist={t.checklist}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {t.overview.statsLabels.map((label, i) => ({ label, value: [staff.length, services.length, org?.sub_status, days ?? '—'][i] })).map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-white/40 text-xs mb-1">{stat.label}</div>
                  <div className="text-white font-semibold capitalize">{String(stat.value)}</div>
                </div>
              ))}
            </div>
            {org && <RecentBookings orgId={org.id} staff={staff} />}
            {org && ['pro', 'business'].includes(org.plan_id) ? (
              <CapacityWidget orgId={org.id} />
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-none text-xl">📊</div>
                  <div>
                    <p className="font-semibold text-white text-sm">Advanced analytics</p>
                    <p className="text-white/40 text-xs mt-0.5">Capacity, revenue & staff utilization — Pro feature</p>
                  </div>
                </div>
                <Link href="/billing" className="flex-none text-xs font-bold text-black bg-[#C9A84C] hover:bg-[#e8d08a] transition px-4 py-2 rounded-lg whitespace-nowrap">Upgrade →</Link>
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-1">{t.overview.bookingPage}</h3>
              <p className="text-white/40 text-xs mb-3">{t.overview.bookingPageSub}</p>
              <div className="flex flex-col gap-3">
                <code className="bg-black/30 px-3 py-2 rounded text-[#C9A84C] text-sm break-all select-all">{bookingUrl}</code>
                <div className="flex gap-3">
                  <button onClick={handleCopy} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition whitespace-nowrap min-h-[44px]">{t.overview.copyLink}</button>
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="border border-white/20 text-white/60 px-4 py-2 rounded text-sm hover:border-white/40 hover:text-white transition whitespace-nowrap min-h-[44px] flex items-center">{t.overview.open}</a>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">{t.overview.quickActions}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[{ label: t.overview.actions[0], action: () => setActiveTab('calendar') }, { label: t.overview.actions[1], action: () => { setActiveTab('staff'); setShowAddStaff(true) } }, { label: t.overview.actions[2], action: () => { setActiveTab('services'); setShowAddService(true) } }, { label: t.overview.actions[3], action: () => setActiveTab('settings') }].map(a => (
                  <button key={a.label} onClick={a.action} className="border border-white/20 text-white/70 px-4 py-3 rounded text-sm hover:border-white/40 hover:text-white transition">{a.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Calendar ── */}
        {activeTab === 'calendar' && org && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
              {CALENDAR_TABS.map(ct => (
                <button key={ct} onClick={() => setCalendarTab(ct)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition ${calendarTab === ct ? 'bg-[#C9A84C] text-black' : 'text-white/40 hover:text-white'}`}>
                  {ct === 'bookings' ? t.calTabs.bookings : t.calTabs.blocks}
                </button>
              ))}
            </div>
            {calendarTab === 'bookings' && <BookingCalendar orgId={org.id} orgTimezone={org.timezone || 'America/New_York'} staff={staff} orgWorkStart={org.work_start || '09:00'} orgWorkEnd={org.work_end || '19:00'} />}
            {calendarTab === 'blocks' && <CalendarBlocks orgId={org.id} staff={staff} />}
          </div>
        )}

        {/* ── Staff ── */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{t.staff.title}</h2>
              {staffTab === 'members' && !editingStaff && (
                atStaffLimit
                  ? <span className="text-xs text-white/40">{staff.length}/{staffLimit === Infinity ? '∞' : staffLimit} staff</span>
                  : <button onClick={() => { setShowAddStaff(true); setEditingStaff(null) }} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">{t.staff.addBtn}</button>
              )}
            </div>
            {staffTab === 'members' && atStaffLimit && staffLimit !== Infinity && (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-3 rounded-xl">
                <span>{t.staff.limitReached}</span>
                <Link href="/billing" className="text-xs font-bold text-[#C9A84C] hover:underline whitespace-nowrap ml-3">{t.staff.upgradeCta}</Link>
              </div>
            )}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
              {STAFF_TABS.map(st => (
                <button key={st} onClick={() => setStaffTab(st)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition ${staffTab === st ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  {st === 'members' ? t.staffTabs.members : t.staffTabs.schedule}
                </button>
              ))}
            </div>
            {staffTab === 'members' && (
              <>
                {showAddStaff && !editingStaff && (
                  <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-[#C9A84C]">{t.staff.newMember}</h3>
                    <AvatarUpload currentUrl={newStaffAvatarUrl} name={newStaffName} path={`staff/tmp-${newStaffTempId}`} onUploaded={url => setNewStaffAvatarUrl(url)} />
                    <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className={inputCls} placeholder={t.staff.namePh} />
                    <input value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} className={inputCls} placeholder={t.staff.rolePh} />
                    <div className="flex gap-2">
                      <button onClick={handleAddStaff} disabled={staffSaving || !newStaffName.trim()} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">{staffSaving ? t.staff.saving : t.staff.add}</button>
                      <button onClick={() => { setShowAddStaff(false); setNewStaffAvatarUrl('') }} className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">{t.staff.cancel}</button>
                    </div>
                  </div>
                )}
                {editingStaff && (
                  <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-[#C9A84C]">{t.staff.editMember}</h3>
                    <AvatarUpload currentUrl={editStaffAvatarUrl} name={editStaffName} path={`staff/${editingStaff.id}`} onUploaded={url => setEditStaffAvatarUrl(url)} />
                    <input value={editStaffName} onChange={e => setEditStaffName(e.target.value)} className={inputCls} placeholder={t.staff.namePh} />
                    <input value={editStaffRole} onChange={e => setEditStaffRole(e.target.value)} className={inputCls} placeholder={t.staff.rolePh} />
                    <div className="flex gap-2">
                      <button onClick={handleSaveStaff} disabled={staffSaving || !editStaffName.trim()} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">{staffSaving ? t.staff.saving : t.staff.save}</button>
                      <button onClick={() => setEditingStaff(null)} className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">{t.staff.cancel}</button>
                    </div>
                  </div>
                )}
                {staff.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">{t.staff.noStaff}</div>
                ) : (
                  <div className="space-y-2">
                    {staff.map(s => (
                      <div key={s.id} className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center justify-between transition ${editingStaff?.id === s.id ? 'border-[#C9A84C]/40' : 'border-white/10'}`}>
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} url={s.avatar_url} size={10} />
                          <div><div className="font-medium">{s.name}</div><div className="text-white/40 text-xs">{s.role || '—'}</div></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setStaffTab('schedule')} className="text-xs text-white/40 hover:text-[#C9A84C] transition border border-white/10 hover:border-[#C9A84C]/30 px-2 py-1 rounded">{t.staff.scheduleBtn}</button>
                          <button onClick={() => openEditStaff(s)} className="text-xs text-white/40 hover:text-[#C9A84C] transition border border-white/10 hover:border-[#C9A84C]/30 px-2 py-1 rounded">{t.staff.editBtn}</button>
                          <button onClick={() => handleDeleteStaff(s.id)} disabled={deletingStaffId === s.id} className="text-xs text-white/40 hover:text-red-400 transition border border-white/10 hover:border-red-400/30 px-2 py-1 rounded disabled:opacity-40">{deletingStaffId === s.id ? '...' : t.staff.removeBtn}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {staffTab === 'schedule' && org && <StaffSchedule orgId={org.id} staff={staff} />}
          </div>
        )}

        {/* ── Services ── */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{t.services.title}</h2>
              {!editingService && <button onClick={() => { setShowAddService(true); setEditingService(null) }} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition">{t.services.addBtn}</button>}
            </div>
            {showAddService && !editingService && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#C9A84C]">{t.services.newService}</h3>
                <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className={inputCls} placeholder={t.services.namePh} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="text-xs text-white/50 mb-1 block">{t.services.priceLabel}</label><input value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} type="number" min="0" step="0.01" className={inputCls} placeholder="25" /></div>
                  <div><label className="text-xs text-white/50 mb-1 block">{t.services.durationLabel}</label><select value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className={inputCls}>{[15,30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}</select></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddService} disabled={serviceSaving || !newServiceName.trim() || !newServicePrice} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">{serviceSaving ? t.services.saving : t.services.add}</button>
                  <button onClick={() => setShowAddService(false)} className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">{t.services.cancel}</button>
                </div>
              </div>
            )}
            {editingService && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#C9A84C]">{t.services.editService}</h3>
                <input value={editServiceName} onChange={e => setEditServiceName(e.target.value)} className={inputCls} placeholder={t.services.namePh} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="text-xs text-white/50 mb-1 block">{t.services.priceLabel}</label><input value={editServicePrice} onChange={e => setEditServicePrice(e.target.value)} type="number" min="0" step="0.01" className={inputCls} placeholder="25" /></div>
                  <div><label className="text-xs text-white/50 mb-1 block">{t.services.durationLabel}</label><select value={editServiceDuration} onChange={e => setEditServiceDuration(e.target.value)} className={inputCls}>{[15,30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}</select></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveService} disabled={serviceSaving || !editServiceName.trim() || !editServicePrice} className="bg-[#C9A84C] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition disabled:opacity-40">{serviceSaving ? t.services.saving : t.services.save}</button>
                  <button onClick={() => setEditingService(null)} className="border border-white/20 text-white/60 text-sm px-4 py-2 rounded hover:border-white/40 transition">{t.services.cancel}</button>
                </div>
              </div>
            )}
            {services.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">{t.services.noServices}</div>
            ) : (
              <div className="space-y-2">
                {services.map(s => (
                  <div key={s.id} className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center justify-between transition ${editingService?.id === s.id ? 'border-[#C9A84C]/40' : 'border-white/10'}`}>
                    <div><div className="font-medium">{s.name}</div><div className="text-white/40 text-xs">{s.duration_min} min</div></div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#C9A84C] font-semibold">${(s.price_cents / 100).toFixed(0)}</span>
                      <button onClick={() => openEditService(s)} className="text-xs text-white/40 hover:text-[#C9A84C] transition border border-white/10 hover:border-[#C9A84C]/30 px-2 py-1 rounded">{t.services.editBtn}</button>
                      <button onClick={() => handleDeleteService(s.id)} disabled={deletingServiceId === s.id} className="text-xs text-white/40 hover:text-red-400 transition border border-white/10 hover:border-red-400/30 px-2 py-1 rounded disabled:opacity-40">{deletingServiceId === s.id ? '...' : t.services.removeBtn}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-lg">
            <h2 className="font-semibold text-lg">{t.settings.title}</h2>

            {/* Salon */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">{t.settings.salon}</h3>
              <div>
                <label className="text-sm text-white/60 mb-1 block">{t.settings.salonName}</label>
                <input value={settingsName} onChange={e => { setSettingsName(e.target.value); setSettingsSlug(generateSlug(e.target.value)) }} className={inputCls} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">{t.settings.bookingUrl}</label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded overflow-hidden focus-within:border-[#C9A84C]">
                  <span className="text-white/30 text-xs px-2 sm:px-3 py-2 border-r border-white/10 whitespace-nowrap">noblelink.app/salon/</span>
                  <input value={settingsSlug} onChange={e => setSettingsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))} className="flex-1 min-w-0 bg-transparent px-2 sm:px-3 py-2 text-white text-sm outline-none font-mono" />
                </div>
                <p className="text-white/30 text-xs mt-1">{t.settings.urlWarning}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">{t.settings.phone}</label>
                  <input value={settingsPhone} onChange={e => setSettingsPhone(e.target.value)} className={inputCls} placeholder="+1 (555) 000-0000" type="tel" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">{t.settings.address}</label>
                  <input value={settingsAddress} onChange={e => setSettingsAddress(e.target.value)} className={inputCls} placeholder="123 Main St, City" />
                </div>
              </div>
            </div>

            {/* Working hours */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">{t.settings.workingHours}</h3>
                <p className="text-white/30 text-xs mt-1">{t.settings.workingHoursSub}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t.settings.opensAt}</label>
                  <TimePicker value={settingsWorkStart} onChange={setSettingsWorkStart} />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t.settings.closesAt}</label>
                  <TimePicker value={settingsWorkEnd} onChange={setSettingsWorkEnd} />
                </div>
              </div>
            </div>

            {/* Manager profile */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">{t.settings.managerProfile}</h3>
              <AvatarUpload currentUrl={settingsOwnerAvatarUrl} name={settingsOwnerName} path={`managers/${org?.id}`} onUploaded={url => setSettingsOwnerAvatarUrl(url)} />
              <div>
                <label className="text-sm text-white/60 mb-1 block">{t.settings.yourName}</label>
                <input value={settingsOwnerName} onChange={e => setSettingsOwnerName(e.target.value)} className={inputCls} placeholder="John Smith" />
              </div>
            </div>

            {/* Social media */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">{t.settings.socialMedia}</h3>
              <p className="text-white/30 text-xs -mt-2">{t.settings.socialSub}</p>
              <div>
                <label className="text-sm text-white/60 mb-1 flex items-center gap-1.5 block"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-pink-400"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>Instagram</label>
                <input value={settingsInstagram} onChange={e => setSettingsInstagram(e.target.value)} className={inputCls} placeholder="https://instagram.com/yoursalon" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 flex items-center gap-1.5 block"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</label>
                <input value={settingsFacebook} onChange={e => setSettingsFacebook(e.target.value)} className={inputCls} placeholder="https://facebook.com/yoursalon" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 flex items-center gap-1.5 block"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>TikTok</label>
                <input value={settingsTiktok} onChange={e => setSettingsTiktok(e.target.value)} className={inputCls} placeholder="https://tiktok.com/@yoursalon" />
              </div>
            </div>

            {settingsError && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{settingsError}</div>}
            <button onClick={handleSaveSettings} disabled={settingsSaving || !settingsName.trim() || !settingsSlug.trim()} className="w-full bg-[#C9A84C] text-black font-bold px-4 py-3 rounded hover:bg-[#e8d08a] transition text-sm disabled:opacity-50">{settingsSaving ? t.settings.saving : t.settings.save}</button>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-3">{t.settings.subscription}</h3>
              <p className="text-white/50 text-sm mb-4">{t.settings.plan}: <span className="text-white capitalize">{org?.plan_id}</span> · {t.settings.status}: <span className="text-white capitalize">{org?.sub_status}</span></p>
              <Link href="/billing" className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded hover:bg-[#e8d08a] transition text-sm">{t.settings.manageBilling}</Link>
            </div>
          </div>
        )}
      </div>
      <FeedbackButton />
    </main>
  )
}
