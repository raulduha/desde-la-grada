import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Link from 'next/link'

export const metadata = {
  title: 'Admin — DLG',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isLoginPage = pathname === '/admin/login' || pathname.endsWith('/admin/login')

  // For the login page, just render children standalone
  if (isLoginPage) {
    return <>{children}</>
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware handles the actual redirect; this is a fallback
  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="bg-[#0e0e0e] min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link
            href="/"
            className="text-xl font-black uppercase tracking-widest text-white hover:text-[#00FF00] transition-colors"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            DLG
          </Link>
          <p className="text-[#00FF00] text-xs tracking-[0.3em] uppercase font-bold mt-1">
            Admin
          </p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          <p className="text-white/20 text-xs uppercase tracking-widest font-bold px-3 py-2 mt-2">
            Panel
          </p>
          <SidebarLink href="/admin" label="Dashboard" />
          <SidebarLink href="/admin/productos" label="Productos" />
          <SidebarLink href="/admin/landing" label="Landing Page" />
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-white/30 text-xs truncate px-3">{user.email}</p>
          <Link
            href="/"
            className="mt-2 block text-xs uppercase tracking-wide text-white/30 hover:text-white px-3 py-1 transition-colors"
          >
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-[#00FF00]" />
            <span className="text-white/30 text-xs uppercase tracking-widest">
              Admin activo
            </span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wide font-bold"
    >
      <span className="text-[#00FF00] text-xs">▪</span>
      {label}
    </Link>
  )
}
