import { supabaseAdmin } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tienda — DLG',
  description: 'Colección Desde la Grada. Streetwear chileno.',
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function TiendaPage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*, inventory(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-[#0e0e0e] min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 px-6 md:px-12 py-12">
        <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-3">
          Colección
        </p>
        <h1
          className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          TIENDA
        </h1>
        <p className="text-white/30 text-sm mt-4">
          {products?.length ?? 0} producto{(products?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid */}
      <div className="px-6 md:px-12 py-12">
        {!products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-white/20 text-sm uppercase tracking-widest">
              Productos en camino
            </p>
            <p className="text-white/10 text-xs mt-2">Vuelve pronto</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5">
            {(products as Product[]).map((product) => {
              const totalStock =
                product.inventory?.reduce((sum, i) => sum + i.stock, 0) ?? 0
              const soldOut = totalStock === 0

              return (
                <Link
                  key={product.id}
                  href={`/tienda/${product.slug}`}
                  className="group bg-[#0e0e0e] block relative overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-square bg-white/5 overflow-hidden relative">
                    {product.cover_image ? (
                      <Image
                        src={product.cover_image}
                        alt={product.name}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/10 text-xs uppercase tracking-widest">
                          DLG
                        </span>
                      </div>
                    )}

                    {/* Sold out overlay */}
                    {soldOut && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white/60 text-xs uppercase tracking-widest font-bold border border-white/20 px-3 py-1">
                          Agotado
                        </span>
                      </div>
                    )}

                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p
                      className="font-black uppercase text-sm leading-tight group-hover:text-[#00FF00] transition-colors"
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      {product.name}
                    </p>
                    <p className="text-white/50 text-sm font-bold mt-1">
                      {formatPrice(product.price)}
                    </p>

                    {/* Sizes available */}
                    {product.inventory && product.inventory.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {product.inventory
                          .filter((i) => i.stock > 0)
                          .map((i) => (
                            <span
                              key={i.size}
                              className="text-white/30 text-xs border border-white/10 px-1.5 py-0.5"
                            >
                              {i.size}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
