import { supabaseAdmin } from '@/lib/supabase/admin'
import { DEFAULT_LANDING, LandingContent } from '@/types/landing'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'DLG — Desde la Grada',
  description: 'Streetwear chileno. Hecho para los que viven el juego desde las gradas.',
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

async function getLandingContent(): Promise<LandingContent> {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('content')
      .eq('id', 'landing')
      .single()
    if (data?.content) {
      return {
        hero: { ...DEFAULT_LANDING.hero, ...data.content.hero },
        editorial: { ...DEFAULT_LANDING.editorial, ...data.content.editorial },
        newsletter: { ...DEFAULT_LANDING.newsletter, ...data.content.newsletter },
      }
    }
  } catch {}
  return DEFAULT_LANDING
}

async function getFeaturedProducts() {
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, price, cover_image')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch {
    return []
  }
}

async function getComingSoonProducts() {
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, name, price, cover_image')
      .eq('coming_soon', true)
      .order('created_at', { ascending: false })
      .limit(4)
    return data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [content, products, comingSoon] = await Promise.all([getLandingContent(), getFeaturedProducts(), getComingSoonProducts()])
  const { hero, editorial, newsletter } = content

  return (
    <div className="bg-[#0e0e0e] text-white">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] w-full overflow-hidden flex items-end justify-start bg-black">
        {/* Background */}
        {hero.image ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.image}
              alt="Hero DLG"
              className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/20 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#131313] to-[#0e0e0e]">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 70px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 70px)',
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 px-6 md:px-12 pb-16 md:pb-24 w-full">
          <div className="max-w-5xl">
            <p
              className="text-white/50 text-xs tracking-[0.35em] mb-5 uppercase font-bold"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {hero.tagline}
            </p>
            <h1
              className="font-black leading-[0.85] uppercase italic tracking-tighter text-white mb-8"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(4rem, 12vw, 9rem)',
              }}
            >
              {hero.headline}
              <br />
              <span className="text-white/80">{hero.accentWord}</span>
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <Link
                href="/tienda"
                className="bg-white text-black px-10 py-5 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors inline-block"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {hero.ctaText}
              </Link>
              <div className="flex items-center gap-4 border-l-2 border-white/15 pl-6">
                <p className="text-xs uppercase tracking-widest text-white/40 max-w-[200px] leading-relaxed">
                  {hero.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical watermark */}
        <div className="absolute right-0 bottom-40 rotate-90 origin-bottom-right px-12 pointer-events-none hidden lg:block">
          <span
            className="font-black text-white/[0.04] uppercase select-none leading-none"
            style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '9rem' }}
          >
            RUIDO DE ESTADIO
          </span>
        </div>
      </section>

      {/* ─── NOVEDADES BENTO ─── */}
      <section className="bg-[#0e0e0e] py-24 px-6 md:px-12">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2
              className="font-black text-5xl uppercase tracking-tighter"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Novedades
            </h2>
            <p className="text-white/40 text-sm tracking-widest uppercase mt-2">Colección actual</p>
          </div>
          <Link
            href="/tienda"
            className="text-white/60 text-sm uppercase tracking-widest border-b-2 border-white/30 pb-1 hover:text-white hover:border-white transition-colors hidden sm:block"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Ver todo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[580px]">
          {/* Large item */}
          {products[0] ? (
            <Link
              href={`/tienda/${products[0].slug}`}
              className="md:col-span-2 md:row-span-2 bg-[#131313] group overflow-hidden relative min-h-[300px]"
            >
              {products[0].cover_image && (
                <Image
                  src={products[0].cover_image}
                  alt={products[0].name}
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-8">
                <span className="bg-white/15 backdrop-blur-sm text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block border border-white/20">
                  Nuevo
                </span>
                <h3
                  className="font-bold text-2xl md:text-3xl uppercase text-white leading-tight drop-shadow-lg"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {products[0].name}
                </h3>
                <p
                  className="text-white/75 text-lg mt-2 font-semibold"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {formatCLP(products[0].price)}
                </p>
              </div>
            </Link>
          ) : (
            <div className="md:col-span-2 md:row-span-2 bg-[#131313] flex items-center justify-center min-h-[300px]">
              <p className="text-white/10 uppercase tracking-widest text-sm">Próximamente</p>
            </div>
          )}

          {/* Item 2 */}
          {products[1] ? (
            <Link
              href={`/tienda/${products[1].slug}`}
              className="bg-[#1a1a1a] group overflow-hidden relative min-h-[200px]"
            >
              {products[1].cover_image && (
                <Image
                  src={products[1].cover_image}
                  alt={products[1].name}
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-5">
                <h3
                  className="font-bold text-sm uppercase text-white"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {products[1].name}
                </h3>
                <p className="text-white/40 text-xs mt-1">{formatCLP(products[1].price)}</p>
              </div>
            </Link>
          ) : (
            <div className="bg-[#1a1a1a] min-h-[200px]" />
          )}

          {/* Item 3 */}
          {products[2] ? (
            <Link
              href={`/tienda/${products[2].slug}`}
              className="bg-[#131313] group overflow-hidden relative min-h-[200px]"
            >
              {products[2].cover_image && (
                <Image
                  src={products[2].cover_image}
                  alt={products[2].name}
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-5">
                <h3
                  className="font-bold text-sm uppercase text-white"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {products[2].name}
                </h3>
                <p className="text-white/40 text-xs mt-1">{formatCLP(products[2].price)}</p>
              </div>
            </Link>
          ) : (
            <div className="bg-[#131313] min-h-[200px]" />
          )}

          {/* Join banner */}
          <div className="md:col-span-2 bg-[#20201f] flex items-center justify-center p-10 md:p-12 relative overflow-hidden min-h-[180px]">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)',
              }}
            />
            <div className="relative z-10 text-center">
              <h3
                className="font-black text-3xl md:text-4xl uppercase italic tracking-tighter mb-3 text-white"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Únete a los Ultras
              </h3>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6">
                Lanzamientos exclusivos para miembros
              </p>
              <Link
                href="/register"
                className="border-2 border-white text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all inline-block"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRÓXIMAMENTE ─── */}
      {comingSoon.length > 0 && (
        <section className="bg-[#131313] py-20 px-6 md:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-white/40 text-xs tracking-[0.5em] uppercase font-bold mb-3">Muy pronto</p>
              <h2
                className="font-black text-4xl md:text-5xl uppercase tracking-tighter"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Próximamente
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comingSoon.map((product) => (
              <div key={product.id} className="group relative overflow-hidden bg-[#0e0e0e]">
                <div className="aspect-square relative overflow-hidden">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={product.name}
                      fill
                      className="object-cover opacity-25 blur-[3px] scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] border border-white/15 px-3 py-1.5 backdrop-blur-sm bg-black/20"
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      Próx.
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p
                    className="font-black uppercase text-sm leading-tight text-white/60"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {product.name}
                  </p>
                  <p className="text-white/30 text-xs mt-1 font-semibold">
                    {formatCLP(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── EDITORIAL ─── */}
      <section className="bg-[#131313] py-24 md:py-32 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 px-6 md:px-12 flex flex-col justify-center py-16 md:py-0">
          <span
            className="text-white/50 text-xs tracking-[0.5em] uppercase mb-6 font-bold"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {editorial.tagline}
          </span>
          <h2
            className="font-black uppercase tracking-tighter leading-none mb-10"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
            }}
          >
            {editorial.headline}
            <br />
            <span className="text-white/25">{editorial.headlineAccent}</span>
          </h2>
          <p className="text-white/55 max-w-md text-base leading-relaxed mb-12">
            {editorial.body}
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/tienda"
              className="bg-white text-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Comprar Colección
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative min-h-[400px] md:min-h-0">
          {editorial.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editorial.image}
                alt="Editorial DLG"
                className="w-full h-full object-cover grayscale absolute inset-0"
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#262626] flex items-center justify-center">
              <p
                className="text-white/10 uppercase tracking-widest text-xs"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Configura imagen editorial
              </p>
            </div>
          )}
          <div
            className="absolute top-8 left-0 bg-white px-5 py-3 text-black font-black text-lg uppercase italic -rotate-1 tracking-tighter z-10"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {editorial.badgeText}
          </div>
        </div>
      </section>

      {/* ─── COMPRAR POR DISEÑO ─── */}
      <section className="bg-[#0e0e0e] py-24 px-6 md:px-12">
        <h2
          className="font-black text-4xl uppercase tracking-tighter mb-16 text-center"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          Comprar por Diseño
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10">
          {[
            { num: '01', title: 'Estadio', desc: 'Planos minimalistas y motivos arquitectónicos del concreto.' },
            { num: '02', title: 'Ultras', desc: 'Tipografía audaz y gráficos de alto contraste.' },
            { num: '03', title: 'Leyenda', desc: 'Iconos inspirados en la herencia del deporte rey.' },
          ].map((item, i) => (
            <Link
              key={item.num}
              href="/tienda"
              className={`p-10 md:p-12 flex flex-col justify-between hover:bg-[#131313] transition-colors group min-h-[300px] md:min-h-[360px] ${
                i < 2 ? 'border-b md:border-b-0 md:border-r border-white/10' : ''
              }`}
            >
              <span
                className="font-black text-7xl text-white/[0.04] group-hover:text-white/[0.07] transition-colors"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {item.num}
              </span>
              <div>
                <h3
                  className="font-black text-3xl uppercase italic mb-4"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {item.title}
                </h3>
                <p className="text-white/35 text-xs uppercase tracking-widest mb-8 leading-relaxed">
                  {item.desc}
                </p>
                <span
                  className="text-white/60 text-xs uppercase tracking-widest font-bold group-hover:translate-x-1 inline-block transition-transform"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  Explorar →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="bg-black py-32 px-6 md:px-12 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 80px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 80px)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2
            className="font-black uppercase tracking-tighter mb-8 italic"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            }}
          >
            {newsletter.headline}{' '}
            <span className="text-white">{newsletter.accentWord}</span>
          </h2>
          <p className="text-xs uppercase tracking-[0.4em] text-white/35 mb-12">
            {newsletter.subtext}
          </p>
          <form className="flex flex-col md:flex-row">
            <input
              type="email"
              placeholder="TU CORREO ELECTRÓNICO"
              className="flex-grow bg-[#262626] border-none p-5 md:p-6 uppercase tracking-widest text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            />
            <button
              type="submit"
              className="bg-white text-black px-10 md:px-12 py-5 md:py-6 font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Unirse al Equipo
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
