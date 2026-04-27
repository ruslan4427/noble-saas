'use client'
export type Lang = 'en' | 'es'

export default function LangToggle({ lang, onChange, fixed = false }: { lang: Lang; onChange: (l: Lang) => void; fixed?: boolean }) {
  const style = fixed
    ? { position: 'fixed' as const, top: 16, right: 16, zIndex: 9999, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: 3, gap: 2 }
    : { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: 3, gap: 2 }
  return (
    <div style={style}>
      {(['en', 'es'] as Lang[]).map(l => (
        <button key={l} onClick={() => onChange(l)} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', border: 'none', cursor: 'pointer', minHeight: 28, background: lang === l ? '#C9A84C' : 'transparent', color: lang === l ? '#000' : 'rgba(255,255,255,0.5)' }}>{l}</button>
      ))}
    </div>
  )
}
