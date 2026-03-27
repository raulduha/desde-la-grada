'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const totalItems = useCartStore((state) => state.totalItems)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0e0e0e]/90 backdrop-blur-xl' : 'bg-[#0e0e0e]/60 backdrop-blur-xl'
      }`}
    >
      <div className="flex items-center justify-between h-20 px-6 md:px-12">
        {/* Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-3xl font-black italic tracking-tighter text-white hover:text-[#00FF00] transition-colors"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            DLG
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '/tienda', label: 'Colecciones' },
              { href: '/tienda', label: 'Novedades' },
              { href: '/#about', label: 'Sobre nosotros' },
            ].map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-bold uppercase tracking-tight text-white/70 hover:text-white transition-colors"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link
            href="/carrito"
            className="relative p-2 hover:bg-white/5 transition-colors"
            aria-label="Carrito"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="text-white"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems() > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00FF00]" />
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <div className="flex flex-col gap-1.5 w-5">
              <span
                className={`block h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
              />
              <span
                className={`block h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {[
            { href: '/tienda', label: 'Colecciones' },
            { href: '/tienda', label: 'Novedades' },
            { href: '/carrito', label: 'Carrito' },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
