import { supabaseAdmin } from '@/lib/supabase/admin'
import ProductForm from '@/components/admin/ProductForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('*, inventory(*)')
    .eq('id', id)
    .single()

  if (error || !product) notFound()

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-2">Editando</p>
        <h1 className="text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          {product.name}
        </h1>
      </div>
      <ProductForm product={product} />
    </div>
  )
}
