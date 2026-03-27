# DLG — SHIPPING SPEC (Starken + RM)

## Lógica de Cotización

```typescript
// lib/starken.ts

const RM_REGION_ID = 13
const FLAT_RATE_RM = 3500       // CLP - Región Metropolitana
const FALLBACK_RATE = 6000      // CLP - Fallback si Starken falla

interface StarkenQuoteParams {
  origin_commune_id: number   // Santiago Centro: 13132
  destination_commune_id: number
  weight_kg: number           // 0.3 kg por prenda
  dimensions: {               // en cm
    length: number            // 30
    width: number             // 25
    height: number            // 2 por prenda
  }
}

export async function getShippingCost(
  region_id: number,
  commune_id: number,
  quantity: number = 1
): Promise<number> {
  // Región Metropolitana → precio fijo
  if (region_id === RM_REGION_ID) {
    return FLAT_RATE_RM
  }

  // Regiones → cotizar con Starken
  try {
    const quote = await getStarkenQuote({
      origin_commune_id: 13132, // Santiago Centro (bodega DLG)
      destination_commune_id: commune_id,
      weight_kg: 0.3 * quantity,
      dimensions: {
        length: 30,
        width: 25,
        height: Math.max(2, 2 * quantity) // altura proporcional a la cantidad
      }
    })
    return quote
  } catch (error) {
    console.error('Starken API error, usando fallback:', error)
    return FALLBACK_RATE
  }
}

async function getStarkenQuote(params: StarkenQuoteParams): Promise<number> {
  const response = await fetch(`${process.env.STARKEN_API_URL}/cotizar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STARKEN_API_KEY}`,
    },
    body: JSON.stringify({
      origen: { codigo_comuna: params.origin_commune_id },
      destino: { codigo_comuna: params.destination_commune_id },
      peso: params.weight_kg,
      largo: params.dimensions.length,
      ancho: params.dimensions.width,
      alto: params.dimensions.height,
      tipo_envio: 'STD', // Estándar
    }),
    signal: AbortSignal.timeout(5000), // 5s timeout
  })

  if (!response.ok) throw new Error(`Starken API error: ${response.status}`)

  const data = await response.json()

  // Extraer el precio del servicio estándar más barato
  // (estructura exacta depende de la API de Starken, ajustar según docs)
  const price = data?.tarifas?.[0]?.precio_total
  if (!price) throw new Error('No price in Starken response')

  return Math.round(price) // CLP entero
}
```

## Dimensiones del Paquete

```
Peso por prenda: 0.3 kg
Dimensiones base: 30cm x 25cm x 2cm
Con múltiples prendas: el alto crece 2cm por prenda adicional
Máximo por envío: no definido (envío único por orden)
```

## Comunas y Regiones de Chile

```typescript
// lib/chile-geo.ts
// Lista estática de regiones y comunas para el selector del checkout
// Fuente: https://github.com/knxroot/BDCOMUNAS o similar

export const REGIONS = [
  { id: 1, name: 'Región de Tarapacá' },
  { id: 2, name: 'Región de Antofagasta' },
  // ... todas las regiones
  { id: 13, name: 'Región Metropolitana de Santiago' },
  // ...
]

export const COMMUNES: Record<number, { id: number; name: string }[]> = {
  13: [ // RM
    { id: 13101, name: 'Santiago' },
    { id: 13119, name: 'Providencia' },
    { id: 13120, name: 'Ñuñoa' },
    { id: 13132, name: 'San Miguel' },
    // ... todas las comunas de RM
  ],
  // ... comunas de otras regiones
}
```

---

# DLG — EMAIL SPEC (Resend)

## Instalación

```bash
npm install resend react @react-email/components
```

## Configuración

```typescript
// lib/resend.ts
import { Resend } from 'resend'
import type { Order } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL! // hola@desdelagrada.cl

// Función central para enviar emails
export async function sendEmail({
  to,
  subject,
  react
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  const { data, error } = await resend.emails.send({
    from: `DLG Desde la Grada <${FROM}>`,
    to,
    subject,
    react,
  })

  if (error) {
    console.error('Resend error:', error)
    throw error
  }

  return data
}
```

## Email 1: Confirmación de Pedido

**Trigger:** Cuando `order.status` cambia de `pending` → `paid` (en webhook)

```typescript
// lib/emails/order-confirmation.tsx
import {
  Html, Head, Body, Container, Section, Text, Button,
  Img, Hr, Row, Column, Heading, Preview
} from '@react-email/components'
import { formatCLP } from '@/lib/utils'
import type { Order } from '@/types'

export function OrderConfirmationEmail({ order }: { order: Order }) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Tu pedido #{order.id.slice(-8).toUpperCase()} fue confirmado</Preview>
      <Body style={{ backgroundColor: '#0e0e0e', fontFamily: 'Inter, sans-serif', color: '#ffffff' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Heading style={{ fontFamily: 'sans-serif', fontSize: '48px', fontWeight: '900',
            textTransform: 'uppercase', letterSpacing: '-2px', color: '#ffffff', margin: '0 0 8px' }}>
            DLG
          </Heading>
          <Text style={{ color: '#adaaaa', textTransform: 'uppercase', letterSpacing: '4px',
            fontSize: '10px', margin: '0 0 40px' }}>
            DESDE LA GRADA
          </Text>

          <Hr style={{ borderColor: '#262626', margin: '0 0 40px' }} />

          {/* Confirmación */}
          <Heading style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase',
            letterSpacing: '-1px', margin: '0 0 16px' }}>
            ¡Pedido Confirmado!
          </Heading>
          <Text style={{ color: '#adaaaa', margin: '0 0 8px', fontSize: '14px' }}>
            Hola {order.customer_name},
          </Text>
          <Text style={{ color: '#adaaaa', margin: '0 0 32px', fontSize: '14px' }}>
            Tu pedido #{order.id.slice(-8).toUpperCase()} ha sido confirmado y está siendo preparado.
            Recibirás otro email cuando sea enviado.
          </Text>

          {/* Items */}
          <Section style={{ backgroundColor: '#131313', padding: '24px', marginBottom: '24px' }}>
            <Text style={{ textTransform: 'uppercase', letterSpacing: '3px', fontSize: '10px',
              color: '#adaaaa', margin: '0 0 16px', fontWeight: '700' }}>
              TU PEDIDO
            </Text>
            {order.items?.map((item, i) => (
              <Row key={i} style={{ marginBottom: '12px' }}>
                <Column style={{ width: '60%' }}>
                  <Text style={{ margin: '0', fontWeight: '700', textTransform: 'uppercase',
                    fontSize: '14px' }}>
                    {item.product_name}
                  </Text>
                  <Text style={{ margin: '0', color: '#adaaaa', fontSize: '12px',
                    textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Talla {item.size} × {item.quantity}
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ margin: '0', fontWeight: '700', fontSize: '14px' }}>
                    {formatCLP(item.total_price)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: '#262626', margin: '16px 0' }} />

            {/* Totales */}
            {order.discount_amount > 0 && (
              <Row>
                <Column><Text style={{ color: '#adaaaa', fontSize: '12px', margin: '4px 0',
                  textTransform: 'uppercase', letterSpacing: '1px' }}>Descuento</Text></Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: '#00FF00', fontSize: '12px', margin: '4px 0' }}>
                    -{formatCLP(order.discount_amount)}
                  </Text>
                </Column>
              </Row>
            )}
            <Row>
              <Column><Text style={{ color: '#adaaaa', fontSize: '12px', margin: '4px 0',
                textTransform: 'uppercase', letterSpacing: '1px' }}>Envío</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: '12px', margin: '4px 0' }}>
                  {formatCLP(order.shipping_cost)}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={{ fontWeight: '900', fontSize: '18px', textTransform: 'uppercase',
                  margin: '8px 0 0' }}>
                  TOTAL
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontWeight: '900', fontSize: '18px', margin: '8px 0 0' }}>
                  {formatCLP(order.total_amount)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Dirección de envío */}
          <Section style={{ backgroundColor: '#131313', padding: '24px', marginBottom: '24px' }}>
            <Text style={{ textTransform: 'uppercase', letterSpacing: '3px', fontSize: '10px',
              color: '#adaaaa', margin: '0 0 12px', fontWeight: '700' }}>
              DIRECCIÓN DE ENVÍO
            </Text>
            <Text style={{ margin: '0', fontSize: '14px' }}>
              {order.shipping_address.street}
              {order.shipping_address.apartment && `, ${order.shipping_address.apartment}`}
            </Text>
            <Text style={{ margin: '0', color: '#adaaaa', fontSize: '14px' }}>
              {order.shipping_address.commune}, {order.shipping_address.region}
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/productos`}
              style={{ backgroundColor: '#ffffff', color: '#000000', padding: '16px 32px',
                fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px',
                fontSize: '12px', textDecoration: 'none', display: 'inline-block' }}>
              SEGUIR COMPRANDO
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: '#262626', margin: '0 0 24px' }} />
          <Text style={{ color: '#484847', fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '2px', textAlign: 'center' }}>
            © 2024 DESDE LA GRADA. RUIDO DE ESTADIO INCLUIDO.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Función de envío
export async function sendOrderConfirmationEmail(orderId: string) {
  const supabase = createSupabaseAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  await sendEmail({
    to: order.customer_email,
    subject: `✓ Pedido #${order.id.slice(-8).toUpperCase()} confirmado — DLG`,
    react: <OrderConfirmationEmail order={order} />,
  })
}
```

## Email 2: Pedido Enviado (con tracking)

**Trigger:** Admin actualiza status → `shipped` + agrega `tracking_number`

```typescript
// lib/emails/order-shipped.tsx
export function OrderShippedEmail({
  order,
  tracking_number,
  tracking_url
}: {
  order: Order
  tracking_number: string
  tracking_url?: string
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Tu pedido está en camino 📦</Preview>
      <Body style={{ backgroundColor: '#0e0e0e', fontFamily: 'Inter, sans-serif', color: '#ffffff' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 40px' }}>DLG</Heading>

          <Heading style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase',
            letterSpacing: '-1px' }}>
            ¡En camino!
          </Heading>
          <Text style={{ color: '#adaaaa', fontSize: '14px' }}>
            Tu pedido #{order.id.slice(-8).toUpperCase()} ha sido despachado.
          </Text>

          <Section style={{ backgroundColor: '#131313', padding: '24px', margin: '24px 0' }}>
            <Text style={{ textTransform: 'uppercase', letterSpacing: '3px', fontSize: '10px',
              color: '#adaaaa', margin: '0 0 12px', fontWeight: '700' }}>
              NÚMERO DE SEGUIMIENTO
            </Text>
            <Text style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '2px', margin: '0' }}>
              {tracking_number}
            </Text>
          </Section>

          {tracking_url && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={tracking_url}
                style={{ backgroundColor: '#ffffff', color: '#000000', padding: '16px 32px',
                  fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px',
                  fontSize: '12px', textDecoration: 'none', display: 'inline-block' }}>
                RASTREAR MI PEDIDO
              </Button>
            </Section>
          )}

          <Text style={{ color: '#484847', fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '2px', textAlign: 'center', marginTop: '40px' }}>
            © 2024 DESDE LA GRADA. RUIDO DE ESTADIO INCLUIDO.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export async function sendOrderShippedEmail(orderId: string) {
  const supabase = createSupabaseAdminClient()
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order || !order.tracking_number) return

  await sendEmail({
    to: order.customer_email,
    subject: `📦 Tu pedido #${order.id.slice(-8).toUpperCase()} está en camino — DLG`,
    react: <OrderShippedEmail
      order={order}
      tracking_number={order.tracking_number}
      tracking_url={order.tracking_url}
    />,
  })
}
```

## Configuración de Dominio en Resend

```
1. Ir a resend.com → Domains → Add Domain
2. Agregar: desdelagrada.cl
3. Agregar los registros DNS (SPF, DKIM, DMARC) en tu proveedor de dominio
4. Verificar el dominio
5. Actualizar RESEND_FROM_EMAIL=hola@desdelagrada.cl
```

---

# DLG — ADMIN SPEC (Funcionalidades detalladas)

## Google OAuth Setup (Supabase)

```
1. Ir a console.cloud.google.com → APIs & Services → Credentials
2. Crear OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: https://<proyecto>.supabase.co/auth/v1/callback
3. Copiar Client ID y Client Secret
4. En Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider: ON
   - Client ID: (pegar)
   - Client Secret: (pegar)
5. En Supabase → Authentication → URL Configuration:
   - Site URL: https://desdelagrada.cl
   - Redirect URLs: https://desdelagrada.cl/admin, http://localhost:3000/admin
```

## Subida de Imágenes (Admin → Productos)

```typescript
// Lógica de upload en /api/admin/productos (POST/PATCH)

async function uploadProductImages(files: File[], productSlug: string): Promise<string[]> {
  const supabase = createSupabaseAdminClient()
  const urls: string[] = []

  for (const file of files) {
    // Generar nombre único
    const ext = file.name.split('.').pop()
    const filename = `${productSlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw error

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename)

    urls.push(publicUrl)
  }

  return urls
}

async function deleteProductImage(imageUrl: string) {
  const supabase = createSupabaseAdminClient()

  // Extraer el path del storage desde la URL pública
  const path = imageUrl.split('/storage/v1/object/public/product-images/')[1]
  if (!path) return

  await supabase.storage.from('product-images').remove([path])
}
```

## Dashboard de Stats (Consultas)

```typescript
// lib/admin-stats.ts

export async function getDashboardStats() {
  const supabase = createSupabaseAdminClient()

  const [
    revenueResult,
    ordersResult,
    todayResult,
    monthResult,
    lowStockResult,
    statusResult,
    recentResult
  ] = await Promise.all([
    // Total revenue (solo pagadas)
    supabase.from('orders')
      .select('total_amount')
      .not('status', 'in', '("pending","cancelled")'),

    // Total órdenes pagadas
    supabase.from('orders')
      .select('id', { count: 'exact' })
      .not('status', 'in', '("pending","cancelled")'),

    // Órdenes de hoy
    supabase.from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date().toISOString().split('T')[0]),

    // Órdenes este mes
    supabase.from('orders')
      .select('total_amount')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .not('status', 'in', '("pending","cancelled")'),

    // Stock bajo (< 5 unidades)
    supabase.from('inventory')
      .select('size, stock_quantity, products(name, slug)')
      .lt('stock_quantity', 5)
      .order('stock_quantity', { ascending: true }),

    // Órdenes por estado
    supabase.from('orders').select('status'),

    // Órdenes recientes
    supabase.from('orders')
      .select('id, customer_name, customer_email, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const totalRevenue = revenueResult.data?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0
  const totalOrders = ordersResult.count ?? 0
  const monthRevenue = monthResult.data?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0

  const ordersByStatus = statusResult.data?.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  return {
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    orders_today: todayResult.count ?? 0,
    revenue_this_month: monthRevenue,
    avg_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    low_stock_products: lowStockResult.data ?? [],
    orders_by_status: ordersByStatus,
    recent_orders: recentResult.data ?? []
  }
}
```

## Gestión de Descuentos

```typescript
// lib/discounts.ts

export async function validateDiscountCode(code: string, subtotal: number) {
  const supabase = createSupabaseAdminClient()

  const { data } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!data) return null

  // Verificar expiración
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  // Verificar máximo de usos
  if (data.max_uses !== null && data.uses_count >= data.max_uses) return null

  // Verificar monto mínimo
  if (subtotal < data.min_order_amount) return null

  return data
}
```
