import { supabaseAdmin } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import StatusActions from './StatusActions'

export const dynamic = 'force-dynamic'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

function StatusBadge({ product }: { product: Product }) {
  if (product.coming_soon)
    return <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 border border-white/20 text-white/60">Próximamente</span>
  if (product.is_active)
    return <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20">Activo</span>
  return <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 border border-white/10 text-white/30">Inactivo</span>
}

export default async function ProximamentePage() {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*, inventory(*)')
    .order('coming_soon', { ascending: false })
    .order('created_at', { ascending: false })

  const comingSoonCount = products?.filter((p) => p.coming_soon).length ?? 0

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-2">Gestión</p>
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Estado Productos
          </h1>
          <p className="text-white/30 text-sm mt-2">
            {comingSoonCount > 0
              ? `${comingSoonCount} producto${comingSoonCount !== 1 ? 's' : ''} marcado${comingSoonCount !== 1 ? 's' : ''} como Próximamente`
              : 'Gestiona qué productos aparecen activos o como próximamente'}
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-[#00FF00] text-black font-black uppercase tracking-widest px-6 py-3 text-sm hover:bg-white transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {error && (
        <div className="mb-6 border border-red-400/30 bg-red-400/5 px-5 py-4">
          <p className="text-red-400 text-xs uppercase tracking-widest font-bold mb-1">Error al cargar productos</p>
          <p className="text-red-400/60 text-xs">{error.message}</p>
          <p className="text-white/30 text-xs mt-3">
            Si el error menciona <code className="text-white/50">coming_soon</code>, ejecuta en Supabase SQL Editor:
            <br />
            <code className="text-white/50 mt-1 block">ALTER TABLE products ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN DEFAULT false;</code>
          </p>
        </div>
      )}

      {(!products || products.length === 0) ? (
        <div className="border border-dashed border-white/10 flex flex-col items-center justify-center py-24">
          <p className="text-white/20 text-sm uppercase tracking-widest mb-4">Sin productos aún</p>
          <Link
            href="/admin/productos/nuevo"
            className="border border-white/30 text-white/50 font-bold uppercase tracking-wider px-6 py-3 text-xs hover:border-white hover:text-white transition-colors"
          >
            Crear primer producto
          </Link>
        </div>
      ) : (
        <div className="border border-white/10">
          {/* Legend */}
          <div className="px-6 py-3 border-b border-white/5 flex gap-4 items-center">
            <span className="text-white/20 text-xs uppercase tracking-widest">Estados:</span>
            <span className="text-[10px] px-2 py-0.5 bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20 font-bold uppercase tracking-widest">Activo</span>
            <span className="text-[10px] px-2 py-0.5 border border-white/20 text-white/60 font-bold uppercase tracking-widest">Próximamente</span>
            <span className="text-[10px] px-2 py-0.5 border border-white/10 text-white/30 font-bold uppercase tracking-widest">Inactivo</span>
          </div>

          {(products as Product[]).map((product) => (
            <div key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <div className="px-6 py-4 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-12 h-12 flex-shrink-0 bg-white/5 relative overflow-hidden">
                  {product.cover_image ? (
                    <Image src={product.cover_image} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">IMG</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-sm uppercase tracking-wide truncate">{product.name}</p>
                    <StatusBadge product={product} />
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">{formatPrice(product.price)}</p>
                </div>

                {/* Actions */}
                <StatusActions
                  productId={product.id}
                  isActive={product.is_active}
                  comingSoon={product.coming_soon}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
