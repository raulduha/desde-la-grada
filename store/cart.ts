import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  size: string
  price: number
  quantity: number
  image: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const existing = get().items.find(
          (i) => i.productId === newItem.productId && i.size === newItem.size
        )
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          }))
        } else {
          set((state) => ({
            items: [
              ...state.items,
              {
                ...newItem,
                id: `${newItem.productId}-${newItem.size}-${Date.now()}`,
              },
            ],
          }))
        }
      },
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'dlg-cart' }
  )
)
