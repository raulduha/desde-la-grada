import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'Nuevo Producto — Admin DLG' }

export default function NuevoProductoPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-2">Nuevo</p>
        <h1 className="text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Crear Producto
        </h1>
      </div>
      <ProductForm />
    </div>
  )
}
