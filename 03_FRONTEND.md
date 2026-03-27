# DLG — FRONTEND SPEC (Next.js 14 + TailwindCSS)

## Identidad Visual DLG

```
Nombre: DESDE LA GRADA (DLG)
Estética: Brutalismo streetwear, inspirado en gradas de estadios europeos
Tipografía: Space Grotesk (headlines, bold/black) + Inter (body/labels)
Paleta base: bg #0e0e0e / text #ffffff
Acento: #00FF00 SOLO para badges de estado activo/nuevo (en el admin)
Sin bordes redondeados: rounded-none en toda la app
Imágenes: grayscale por defecto, color al hover
Botones primarios: bg-white text-black font-black uppercase tracking-widest
```

### Tailwind Config (copiar exactamente)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'surface': '#0e0e0e',
        'surface-container': '#1a1a1a',
        'surface-container-low': '#131313',
        'surface-container-high': '#20201f',
        'surface-container-highest': '#262626',
        'surface-bright': '#2c2c2c',
        'on-surface': '#ffffff',
        'on-surface-variant': '#adaaaa',
        'outline-variant': '#484847',
        'primary': '#ffffff',
        'on-primary': '#000000',
        'accent-green': '#00FF00',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
      },
    },
  },
}
```

### Google Fonts (en layout.tsx)

```typescript
import { Space_Grotesk, Inter } from 'next/font/google'
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] })
const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'] })
```

---

## Estado Global: Carrito (Zustand)

```typescript
// store/cart.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  // Actions
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  // Computed
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(
          i => i.product_id === newItem.product_id && i.size === newItem.size
        )
        if (existing) {
          return {
            items: state.items.map(i =>
              i.product_id === newItem.product_id && i.size === newItem.size
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
            isOpen: true
          }
        }
        return { items: [...state.items, newItem], isOpen: true }
      }),

      removeItem: (productId, size) => set((state) => ({
        items: state.items.filter(i => !(i.product_id === productId && i.size === size))
      })),

      updateQuantity: (productId, size, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(i => !(i.product_id === productId && i.size === size))
          : state.items.map(i =>
              i.product_id === productId && i.size === size ? { ...i, quantity } : i
            )
      })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0),
    }),
    {
      name: 'dlg-cart',
      skipHydration: true, // Evita hydration mismatch en SSR
    }
  )
)
```

---

## COMPONENTES

### NavBar

```typescript
// components/ui/NavBar.tsx
// Props: ninguna (usa useCartStore internamente)
// Comportamiento:
// - Fixed top, z-50, bg blur
// - Logo "DLG" en Space Grotesk italic bold
// - Links: Colecciones | Rebajas | Nosotros
// - Íconos: Persona (→ /admin si admin, sino vacío) | Bolsa de compras con badge count
// - Al click en bolsa → CartDrawer.open()
// - En mobile: hamburger menu (oculta links de nav)
// - Implementar con Material Symbols Outlined (via Google Fonts CDN)

// Código base (adaptar):
'use client'
export function NavBar() {
  const { totalItems, openCart } = useCartStore()
  return (
    <nav className="fixed top-0 w-full z-50 h-20 bg-surface/70 backdrop-blur-xl flex justify-between items-center px-12">
      <a href="/" className="text-3xl font-black italic tracking-tighter text-white font-headline uppercase">DLG</a>
      <div className="hidden md:flex items-center gap-12 font-headline uppercase tracking-tighter">
        <a href="/productos" className="text-white hover:text-white/70 transition-colors">Colecciones</a>
        <a href="/productos?sale=true" className="text-white hover:text-white/70 transition-colors">Rebajas</a>
        <a href="/nosotros" className="text-white hover:text-white/70 transition-colors">Nosotros</a>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={openCart} className="relative hover:bg-surface-container-highest p-2 transition-colors">
          <span className="material-symbols-outlined text-white">shopping_bag</span>
          {totalItems() > 0 && (
            <span className="absolute top-0 right-0 bg-white text-black text-[10px] font-bold px-1 min-w-[18px] text-center">
              {totalItems()}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
```

---

### ProductCard

```typescript
// components/store/ProductCard.tsx
// Props:
interface ProductCardProps {
  product: Product
}

// Comportamiento:
// - Imagen principal (grayscale) → hover: imagen trasera (images[1]) + color
// - Badge de estado: "Nuevo" (accent-green), "Agotado" (gris)
// - Nombre en font-headline font-black uppercase
// - Precio formateado: formatCLP(base_price) → "$89.000"
// - Click → navegar a /productos/[slug]
// - Botón "Compra rápida" aparece al hover (slide up desde bottom)

// Helper para formatear precios CLP:
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount)
}

// El card tiene aspect-[3/4] para las imágenes
// bg-surface-container-low como fondo del card
```

---

### SizePicker

```typescript
// components/store/SizePicker.tsx
interface SizePickerProps {
  inventory: InventoryItem[]
  selectedSize: ClothingSize | null
  onSelect: (size: ClothingSize) => void
}

// Comportamiento:
// - Grid de botones para cada talla: S M L XL 2XL 3XL
// - Si stock_quantity === 0: botón deshabilitado con opacity-30 y cursor-not-allowed
// - Talla seleccionada: bg-white text-black
// - Talla disponible: borde, hover bg-white hover:text-black
// - Mostrar "Elige tu talla" como label superior
// - Link "Guía de tallas" (modal o redirect a /guia-tallas)
```

---

### CartDrawer

```typescript
// components/store/CartDrawer.tsx
// Drawer lateral derecho (slide-in desde la derecha)
// Props: ninguna (usa useCartStore)

// Estructura:
// - Overlay oscuro al fondo (click → cerrar)
// - Panel 400px de ancho (full en mobile)
// - Header: "Tu Carrito" + botón X
// - Lista de items:
//   - Imagen (64x64) | Nombre + Talla | Precio | Controles cantidad
//   - Botón eliminar
// - Footer sticky:
//   - Subtotal
//   - Botón "Ver carrito" → /carrito
//   - Botón "Checkout" → /checkout (si hay items)
// - Si carrito vacío: mensaje "Tu carrito está vacío" + botón "Ver colección"

// Animación: translate-x-full → translate-x-0 con transition-transform duration-300
// Usar Framer Motion si disponible, sino CSS transitions
```

---

### CheckoutForm

```typescript
// components/store/CheckoutForm.tsx
// Formulario de checkout completo (en /checkout page)

// Campos:
// Sección "Datos de contacto":
//   - email (required, validar formato)
//   - name (required)
//   - phone (required, formato +56XXXXXXXXX)

// Sección "Dirección de envío":
//   - street (required)
//   - apartment (optional)
//   - region_id (select con regiones de Chile)
//   - commune_id (select con comunas, filtrado por region_id)
//   - city (auto-completado o manual)

// Sección "Método de pago":
//   - Radio: Webpay Plus (logo Transbank) | MercadoPago (logo MP)

// Sección "Código de descuento":
//   - Input + botón "Aplicar"
//   - Al aplicar: llamar /api/checkout/quote para validar
//   - Mostrar: "Código válido: -$8.900" en verde o error en rojo

// Resumen del pedido (sidebar o sección inferior):
//   - Lista de items del carrito
//   - Subtotal
//   - Descuento (si aplica)
//   - Envío (se calcula al completar la región/comuna)
//   - Total
//   - Botón "Proceder al pago" → llama /api/checkout/init

// Validación con react-hook-form + zod
```

---

## PÁGINAS

### / (Home)

**Componentes:**
1. Hero fullscreen: imagen bg, título "DESDE LA GRADA", CTA "Sólo Oversize"
2. Grid Bento "Novedades" (4 productos destacados, el primero más grande)
3. Sección editorial "La Esencia de la Grada" (50/50 texto + imagen)
4. "Comprar por Diseño" (3 cards: Estadio | Ultras | Leyenda)
5. Newsletter: input email + botón

**Data fetching:** `fetch('/api/productos?limit=4')` en Server Component

---

### /productos (Catálogo)

**Features:**
- Grid 3 columnas (1 en mobile, 2 en tablet)
- Sidebar de filtros: categoría, talla
- Paginación
- Ordenar por: Más populares | Precio | Novedades
- URL params para filtros: `?category=bordado&size=M&page=2`

**Data fetching:** Server Component con `searchParams`

---

### /productos/[slug] (Detalle de Producto)

**Layout:**
- Izquierda (2/3): galería de imágenes (imagen grande + grid de thumbnails)
  - Hover sobre imagen principal: grayscale → color
- Derecha (1/3 sticky): información del producto
  - Nombre (font-headline 5xl black)
  - Precio (formatCLP)
  - Badges (Nuevo, Edición Limitada)
  - Descripción
  - SizePicker
  - Botón "Añadir al carrito" → addItem() + openCart()
  - Íconos: Envío global | Devoluciones 30 días
  - Acordeones: Detalle del producto | Envío y devoluciones

**Generación de paths:** `generateStaticParams` para SSG de todos los productos activos

---

### /carrito

**Layout fullpage del carrito:**
- Lista de items (imagen grande, controles de cantidad, eliminar)
- Sidebar con resumen y campo de descuento
- Botón "Proceder al pago" → /checkout
- Sección "También te puede interesar" (4 productos)

---

### /checkout

**Flujo:**
1. Usuario llena formulario (CheckoutForm)
2. Al cambiar región/comuna: llamar `/api/checkout/quote` para calcular envío (debounced 500ms)
3. Al aplicar código de descuento: llamar `/api/checkout/quote` con el código
4. Al submit: llamar `/api/checkout/init`
5. Si `type === 'webpay'`: `window.location.href = url` (redirect a Transbank)
6. Si `type === 'mercadopago'`: `window.location.href = init_point` (redirect a MP)

**Estados del botón "Proceder al pago":**
- Normal: "Proceder al pago"
- Loading: "Procesando..." + spinner
- Error: mostrar error inline

---

### /checkout/exito

**Params:** `?order_id=uuid`

**Muestra:**
- ✓ grande en verde
- "¡Pedido confirmado!" 
- Número de orden (últimos 8 chars del UUID)
- "Recibirás un email en [customer_email] con los detalles"
- Botón "Seguir comprando" → /productos

---

### /checkout/error

**Params:** `?reason=cancelled|payment_rejected|amount_mismatch|server_error`

**Muestra:**
- X en rojo
- Mensaje según el reason
- Botón "Volver al checkout"

---

### /checkout/webpay/return

Transbank redirige aquí. Esta es la página que hace la validación (ver webhooks spec).
En realidad el webhook POST es el que procesa, esta página solo muestra estado.

---

### /admin/login

```typescript
// app/admin/login/page.tsx
// Botón "Iniciar sesión con Google"
// Llama: supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/admin' } })
// Si ya autenticado → redirect a /admin
```

---

### /admin (Dashboard)

**Layout admin:**
- Sidebar izquierdo con navegación
- Main content area

**Sidebar links:**
- Dashboard (stats)
- Productos
- Órdenes
- Códigos de descuento
- Cerrar sesión

**Dashboard principal:**
```
Stats cards (4):
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Ventas totales │  Órdenes hoy    │ Revenue mes     │  Ticket prom.   │
│   $1.250.000    │      3          │  $580.000       │    $89.000      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

Alerta stock bajo (si hay productos < 5 unidades):
⚠️ "San Siro '90" - Talla M: 2 unidades

Tabla órdenes recientes (últimas 10):
ID | Cliente | Fecha | Monto | Estado (badge color)
```

**Colores de estado (admin):**
- `pending` → badge amarillo
- `paid` → badge accent-green (#00FF00)
- `preparing` → badge azul
- `shipped` → badge púrpura
- `delivered` → badge gris claro
- `cancelled` → badge rojo
- `refunded` → badge naranja

---

### /admin/productos

**Lista con tabla:**
- Imagen (thumbnail 60px)
- Nombre + slug
- Categoría
- Precio (formatCLP)
- Stock total (suma de todas las tallas)
- Estado (Activo/Inactivo toggle)
- Acciones: Editar | Desactivar

**Botón "Nuevo producto" → /admin/productos/nuevo**

---

### /admin/productos/nuevo y /admin/productos/[id]

**ProductForm:**
- Nombre, slug (auto-generado desde nombre, editable)
- Descripción (textarea)
- Precio (input número, en CLP)
- Categoría (select: bordado | serigrafía)
- Upload de imágenes (drag & drop, preview, reordenable)
  - Múltiples archivos
  - Preview de imágenes existentes con botón X para eliminar
- Stock por talla (grid S/M/L/XL/2XL/3XL con inputs numéricos)
- Toggle "Producto activo"
- Botón "Guardar"

---

### /admin/ordenes

**Tabla con filtros:**
- Filtro por estado (tabs o dropdown)
- Búsqueda por email/nombre
- Columnas: ID (corto) | Cliente | Fecha | Items | Total | Estado | Acciones

**OrderDetail (/admin/ordenes/[id]):**
- Info del cliente (email, nombre, teléfono)
- Dirección de envío
- Items de la orden (imagen, nombre, talla, cantidad, precio)
- Totales (subtotal, descuento, envío, total)
- Historial de estado
- Formulario de actualización:
  - Cambiar estado (select)
  - Número de tracking + URL de tracking
  - Botón "Guardar cambios"

---

### /admin/descuentos

**Lista de códigos con tabla:**
- Código | Tipo | Valor | Usos (X/max) | Vencimiento | Estado | Acciones

**DiscountForm (inline o modal):**
- Código (uppercase auto)
- Tipo (porcentaje / monto fijo)
- Valor (con label dinámico: "%" o "$")
- Monto mínimo de orden
- Máximo de usos (vacío = ilimitado)
- Fecha de vencimiento (picker, vacío = no expira)
- Toggle activo/inactivo

---

## PÁGINAS ADICIONALES

### /guia-tallas (Página o Modal)

Tabla comparativa de tallas S/M/L/XL/2XL/3XL con medidas en cm.

---

## DEPENDENCIAS npm

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "typescript": "5.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.x",
    "zustand": "^4.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "transbank-sdk": "^4.x",
    "mercadopago": "^2.x",
    "resend": "^3.x",
    "tailwindcss": "^3.x",
    "framer-motion": "^11.x"
  }
}
```
