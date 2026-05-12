'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProximamenteActions({
  productId,
}: {
  productId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'launch' | 'remove' | null>(null)

  const update = async (payload: Record<string, unknown>, action: 'launch' | 'remove') => {
    setLoading(action)
    await fetch(`/api/admin/productos/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => update({ is_active: true, coming_soon: false }, 'launch')}
        disabled={!!loading}
        className="w-full bg-white text-black font-black uppercase tracking-widest py-2.5 text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {loading === 'launch' ? 'Lanzando...' : '▶ Lanzar ahora'}
      </button>
      <div className="flex gap-2">
        <Link
          href={`/admin/productos/${productId}`}
          className="flex-1 text-center border border-white/20 text-white/50 font-bold uppercase tracking-wider py-2 text-xs hover:border-white hover:text-white transition-colors"
        >
          Editar
        </Link>
        <button
          onClick={() => update({ coming_soon: false }, 'remove')}
          disabled={!!loading}
          className="flex-1 border border-white/10 text-white/30 font-bold uppercase tracking-wider py-2 text-xs hover:border-red-400/40 hover:text-red-400/60 transition-colors disabled:opacity-50"
        >
          {loading === 'remove' ? '...' : 'Quitar'}
        </button>
      </div>
    </div>
  )
}
