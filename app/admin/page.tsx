import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count: productCount } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Pedidos', value: '0', note: 'Total pedidos' },
    { label: 'Productos', value: String(productCount ?? 0), note: 'En catálogo' },
    { label: 'Usuarios', value: '0', note: 'Registrados' },
    { label: 'Ingresos', value: '$0', note: 'CLP total' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-2">
          Bienvenido
        </p>
        <h1
          className="text-4xl font-black uppercase"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          Panel de Administración
        </h1>
        <p className="text-white/30 text-sm mt-2">
          Sesión como: {user?.email}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-white/10 p-6 hover:border-[#00FF00]/30 transition-colors"
          >
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold">
              {stat.label}
            </p>
            <p
              className="text-4xl font-black mt-2"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {stat.value}
            </p>
            <p className="text-white/20 text-xs mt-1">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Sections coming soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-white/10 p-6">
          <h2
            className="text-lg font-black uppercase mb-4"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Últimos Pedidos
          </h2>
          <div className="flex items-center justify-center py-12 border border-dashed border-white/10">
            <p className="text-white/20 text-sm uppercase tracking-widest">
              Sin pedidos aún
            </p>
          </div>
        </div>

        <div className="border border-white/10 p-6">
          <h2
            className="text-lg font-black uppercase mb-4"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Productos Populares
          </h2>
          <div className="flex items-center justify-center py-12 border border-dashed border-white/10">
            <p className="text-white/20 text-sm uppercase tracking-widest">
              Sin productos aún
            </p>
          </div>
        </div>
      </div>

      {/* Status notice */}
      <div className="mt-8 border border-[#00FF00]/20 bg-[#00FF00]/5 p-4">
        <p className="text-[#00FF00] text-xs uppercase tracking-widest font-bold">
          Estado del sistema
        </p>
        <p className="text-white/50 text-sm mt-1">
          Panel en construcción. Las funcionalidades de gestión de productos,
          pedidos y usuarios se implementarán próximamente.
        </p>
      </div>
    </div>
  )
}
