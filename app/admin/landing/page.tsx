'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_LANDING, LandingContent } from '@/types/landing'

export default function LandingEditorPage() {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/landing')
      .then((r) => r.json())
      .then((data) => {
        setContent({ ...DEFAULT_LANDING, ...data, hero: { ...DEFAULT_LANDING.hero, ...data.hero }, editorial: { ...DEFAULT_LANDING.editorial, ...data.editorial }, newsletter: { ...DEFAULT_LANDING.newsletter, ...data.newsletter } })
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
    setContent((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }))

  const updateEditorial = (key: keyof LandingContent['editorial'], value: string) =>
    setContent((prev) => ({ ...prev, editorial: { ...prev.editorial, [key]: value } }))

  const updateNewsletter = (key: keyof LandingContent['newsletter'], value: string) =>
    setContent((prev) => ({ ...prev, newsletter: { ...prev.newsletter, [key]: value } }))

  if (loading)
    return (
      <div className="text-white/40 uppercase text-xs tracking-widest pt-8">
        Cargando contenido...
      </div>
    )

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
            className="text-white/30 text-xs uppercase tracking-widest hover:text-white transition-colors"
          >
            Ver sitio →
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 ${
              saved
                ? 'bg-[#00FF00] text-black'
                : 'bg-white text-black hover:bg-[#00FF00]'
            }`}
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* HERO */}
      <EditorSection title="Hero (Sección Principal)">
        <Field label="Imagen de fondo (URL)">
          <input
            value={content.hero.image}
            onChange={(e) => updateHero('image', e.target.value)}
            placeholder="https://tu-imagen.com/foto.jpg"
            className={inputCls}
          />
          {content.hero.image && (
            <div className="mt-2 h-32 overflow-hidden relative bg-[#131313]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.hero.image}
                alt="Preview hero"
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          )}
        </Field>
        <Field label="Tagline (texto verde pequeño arriba)">
          <input
            value={content.hero.tagline}
            onChange={(e) => updateHero('tagline', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Titular — Línea 1 (blanco, grande)">
          <input
            value={content.hero.headline}
            onChange={(e) => updateHero('headline', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Titular — Línea 2 acento (verde, grande)">
          <input
            value={content.hero.accentWord}
            onChange={(e) => updateHero('accentWord', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Descripción (texto pequeño al lado del botón)">
          <textarea
            value={content.hero.description}
            onChange={(e) => updateHero('description', e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
        <Field label="Texto del botón CTA">
          <input
            value={content.hero.ctaText}
            onChange={(e) => updateHero('ctaText', e.target.value)}
            className={inputCls}
          />
        </Field>
      </EditorSection>

      {/* EDITORIAL */}
      <EditorSection title="Sección Editorial">
        <Field label="Imagen (URL)">
          <input
            value={content.editorial.image}
            onChange={(e) => updateEditorial('image', e.target.value)}
            placeholder="https://tu-imagen.com/editorial.jpg"
            className={inputCls}
          />
          {content.editorial.image && (
            <div className="mt-2 h-32 overflow-hidden relative bg-[#131313]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.editorial.image}
                alt="Preview editorial"
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          )}
        </Field>
        <Field label="Tagline (texto verde pequeño)">
          <input
            value={content.editorial.tagline}
            onChange={(e) => updateEditorial('tagline', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Titular — Línea 1">
          <input
            value={content.editorial.headline}
            onChange={(e) => updateEditorial('headline', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Titular — Línea 2 (opaco)">
          <input
            value={content.editorial.headlineAccent}
            onChange={(e) => updateEditorial('headlineAccent', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Cuerpo / Descripción">
          <textarea
            value={content.editorial.body}
            onChange={(e) => updateEditorial('body', e.target.value)}
            rows={4}
            className={inputCls}
          />
        </Field>
        <Field label="Badge esquina (fondo verde)">
          <input
            value={content.editorial.badgeText}
            onChange={(e) => updateEditorial('badgeText', e.target.value)}
            className={inputCls}
          />
        </Field>
      </EditorSection>

      {/* NEWSLETTER */}
      <EditorSection title="Sección Newsletter">
        <Field label="Titular (parte blanca)">
          <input
            value={content.newsletter.headline}
            onChange={(e) => updateNewsletter('headline', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Palabra acento (verde)">
          <input
            value={content.newsletter.accentWord}
            onChange={(e) => updateNewsletter('accentWord', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Subtexto">
          <input
            value={content.newsletter.subtext}
            onChange={(e) => updateNewsletter('subtext', e.target.value)}
            className={inputCls}
          />
        </Field>
      </EditorSection>

      {/* Save bottom */}
      <div className="pt-4 pb-16">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 ${
            saved ? 'bg-[#00FF00] text-black' : 'bg-white text-black hover:bg-[#00FF00]'
          }`}
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {saving ? 'Guardando...' : saved ? '✓ Cambios guardados' : 'Guardar todos los cambios'}
        </button>
      </div>
    </div>
  )
}

const inputCls =
  'w-full bg-[#131313] border-none p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF00] font-mono'

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  )
}
