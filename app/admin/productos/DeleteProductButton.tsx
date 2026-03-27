'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await fetch(`/api/admin/productos/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 px-3 py-1.5 transition-colors font-bold disabled:opacity-50"
        >
          {loading ? '...' : 'Sí'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs uppercase tracking-widest text-white/30 hover:text-white px-2 py-1.5 transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs uppercase tracking-widest text-white/20 hover:text-red-400 border border-transparent hover:border-red-400/30 px-3 py-1.5 transition-colors font-bold"
    >
      Eliminar
    </button>
  )
}
