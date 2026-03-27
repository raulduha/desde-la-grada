'use client'

import { useState, useEffect, useRef } from 'react'
import { DEFAULT_LANDING, LandingContent } from '@/types/landing'

// ─── Image Upload Field ───────────────────────────────────────────────────────

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
      onChange(data.url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>

      {/* Preview */}
      {value && (
        <div className="mb-3 relative h-36 bg-[#131313] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover opacity-70" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/70 text-white/60 hover:text-white text-xs px-2 py-1 uppercase tracking-widest transition-colors"
          >
            ✕ Quitar
          </button>
        </div>
      )}

      {/* Upload button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-[#262626] text-white px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#00FF00] hover:text-black transition-colors disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {uploading ? (
            <>
              <span className="inline-block w-3 h-3 border border-white/40 border-t-white animate-spin" />
              Subiendo...
            </>
          ) : (
            <>📷 Subir imagen</>
          )}
        </button>

        {/* URL manual */}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="o pega una URL..."
          className="flex-1 bg-[#131313] border-none p-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono min-w-0"
        />
      </div>

      {/* Hidden file input — accept image/*, permite cámara en móvil */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {error && <p className="text-red-400 text-xs mt-2 uppercase tracking-widest">{error}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingEditorPage() {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/landing')
      .then((r) => r.json())
      .then((data) => {
        setContent({
          hero: { ...DEFAULT_LANDING.hero, ...data.hero },
          editorial: { ...DEFAULT_LANDING.editorial, ...data.editorial },
          newsletter: { ...DEFAULT_LANDING.newsletter, ...data.newsletter },
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const updateHero = (key: keyof LandingContent['hero'], value: string) =>
    setContent((p) => ({ ...p, hero: { ...p.hero, [key]: value } }))

  const updateEditorial = (key: keyof LandingContent['editorial'], value: string) =>
    setContent((p) => ({ ...p, editorial: { ...p.editorial, [key]: value } }))

  const updateNewsletter = (key: keyof LandingContent['newsletter'], value: string) =>
    setContent((p) => ({ ...p, newsletter: { ...p.newsletter, [key]: value } }))

  if (loading)
    return <div className="text-white/40 uppercase text-xs tracking-widest pt-8">Cargando...</div>

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1
            className="text-3xl font-black uppercase tracking-tighter text-white"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Landing Page
          </h1>
          <p className="text-white/30 text-xs uppercase tracking-widest mt-1">
            Editor de contenido del inicio
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            target="_blank"
            className="text-white/30 text-xs uppercase tracking-widest hover:text-white transition-colors hidden sm:block"
          >
            Ver sitio →
          </a>
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>

      {/* ── HERO ── */}
      <Section title="Hero (Sección Principal)">
        <ImageUploadField
          label="Imagen de fondo"
          value={content.hero.image}
          onChange={(url) => updateHero('image', url)}
        />
        <TextField
          label="Tagline (texto verde pequeño arriba)"
          value={content.hero.tagline}
          onChange={(v) => updateHero('tagline', v)}
        />
        <TextField
          label="Titular — Línea 1 (blanco, gigante)"
          value={content.hero.headline}
          onChange={(v) => updateHero('headline', v)}
        />
        <TextField
          label="Titular — Línea 2 acento (verde, gigante)"
          value={content.hero.accentWord}
          onChange={(v) => updateHero('accentWord', v)}
        />
        <TextField
          label="Descripción (al lado del botón)"
          value={content.hero.description}
          onChange={(v) => updateHero('description', v)}
          multiline
        />
        <TextField
          label="Texto del botón CTA"
          value={content.hero.ctaText}
          onChange={(v) => updateHero('ctaText', v)}
        />
      </Section>

      {/* ── EDITORIAL ── */}
      <Section title="Sección Editorial">
        <ImageUploadField
          label="Imagen editorial"
          value={content.editorial.image}
          onChange={(url) => updateEditorial('image', url)}
        />
        <TextField
          label="Tagline (texto verde pequeño)"
          value={content.editorial.tagline}
          onChange={(v) => updateEditorial('tagline', v)}
        />
        <TextField
          label="Titular — Línea 1"
          value={content.editorial.headline}
          onChange={(v) => updateEditorial('headline', v)}
        />
        <TextField
          label="Titular — Línea 2 (opaco)"
          value={content.editorial.headlineAccent}
          onChange={(v) => updateEditorial('headlineAccent', v)}
        />
        <TextField
          label="Descripción"
          value={content.editorial.body}
          onChange={(v) => updateEditorial('body', v)}
          multiline
        />
        <TextField
          label="Badge esquina (fondo verde)"
          value={content.editorial.badgeText}
          onChange={(v) => updateEditorial('badgeText', v)}
        />
      </Section>

      {/* ── NEWSLETTER ── */}
      <Section title="Newsletter">
        <TextField
          label="Titular (parte blanca)"
          value={content.newsletter.headline}
          onChange={(v) => updateNewsletter('headline', v)}
        />
        <TextField
          label="Palabra acento (verde)"
          value={content.newsletter.accentWord}
          onChange={(v) => updateNewsletter('accentWord', v)}
        />
        <TextField
          label="Subtexto"
          value={content.newsletter.subtext}
          onChange={(v) => updateNewsletter('subtext', v)}
        />
      </Section>

      {/* Bottom save */}
      <div className="pt-2 pb-16">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} full />
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 border-l-2 border-white/10 pl-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#00FF00] text-xs">▪</span>
        <h2
          className="text-white font-black uppercase tracking-wider text-sm"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  const cls =
    'w-full bg-[#131313] border-none p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono'
  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}

function SaveButton({
  saving,
  saved,
  onClick,
  full,
}: {
  saving: boolean
  saved: boolean
  onClick: () => void
  full?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`${full ? 'w-full py-4' : 'px-8 py-3'} font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 ${
        saved ? 'bg-[#00FF00] text-black' : 'bg-white text-black hover:bg-[#00FF00]'
      }`}
      style={{ fontFamily: 'var(--font-space-grotesk)' }}
    >
      {saving ? 'Guardando...' : saved ? '✓ Guardado' : full ? 'Guardar todos los cambios' : 'Guardar'}
    </button>
  )
}
