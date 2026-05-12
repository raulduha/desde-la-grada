export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  category: string
  cover_image: string
  images: string[]
  is_active: boolean
  coming_soon: boolean
  created_at: string
  updated_at: string
  inventory?: InventoryItem[]
}

export interface InventoryItem {
  id: string
  product_id: string
  size: string
  stock: number
}

export const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'] as const
export const CATEGORIES = ['Bordado', 'Impresión directa al agua', 'Accesorios', 'General'] as const
