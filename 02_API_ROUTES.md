# DLG — API ROUTES SPEC (Next.js App Router)

## Convenciones Generales

- Todos los endpoints retornan `application/json`
- Errores siguen el formato: `{ error: string, code?: string }`
- Todos los montos en CLP (integer, sin decimales)
- Los endpoints `/api/admin/*` requieren autenticación Google OAuth via Supabase
- Usar `supabaseAdmin` (service role) en server-side para saltarse RLS cuando se necesita
- Rate limiting: implementar con Vercel Edge Config o `@upstash/ratelimit`

## Tipos TypeScript Base

```typescript
// types/index.ts

export type ProductCategory = 'bordado' | 'serigrafia'
export type ClothingSize = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentGateway = 'webpay' | 'mercadopago'
export type DiscountType = 'percentage' | 'fixed'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  base_price: number
  category: ProductCategory
  images: string[]
  is_active: boolean
  created_at: string
  inventory?: InventoryItem[]
}

export interface InventoryItem {
  size: ClothingSize
  stock_quantity: number
}

export interface CartItem {
  product_id: string
  product_name: string
  product_slug: string
  product_image: string
  size: ClothingSize
  quantity: number
  unit_price: number
}

export interface ShippingAddress {
  street: string
  apartment?: string
  commune: string
  commune_id: number
  region: string
  region_id: number
  city: string
  zip_code?: string
}

export interface CheckoutPayload {
  items: CartItem[]
  customer: {
    email: string
    name: string
    phone?: string
  }
  shipping_address: ShippingAddress
  payment_gateway: PaymentGateway
  discount_code?: string
}

export interface Order {
  id: string
  customer_email: string
  customer_name: string
  shipping_address: ShippingAddress
  subtotal: number
  discount_amount: number
  shipping_cost: number
  total_amount: number
  discount_code_used?: string
  status: OrderStatus
  payment_gateway?: PaymentGateway
  tracking_number?: string
  tracking_url?: string
  created_at: string
  paid_at?: string
  items?: OrderItem[]
}

export interface OrderItem {
  product_name: string
  product_slug: string
  product_image?: string
  size: ClothingSize
  quantity: number
  unit_price: number
  total_price: number
}

export interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  min_order_amount: number
  max_uses?: number
  uses_count: number
  is_active: boolean
  expires_at?: string
}
```

---

## ENDPOINTS PÚBLICOS

---

### GET /api/productos

**Descripción:** Lista todos los productos activos con stock agregado.

**Query params:**
- `category?: 'bordado' | 'serigrafia'`
- `page?: number` (default: 1)
- `limit?: number` (default: 12)

**Implementación:**
```typescript
// app/api/productos/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '12')
  const offset = (page - 1) * limit

  const supabase = createSupabaseServerClient()

  let query = supabase
    .from('products')
    .select(`
      id, name, slug, description, base_price, category, images, created_at,
      inventory(size, stock_quantity)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq('category', category)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Error fetching products' }, { status: 500 })

  return NextResponse.json({
    products: data,
    pagination: { page, limit, total: count }
  })
}
```

**Response 200:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Sudadera Terrace Concrete",
      "slug": "sudadera-terrace-concrete",
      "description": "...",
      "base_price": 89000,
      "category": "bordado",
      "images": ["https://..."],
      "inventory": [
        { "size": "S", "stock_quantity": 5 },
        { "size": "M", "stock_quantity": 0 },
        { "size": "L", "stock_quantity": 8 }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 42 }
}
```

---

### GET /api/productos/[slug]

**Descripción:** Detalle de un producto con todas las tallas y stock.

**Implementación:**
```typescript
// app/api/productos/[slug]/route.ts
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory(size, stock_quantity)
    `)
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  return NextResponse.json({ product: data })
}
```

---

### POST /api/checkout/quote

**Descripción:** Cotiza el costo de envío según dirección y valida el descuento.

**Body:**
```json
{
  "commune_id": 13119,
  "region_id": 13,
  "items": [
    { "product_id": "uuid", "size": "M", "quantity": 2 }
  ],
  "discount_code": "GRADA10"
}
```

**Lógica:**
1. Calcular subtotal sumando precios de los items
2. Si `region_id === 13` (RM) → shipping_cost = 3500
3. Si otra región → llamar Starken API → fallback a 6000 si falla
4. Si `discount_code` presente → validar y calcular descuento
5. Calcular total

**Implementación:**
```typescript
// app/api/checkout/quote/route.ts
import { getShippingCost } from '@/lib/starken'
import { validateDiscountCode } from '@/lib/discounts'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { commune_id, region_id, items, discount_code } = body

  // 1. Obtener precios actuales de DB (nunca confiar en el frontend)
  const supabase = createSupabaseAdminClient()
  const productIds = items.map((i: any) => i.product_id)

  const { data: products } = await supabase
    .from('products')
    .select('id, base_price')
    .in('id', productIds)

  const priceMap = Object.fromEntries(products!.map(p => [p.id, p.base_price]))
  const subtotal = items.reduce((sum: number, item: any) =>
    sum + (priceMap[item.product_id] * item.quantity), 0)

  // 2. Calcular envío
  const shipping_cost = await getShippingCost(region_id, commune_id)

  // 3. Validar descuento
  let discount_amount = 0
  let discount_info = null

  if (discount_code) {
    discount_info = await validateDiscountCode(discount_code, subtotal)
    if (discount_info) {
      discount_amount = discount_info.type === 'percentage'
        ? Math.floor(subtotal * discount_info.value / 100)
        : discount_info.value
      discount_amount = Math.min(discount_amount, subtotal) // No puede ser mayor que el subtotal
    }
  }

  const total = subtotal - discount_amount + shipping_cost

  return NextResponse.json({
    subtotal,
    shipping_cost,
    discount_amount,
    discount_valid: discount_info !== null,
    discount_error: discount_code && !discount_info ? 'Código inválido o expirado' : null,
    total
  })
}
```

**Response 200:**
```json
{
  "subtotal": 89000,
  "shipping_cost": 3500,
  "discount_amount": 8900,
  "discount_valid": true,
  "discount_error": null,
  "total": 83600
}
```

---

### POST /api/checkout/init

**Descripción:** Valida stock, crea la orden y retorna URL de pago.

**Body:**
```json
{
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Sudadera Terrace Concrete",
      "product_slug": "sudadera-terrace-concrete",
      "product_image": "https://...",
      "size": "M",
      "quantity": 1,
      "unit_price": 89000
    }
  ],
  "customer": {
    "email": "cliente@email.com",
    "name": "Juan Pérez",
    "phone": "+56912345678"
  },
  "shipping_address": {
    "street": "Av. Providencia 1234",
    "apartment": "Depto 5B",
    "commune": "Providencia",
    "commune_id": 13119,
    "region": "Región Metropolitana",
    "region_id": 13,
    "city": "Santiago"
  },
  "payment_gateway": "webpay",
  "discount_code": "GRADA10"
}
```

**Lógica (CRÍTICA - todo server-side):**
1. Re-validar stock en DB con transacción (nunca confiar en el cliente)
2. Re-calcular precios desde DB (nunca confiar en precios del frontend)
3. Re-validar código de descuento
4. Crear orden con status `pending`
5. Crear items de orden con snapshot de precios
6. Según `payment_gateway`:
   - Webpay: `WebpayPlus.Transaction.create(...)` → retornar `{ type: 'webpay', url, token }`
   - MercadoPago: crear preference → retornar `{ type: 'mercadopago', preference_id, init_point }`

**Implementación:**
```typescript
// app/api/checkout/init/route.ts
import { createWebpayTransaction } from '@/lib/transbank'
import { createMercadoPagoPreference } from '@/lib/mercadopago'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body: CheckoutPayload = await req.json()
  const supabase = createSupabaseAdminClient()

  // 1. Validar stock (usando función PG atómica)
  const stockValid = await supabase.rpc('validate_stock', {
    items: body.items.map(i => ({
      product_id: i.product_id,
      size: i.size,
      quantity: i.quantity
    }))
  })

  if (!stockValid.data) {
    return NextResponse.json({ error: 'Stock insuficiente', code: 'OUT_OF_STOCK' }, { status: 409 })
  }

  // 2. Recalcular precios desde DB
  const productIds = body.items.map(i => i.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, base_price')
    .in('id', productIds)

  const priceMap = Object.fromEntries(products!.map(p => [p.id, p.base_price]))

  const validatedItems = body.items.map(item => ({
    ...item,
    unit_price: priceMap[item.product_id], // precio real desde DB
    total_price: priceMap[item.product_id] * item.quantity
  }))

  const subtotal = validatedItems.reduce((sum, item) => sum + item.total_price, 0)

  // 3. Calcular envío
  const shipping_cost = await getShippingCost(
    body.shipping_address.region_id,
    body.shipping_address.commune_id
  )

  // 4. Validar descuento
  let discount_amount = 0
  let discount_code_id = null

  if (body.discount_code) {
    const discount = await validateDiscountCode(body.discount_code, subtotal)
    if (discount) {
      discount_code_id = discount.id
      discount_amount = discount.type === 'percentage'
        ? Math.floor(subtotal * discount.value / 100)
        : discount.value
      discount_amount = Math.min(discount_amount, subtotal)
    }
  }

  const total_amount = subtotal - discount_amount + shipping_cost

  // 5. Crear orden en DB
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_email: body.customer.email,
      customer_name: body.customer.name,
      customer_phone: body.customer.phone,
      shipping_address: body.shipping_address,
      subtotal,
      discount_amount,
      shipping_cost,
      total_amount,
      discount_code_id,
      discount_code_used: body.discount_code,
      payment_gateway: body.payment_gateway,
      status: 'pending'
    })
    .select('id')
    .single()

  if (orderError) {
    return NextResponse.json({ error: 'Error creating order' }, { status: 500 })
  }

  // 6. Crear order_items
  await supabase.from('order_items').insert(
    validatedItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_slug: item.product_slug,
      product_image: item.product_image,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }))
  )

  // 7. Iniciar pago
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (body.payment_gateway === 'webpay') {
    const { token, url } = await createWebpayTransaction({
      orderId: order.id,
      amount: total_amount,
      returnUrl: `${appUrl}/checkout/webpay/return`
    })

    // Guardar token en la orden para validación posterior
    await supabase.from('orders').update({ payment_id: token }).eq('id', order.id)

    return NextResponse.json({ type: 'webpay', url, token, order_id: order.id })
  }

  if (body.payment_gateway === 'mercadopago') {
    const { preference_id, init_point } = await createMercadoPagoPreference({
      order: { id: order.id, total_amount, items: validatedItems },
      customer: body.customer,
      backUrls: {
        success: `${appUrl}/checkout/mercadopago/return?status=success`,
        failure: `${appUrl}/checkout/mercadopago/return?status=failure`,
        pending: `${appUrl}/checkout/mercadopago/return?status=pending`
      }
    })

    await supabase.from('orders').update({ payment_id: preference_id }).eq('id', order.id)

    return NextResponse.json({ type: 'mercadopago', preference_id, init_point, order_id: order.id })
  }

  return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 })
}
```

---

## WEBHOOKS (CRÍTICOS)

### POST /api/webhooks/webpay

**Descripción:** Transbank redirige aquí después del pago. Confirmar transacción y actualizar orden.

**IMPORTANTE:** Transbank hace un POST con `token_ws` en el body (form-encoded). Luego el usuario también llega aquí con GET. Manejar ambos.

```typescript
// app/api/webhooks/webpay/route.ts
import { WebpayPlus } from 'transbank-sdk'

// POST: Transbank notifica el resultado
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const token_ws = formData.get('token_ws') as string
  const TBK_TOKEN = formData.get('TBK_TOKEN') as string // Si el usuario cancela

  // Usuario canceló en Transbank
  if (TBK_TOKEN && !token_ws) {
    const supabase = createSupabaseAdminClient()
    await supabase.from('orders')
      .update({ status: 'cancelled' })
      .eq('payment_id', TBK_TOKEN)

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?reason=cancelled`)
  }

  if (!token_ws) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?reason=invalid`)
  }

  try {
    // Confirmar con Transbank
    const response = await WebpayPlus.Transaction.commit(token_ws)

    const supabase = createSupabaseAdminClient()

    // Buscar la orden
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('payment_id', token_ws)
      .single()

    if (!order) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?reason=order_not_found`)
    }

    // Verificar que ya no fue procesada (idempotencia)
    if (order.status !== 'pending') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/exito?order_id=${order.id}`)
    }

    // Verificar que el monto coincide
    if (response.amount !== order.total_amount) {
      await supabase.from('orders').update({
        status: 'cancelled',
        payment_data: response
      }).eq('id', order.id)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?reason=amount_mismatch`)
    }

    // Verificar que el pago fue autorizado
    if (response.response_code !== 0) {
      await supabase.from('orders').update({
        status: 'cancelled',
        payment_data: response
      }).eq('id', order.id)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?reason=payment_rejected`)
    }

    // ✅ Pago exitoso: actualizar orden y descontar stock ATÓMICAMENTE
    await supabase.from('orders').update({
      status: 'paid',
      payment_data: response,
      paid_at: new Date().toISOString()
    }).eq('id', order.id)

    // Descontar stock (función PG atómica)
    await supabase.rpc('deduct_stock', { p_order_id: order.id })

    // Incrementar uso de código de descuento si aplica
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('discount_code_id')
      .eq('id', order.id)
      .single()

    if (fullOrder?.discount_code_id) {
      await supabase.rpc('increment_discount_uses', { p_code_id: fullOrder.discount_code_id })
    }

    // Enviar email de confirmación (async, no bloquear el redirect)
    sendOrderConfirmationEmail(order.id).catch(console.error)

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/exito?order_id=${order.id}`)

  } catch (error) {
    console.error('Webpay webhook error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?reason=server_error`)
  }
}
```

---

### POST /api/webhooks/mercadopago

**Descripción:** MercadoPago IPN. Validar, consultar el pago real y actualizar orden.

```typescript
// app/api/webhooks/mercadopago/route.ts
import { MercadoPagoConfig, Payment } from 'mercadopago'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // MP envía notificaciones de distintos tipos
  if (body.type !== 'payment') {
    return NextResponse.json({ received: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ received: true })

  try {
    // Consultar el pago real en MP API (nunca confiar en el body del webhook)
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    const supabase = createSupabaseAdminClient()

    // El external_reference es el order_id que enviamos al crear la preference
    const orderId = paymentData.external_reference

    if (!orderId) return NextResponse.json({ received: true })

    const { data: order } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('id', orderId)
      .single()

    if (!order || order.status !== 'pending') {
      return NextResponse.json({ received: true }) // Idempotencia
    }

    if (paymentData.status === 'approved') {
      // Verificar monto (en MP es en pesos sin decimales)
      if (Math.round(paymentData.transaction_amount!) !== order.total_amount) {
        await supabase.from('orders').update({ status: 'cancelled', payment_data: paymentData }).eq('id', order.id)
        return NextResponse.json({ received: true })
      }

      // ✅ Pago aprobado
      await supabase.from('orders').update({
        status: 'paid',
        payment_id: String(paymentId),
        payment_data: paymentData,
        paid_at: new Date().toISOString()
      }).eq('id', order.id)

      await supabase.rpc('deduct_stock', { p_order_id: order.id })

      const { data: fullOrder } = await supabase.from('orders').select('discount_code_id').eq('id', order.id).single()
      if (fullOrder?.discount_code_id) {
        await supabase.rpc('increment_discount_uses', { p_code_id: fullOrder.discount_code_id })
      }

      sendOrderConfirmationEmail(order.id).catch(console.error)

    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      await supabase.from('orders').update({
        status: 'cancelled',
        payment_data: paymentData
      }).eq('id', order.id)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

---

## ENDPOINTS ADMIN (requieren Google OAuth via Supabase)

### Middleware de Auth Admin

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  if (req.nextUrl.pathname.startsWith('/admin') ||
      req.nextUrl.pathname.startsWith('/api/admin')) {

    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // Verificar que el email esté en admin_users
    const { createClient } = await import('@supabase/supabase-js')
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: adminUser } = await adminClient
      .from('admin_users')
      .select('id')
      .eq('email', session.user.email!)
      .single()

    if (!adminUser) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

---

### GET /api/admin/stats

**Response 200:**
```json
{
  "total_revenue": 1250000,
  "total_orders": 42,
  "orders_today": 3,
  "orders_this_month": 18,
  "revenue_this_month": 580000,
  "avg_order_value": 89000,
  "low_stock_products": [
    {
      "product_name": "Sudadera Terrace Concrete",
      "slug": "sudadera-terrace-concrete",
      "size": "M",
      "stock_quantity": 2
    }
  ],
  "recent_orders": [...],
  "orders_by_status": {
    "pending": 2,
    "paid": 15,
    "preparing": 3,
    "shipped": 8,
    "delivered": 12,
    "cancelled": 2
  }
}
```

**Consultas SQL para stats:**
```sql
-- Total revenue (solo órdenes pagadas)
SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE status NOT IN ('pending', 'cancelled');

-- Low stock (menos de 5 unidades)
SELECT p.name, p.slug, i.size, i.stock_quantity
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.stock_quantity < 5 AND i.stock_quantity >= 0
ORDER BY i.stock_quantity ASC;
```

---

### GET /api/admin/ordenes

**Query params:**
- `status?: OrderStatus`
- `page?: number`
- `limit?: number` (default: 20)
- `search?: string` (busca por email o nombre)

**Response 200:**
```json
{
  "orders": [...],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

---

### GET /api/admin/ordenes/[id]

**Response 200:** Orden completa con `order_items` incluidos.

---

### PATCH /api/admin/ordenes/[id]

**Body (uno o más campos):**
```json
{
  "status": "shipped",
  "tracking_number": "12345678",
  "tracking_url": "https://www.starken.cl/seguimiento?codigo=12345678"
}
```

**Lógica:** Al cambiar a `shipped`, enviar email de notificación con tracking.

---

### GET /api/admin/productos

Igual al endpoint público pero incluye productos inactivos y sin filtro.

---

### POST /api/admin/productos

**Body (multipart/form-data):**
- `name, slug, description, base_price, category` (campos de texto)
- `inventory` (JSON string con array de `{size, stock_quantity}`)
- `images[]` (archivos de imagen)

**Lógica:**
1. Subir imágenes a Supabase Storage → obtener URLs públicas
2. Crear producto en DB
3. Crear registros de inventario

---

### PATCH /api/admin/productos/[id]

Igual que POST pero actualiza. Para imágenes: recibe `existing_images[]` (URLs a mantener) + `new_images[]` (archivos nuevos). Las imágenes no incluidas en `existing_images` se eliminan de Storage.

---

### DELETE /api/admin/productos/[id]

Soft delete: `UPDATE products SET is_active = false WHERE id = $1`

---

### GET /api/admin/descuentos

Lista todos los códigos de descuento ordenados por `created_at DESC`.

---

### POST /api/admin/descuentos

**Body:**
```json
{
  "code": "NAVIDAD20",
  "type": "percentage",
  "value": 20,
  "min_order_amount": 50000,
  "max_uses": 100,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

---

### PATCH /api/admin/descuentos/[id]

Actualizar o desactivar (`is_active: false`).

---

### DELETE /api/admin/descuentos/[id]

Hard delete (o soft delete con `is_active = false` si tiene usos).
