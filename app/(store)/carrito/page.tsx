import Link from 'next/link'

export const metadata = {
  title: 'Carrito — DLG',
}

export default function CarritoPage() {
  return (
    <div className="bg-[#0e0e0e] min-h-[80vh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #00FF00 0px, #00FF00 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #00FF00 0px, #00FF00 1px, transparent 1px, transparent 80px)',
        }}
      />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <p className="text-[#00FF00] text-xs tracking-[0.5em] uppercase font-bold mb-6">
          Carrito
        </p>

        <h1
          className="text-[clamp(4rem,15vw,10rem)] font-black uppercase leading-none tracking-tighter text-white"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          PRÓXIMA<br />MENTE
        </h1>

        <div className="mt-4 w-16 h-1 bg-[#00FF00] mx-auto" />

        <p className="mt-10 text-white/50 text-base max-w-sm mx-auto leading-relaxed">
          El sistema de compra estará disponible muy pronto.
        </p>

        <div className="mt-10">
          <Link
            href="/tienda"
            className="bg-[#00FF00] text-black font-black uppercase tracking-widest px-8 py-4 text-sm hover:bg-white transition-colors"
          >
            Ver Tienda
          </Link>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-[#00FF00]/30" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-[#00FF00]/30" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-[#00FF00]/30" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-[#00FF00]/30" />
    </div>
  )
}
