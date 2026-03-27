import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import DeleteProductButton from './DeleteProductButton'

export const dynamic = 'force-dynamic'

export default async function AdminProductosPage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*, inventory(*)')
    .order('created_at', { ascending: false })

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-2">Gestión</p>
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Productos
          </h1>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-[#00FF00] text-black font-black uppercase tracking-widest px-6 py-3 text-sm hover:bg-white transition-colors"
        >
          + Nuevo Producto
        </Link>
      </div>

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
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-white/30 font-bold">Producto</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-white/30 font-bold hidden md:table-cell">Categoría</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-white/30 font-bold">Precio</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-white/30 font-bold hidden lg:table-cell">Stock</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-white/30 font-bold">Estado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {(products as Product[]).map((product) => {
                const totalStock = product.inventory?.reduce((sum, i) => sum + i.stock, 0) ?? 0
                return (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 flex-shrink-0 overflow-hidden">
                          {product.cover_image ? (
                            <Image src={product.cover_image} alt={product.name} width={48} height={48} className="w-full h-full object-cover grayscale" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">IMG</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase tracking-wide">{product.name}</p>
                          <p className="text-white/30 text-xs mt-0.5">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs uppercase tracking-widest text-white/50 border border-white/20 px-2 py-1">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`text-sm font-bold ${totalStock === 0 ? 'text-red-400' : totalStock < 5 ? 'text-yellow-400' : 'text-white'}`}>
                        {totalStock} uds
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${product.is_active ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-white/5 text-white/30'}`}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/productos/${product.id}`}
                          className="text-xs uppercase tracking-widest text-white/40 hover:text-white border border-white/20 hover:border-white px-3 py-1.5 transition-colors font-bold"
                        >
                          Editar
                        </Link>
                        <DeleteProductButton id={product.id} name={product.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
