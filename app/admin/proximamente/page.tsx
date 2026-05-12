import { supabaseAdmin } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import ProximamenteActions from './ProximamenteActions'

export const dynamic = 'force-dynamic'

export default async function ProximamentePage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*, inventory(*)')
    .eq('coming_soon', true)
    .order('created_at', { ascending: false })

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-2">Gestión</p>
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Próximamente
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Aparecen en el sitio como vista previa. Presiona <strong className="text-white/60">Lanzar</strong> para publicarlos.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-[#00FF00] text-black font-black uppercase tracking-widest px-6 py-3 text-sm hover:bg-white transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {(!products || products.length === 0) ? (
        <div className="border border-dashed border-white/10 flex flex-col items-center justify-center py-24 mt-8">
          <p className="text-white/20 text-sm uppercase tracking-widest mb-2">Sin productos próximamente</p>
          <p className="text-white/10 text-xs mb-8">
            Al crear un producto, selecciona el estado <span className="text-white/30">◷ Próximamente</span>
          </p>
          <Link
            href="/admin/productos/nuevo"
            className="border border-white/30 text-white/50 font-bold uppercase tracking-wider px-6 py-3 text-xs hover:border-white hover:text-white transition-colors"
          >
            Crear producto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products as Product[]).map((product) => (
            <div key={product.id} className="border border-white/10 bg-[#131313]">
              <div className="relative aspect-square overflow-hidden bg-white/5">
                {product.cover_image ? (
                  <Image
                    src={product.cover_image}
                    alt={product.name}
                    fill
                    className="object-cover opacity-40 blur-sm"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/10 text-xs uppercase tracking-widest">Sin imagen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-white/80 text-xs font-black uppercase tracking-[0.4em] border border-white/30 px-4 py-2 bg-black/40 backdrop-blur-sm"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    Próximamente
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3
                  className="font-black uppercase text-sm leading-tight text-white mb-1"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {product.name}
                </h3>
                <p className="text-white/40 text-xs mb-4">{formatPrice(product.price)}</p>
                <ProximamenteActions productId={product.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
