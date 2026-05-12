'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { Product, SIZES } from '@/types'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function ProductoDetallePage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/api/productos/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [slug])

  if (loading) {
    return (
      <div className="bg-[#0e0e0e] min-h-screen flex items-center justify-center">
        <p className="text-white/20 text-xs uppercase tracking-widest">Cargando...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-[#0e0e0e] min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/30 text-sm uppercase tracking-widest">Producto no encontrado</p>
        <Link href="/tienda" className="text-white/50 text-xs uppercase tracking-widest hover:text-white transition-colors">
          ← Volver a la tienda
        </Link>
      </div>
    )
  }

  const allImages = [product.cover_image, ...product.images].filter(Boolean)
  const totalStock = product.inventory?.reduce((sum, i) => sum + i.stock, 0) ?? 0

  const stockForSize = (size: string) =>
    product.inventory?.find((i) => i.size === size)?.stock ?? 0

  return (
    <div className="bg-[#0e0e0e] min-h-screen">
      {/* Breadcrumb */}
      <div className="px-6 md:px-12 py-4 border-b border-white/10">
        <p className="text-white/30 text-xs uppercase tracking-widest">
          <Link href="/tienda" className="hover:text-white transition-colors">Tienda</Link>
          <span className="mx-2 text-white/10">/</span>
          <span className="text-white/60">{product.name}</span>
        </p>
      </div>

      <div className="px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl">

        {/* Images */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square bg-white/5 relative overflow-hidden">
            {allImages[selectedImage] ? (
              <Image
                src={allImages[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/10 text-2xl font-black uppercase tracking-widest">DLG</span>
              </div>
            )}

            {totalStock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="border border-white/30 text-white/60 text-xs uppercase tracking-widest px-4 py-2 font-bold">
                  Agotado
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 relative overflow-hidden border transition-colors ${
                    selectedImage === i ? 'border-white' : 'border-white/20 hover:border-white/50'
                  }`}
                >
                  <Image src={img} alt={`img-${i}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-3">
            {product.category}
          </p>

          <h1
            className="text-4xl md:text-5xl font-black uppercase leading-tight tracking-tighter"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {product.name}
          </h1>

          <p className="text-3xl font-black mt-4 text-white">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="text-white/50 text-sm leading-relaxed mt-6">
              {product.description}
            </p>
          )}

          {/* Size selector */}
          {product.inventory && product.inventory.length > 0 && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3">
                Talla {selectedSize && <span className="text-white ml-2">{selectedSize}</span>}
              </p>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((size) => {
                  const stock = stockForSize(size)
                  const available = stock > 0
                  const selected = selectedSize === size
                  return (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      className={`w-14 h-14 text-sm font-black uppercase border transition-colors ${
                        selected
                          ? 'border-white bg-white text-black'
                          : available
                          ? 'border-white/30 text-white hover:border-white'
                          : 'border-white/10 text-white/15 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
              {selectedSize && stockForSize(selectedSize) <= 3 && (
                <p className="text-yellow-400 text-xs uppercase tracking-widest mt-2 font-bold">
                  ¡Últimas {stockForSize(selectedSize)} unidades!
                </p>
              )}
            </div>
          )}

          {/* Add to cart — próximamente */}
          <div className="mt-8 space-y-3">
            <button
              disabled
              className="w-full bg-white/10 text-white/30 font-black uppercase tracking-widest py-4 text-sm cursor-not-allowed border border-white/10"
            >
              Compra disponible próximamente
            </button>
            <Link
              href="/tienda"
              className="block text-center text-white/30 text-xs uppercase tracking-widest hover:text-white transition-colors py-2"
            >
              ← Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
