'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SIZES, CATEGORIES, Product } from '@/types'

interface InventoryInput {
  size: string
  stock: number
}

interface ProductFormProps {
  product?: Product
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [category, setCategory] = useState(product?.category ?? 'General')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [comingSoon, setComingSoon] = useState(product?.coming_soon ?? false)
  const [coverImage, setCoverImage] = useState(product?.cover_image ?? '')
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [inventory, setInventory] = useState<InventoryInput[]>(
    SIZES.map(size => ({
      size,
      stock: product?.inventory?.find(i => i.size === size)?.stock ?? 0,
    }))
  )

  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManuallyEdited) setSlug(slugify(val))
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const text = await res.text()
      let msg = 'Error al subir'
      try { msg = JSON.parse(text).error ?? msg } catch {
        if (res.status === 413) msg = 'Imagen demasiado grande (máx 20MB)'
        else msg = `Error ${res.status}`
      }
      throw new Error(msg)
    }
    const data = await res.json()
    return data.url
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await uploadImage(file)
      setCoverImage(url)
    } catch {
      setError('Error al subir imagen de portada')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleExtraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploadingExtra(true)
    try {
      const urls = await Promise.all(files.map(uploadImage))
      setImages(prev => [...prev, ...urls])
    } catch {
      setError('Error al subir imágenes adicionales')
    } finally {
      setUploadingExtra(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      name,
      slug,
      description,
      price: parseInt(price),
      category,
      cover_image: coverImage,
      images,
      is_active: isActive,
      coming_soon: comingSoon,
      inventory,
    }

    const url = isEditing ? `/api/admin/productos/${product!.id}` : '/api/admin/productos'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
      setSaving(false)
      return
    }

    router.push('/admin/productos')
    router.refresh()
  }

  const inputClass = "w-full bg-white/5 border border-white/20 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors placeholder:text-white/20"
  const labelClass = "block text-xs uppercase tracking-widest text-white/50 mb-2 font-bold"

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">

      {/* Name + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Nombre del producto *</label>
          <input
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Ej: Polera Estadio"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug (URL) *</label>
          <input
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
            placeholder="polera-estadio"
            required
            className={inputClass}
          />
          <p className="text-white/20 text-xs mt-1">Se usa en la URL: /productos/{slug || '...'}</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Descripción</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descripción del producto..."
          rows={4}
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Price + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Precio (CLP) *</label>
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            min="0"
            placeholder="25000"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Categoría</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className={inputClass + ' cursor-pointer'}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-[#0e0e0e]">{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className={labelClass}>Estado del producto</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => { setIsActive(true); setComingSoon(false) }}
            className={`py-3 px-4 text-sm font-black uppercase tracking-widest transition-colors border ${
              isActive && !comingSoon
                ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/30'
                : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'
            }`}
          >
            ● Activo
          </button>
          <button
            type="button"
            onClick={() => { setIsActive(false); setComingSoon(false) }}
            className={`py-3 px-4 text-sm font-black uppercase tracking-widest transition-colors border ${
              !isActive && !comingSoon
                ? 'bg-white/10 text-white border-white/30'
                : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'
            }`}
          >
            ○ Inactivo
          </button>
          <button
            type="button"
            onClick={() => { setIsActive(false); setComingSoon(true) }}
            className={`py-3 px-4 text-sm font-black uppercase tracking-widest transition-colors border ${
              comingSoon
                ? 'bg-white/10 text-white border-white/40'
                : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'
            }`}
          >
            ◷ Próximamente
          </button>
        </div>
        {comingSoon && (
          <p className="text-white/30 text-xs mt-2">Se mostrará en el sitio como vista previa. No estará disponible para compra.</p>
        )}
      </div>

      {/* Cover Image */}
      <div>
        <label className={labelClass}>Foto de portada</label>
        <div className="flex gap-4 items-start">
          <div
            className="w-40 h-40 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:border-[#00FF00]/50 transition-colors relative"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverImage ? (
              <Image src={coverImage} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="text-center">
                <p className="text-white/20 text-xs uppercase tracking-widest">
                  {uploadingCover ? 'Subiendo...' : 'Click para subir'}
                </p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="border border-white/30 text-white/50 font-bold uppercase tracking-wider px-4 py-2 text-xs hover:border-white hover:text-white transition-colors disabled:opacity-50"
            >
              {uploadingCover ? 'Subiendo...' : coverImage ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            {coverImage && (
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="ml-2 text-xs text-red-400/50 hover:text-red-400 transition-colors"
              >
                Quitar
              </button>
            )}
            <p className="text-white/20 text-xs mt-2">JPG, PNG, WEBP. Recomendado 800×800px.</p>
          </div>
        </div>
      </div>

      {/* Additional Images */}
      <div>
        <label className={labelClass}>Imágenes adicionales</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 border border-white/20 overflow-hidden group">
              <Image src={img} alt={`img-${i}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 text-xs font-bold uppercase"
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => extraInputRef.current?.click()}
            disabled={uploadingExtra}
            className="w-24 h-24 border border-dashed border-white/20 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest hover:border-white/40 hover:text-white/40 transition-colors disabled:opacity-50"
          >
            {uploadingExtra ? '...' : '+ Agregar'}
          </button>
        </div>
        <input
          ref={extraInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleExtraUpload}
          className="hidden"
        />
      </div>

      {/* Inventory / Sizes */}
      <div>
        <label className={labelClass}>Stock por talla</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {inventory.map((item, i) => (
            <div key={item.size} className="border border-white/20 p-3 text-center hover:border-white/40 transition-colors">
              <p className="text-white/50 text-xs uppercase font-bold mb-2">{item.size}</p>
              <input
                type="number"
                min="0"
                value={item.stock}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0
                  setInventory(prev => prev.map((inv, j) => j === i ? { ...inv, stock: val } : inv))
                }}
                className="w-full bg-transparent text-center text-white font-black text-lg focus:outline-none focus:text-[#00FF00] transition-colors"
              />
              <p className="text-white/20 text-xs mt-1">uds</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-400/30 bg-red-400/5 px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#00FF00] text-black font-black uppercase tracking-widest px-8 py-4 text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
        </button>
        <a
          href="/admin/productos"
          className="text-white/30 text-sm uppercase tracking-wide hover:text-white transition-colors font-bold"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
