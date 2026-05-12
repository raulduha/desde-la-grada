'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/proximamente', label: 'Próximamente' },
  { href: '/admin/landing', label: 'Landing Page' },
]

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode
  email: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="bg-[#0e0e0e] min-h-screen flex flex-col md:flex-row">
      {/* ── Mobile top bar ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/10">
        <Link
          href="/"
          className="text-xl font-black italic tracking-tighter text-white"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          DLG
          <span className="text-[#00FF00] text-xs font-bold tracking-[0.3em] uppercase ml-2 not-italic">
            Admin
          </span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-white hover:bg-white/5 transition-colors"
          aria-label="Menú"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {open && (
        <div className="md:hidden bg-[#131313] border-b border-white/10 px-4 py-4 flex flex-col gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-wide font-bold transition-colors ${
                pathname === href
                  ? 'text-[#00FF00] bg-white/5'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-[#00FF00] text-xs">▪</span>
              {label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/30 text-xs truncate px-3 mb-2">{email}</p>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-wide text-white/30 hover:text-white px-3 py-1 transition-colors block"
            >
              ← Volver al sitio
            </Link>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 border-r border-white/10 flex-shrink-0 flex-col">
        <div className="p-5 border-b border-white/10">
          <Link
            href="/"
            className="text-xl font-black italic tracking-tighter text-white hover:text-[#00FF00] transition-colors"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            DLG
          </Link>
          <p className="text-[#00FF00] text-xs tracking-[0.3em] uppercase font-bold mt-1">Admin</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 text-sm uppercase tracking-wide font-bold transition-colors ${
                pathname === href
                  ? 'text-white bg-white/5'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-[#00FF00] text-xs">▪</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-white/30 text-xs truncate px-3">{email}</p>
          <Link
            href="/"
            className="mt-2 block text-xs uppercase tracking-wide text-white/30 hover:text-white px-3 py-1 transition-colors"
          >
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar */}
        <header className="hidden md:flex border-b border-white/10 px-6 py-3 items-center justify-end">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#00FF00]" />
            <span className="text-white/30 text-xs uppercase tracking-widest">Admin activo</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
