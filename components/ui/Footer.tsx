import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#131313] w-full py-20 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-full">
        {/* Brand */}
        <div className="flex flex-col justify-between">
          <div>
            <h4
              className="text-white font-black text-4xl opacity-10 mb-8 uppercase italic"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              DLG
            </h4>
            <p className="text-white/30 text-xs uppercase tracking-widest leading-loose max-w-xs">
              Desde La Grada es un movimiento nacido de la pasión de las gradas de fútbol. Creamos
              streetwear oversize para quienes viven la energía del día de partido.
            </p>
          </div>
          <div className="mt-12">
            <p className="text-white/20 font-bold uppercase text-xs tracking-widest">
              © {new Date().getFullYear()} Desde La Grada. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h5
              className="text-white font-black uppercase text-xs tracking-widest mb-6"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Explorar
            </h5>
            <ul className="flex flex-col gap-4">
              {[
                { href: '/tienda', label: 'Novedades' },
                { href: '/tienda', label: 'Colecciones' },
                { href: '/tienda', label: 'Más vendidos' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-white/30 uppercase text-xs tracking-widest hover:text-white transition-colors hover:underline underline-offset-4"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5
              className="text-white font-black uppercase text-xs tracking-widest mb-6"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Soporte
            </h5>
            <ul className="flex flex-col gap-4">
              {[
                { href: '#', label: 'Envíos' },
                { href: '#', label: 'Devoluciones' },
                { href: '#', label: 'Términos' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-white/30 uppercase text-xs tracking-widest hover:text-white transition-colors hover:underline underline-offset-4"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social + CTA */}
        <div className="flex flex-col justify-between">
          <div className="flex flex-col gap-4 items-start md:items-end">
            <div className="flex gap-6">
              <a
                href="#"
                className="text-white/30 uppercase text-xs tracking-widest hover:text-white transition-colors hover:underline underline-offset-4"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-white/30 uppercase text-xs tracking-widest hover:text-white transition-colors hover:underline underline-offset-4"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                TikTok
              </a>
            </div>
            <Link
              href="/carrito"
              className="bg-white text-black px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Ir al carrito
            </Link>
          </div>

          {/* Big watermark */}
          <div className="mt-12 text-right">
            <p
              className="text-white/[0.04] font-black text-6xl md:text-7xl uppercase leading-none tracking-tighter"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              GRADA
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
