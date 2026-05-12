'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StatusActions({
  productId,
  isActive,
  comingSoon,
}: {
  productId: string
  isActive: boolean
  comingSoon: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const update = async (payload: Record<string, unknown>, key: string) => {
    setLoading(key)
    await fetch(`/api/admin/productos/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Activo */}
      <button
        onClick={() => update({ is_active: true, coming_soon: false }, 'active')}
        disabled={!!loading || isActive}
        title="Publicar en tienda"
        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors disabled:cursor-not-allowed ${
          isActive
            ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/30 opacity-50'
            : 'border-white/20 text-white/50 hover:bg-[#00FF00]/10 hover:text-[#00FF00] hover:border-[#00FF00]/30'
        }`}
      >
        {loading === 'active' ? '...' : 'Activo'}
      </button>

      {/* Próximamente */}
      <button
        onClick={() => update({ is_active: false, coming_soon: true }, 'soon')}
        disabled={!!loading || comingSoon}
        title="Mostrar como próximamente"
        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors disabled:cursor-not-allowed ${
          comingSoon
            ? 'bg-white/10 text-white border-white/30 opacity-50'
            : 'border-white/20 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/30'
        }`}
      >
        {loading === 'soon' ? '...' : 'Próx.'}
      </button>

      {/* Inactivo */}
      <button
        onClick={() => update({ is_active: false, coming_soon: false }, 'inactive')}
        disabled={!!loading || (!isActive && !comingSoon)}
        title="Desactivar"
        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors disabled:cursor-not-allowed ${
          !isActive && !comingSoon
            ? 'border-white/10 text-white/20 opacity-50'
            : 'border-white/10 text-white/30 hover:border-red-400/30 hover:text-red-400/60'
        }`}
      >
        {loading === 'inactive' ? '...' : 'Inactivo'}
      </button>

      {/* Editar */}
      <Link
        href={`/admin/productos/${productId}`}
        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/30 hover:border-white/40 hover:text-white transition-colors"
      >
        Editar
      </Link>
    </div>
  )
}
