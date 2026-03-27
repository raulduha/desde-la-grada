# DLG — PAYMENTS SPEC (Webpay + MercadoPago)

## Principios de Seguridad

- **NUNCA** confiar en precios enviados desde el frontend
- **SIEMPRE** recalcular montos desde la DB en el servidor
- **SIEMPRE** verificar la transacción consultando directamente al gateway (no solo el webhook body)
- Implementar **idempotencia**: si una orden ya está `paid`, ignorar webhooks duplicados
- Guardar la respuesta completa del gateway en `payment_data` (JSONB) para auditoría

---

## WEBPAY PLUS (Transbank)

### Instalación

```bash
npm install transbank-sdk
```

### Configuración

```typescript
// lib/transbank.ts
import { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from 'transbank-sdk'

const isProduction = process.env.TRANSBANK_ENV === 'production'

// En integración (desarrollo), usar credenciales de prueba de Transbank
export const webpay = new WebpayPlus.Transaction(
  new Options(
    isProduction ? process.env.TRANSBANK_COMMERCE_CODE! : IntegrationCommerceCodes.WEBPAY_PLUS,
    isProduction ? process.env.TRANSBANK_API_KEY! : IntegrationApiKeys.WEBPAY_PLUS,
    isProduction ? Environment.Production : Environment.Integration
  )
)

interface CreateTransactionParams {
  orderId: string
  amount: number
  returnUrl: string
}

interface TransactionResult {
  token: string
  url: string
}

export async function createWebpayTransaction(params: CreateTransactionParams): Promise<TransactionResult> {
  const { orderId, amount, returnUrl } = params

  const response = await webpay.create(
    orderId,      // buyOrder: identificador de la orden (máx 26 chars)
    'DLG-' + orderId.slice(0, 22), // sessionId
    amount,       // amount: monto en CLP entero
    returnUrl     // returnUrl: URL donde Transbank redirige tras el pago
  )

  return {
    token: response.token,
    url: response.url  // URL del formulario de Transbank
  }
}
```

### Flujo Completo Webpay

```
1. Frontend → POST /api/checkout/init (con payment_gateway: 'webpay')
2. Backend crea orden en DB, llama webpay.create()
3. Backend retorna { type: 'webpay', url, token, order_id }
4. Frontend → window.location.href = url + '?token_ws=' + token
   (Transbank proporciona la URL completa, generalmente se hace POST manual)
   IMPORTANTE: El redirect a Transbank debe ser un FORM POST, no GET.
   Implementar con un formulario HTML invisible que se auto-submita:

   // En la página de checkout, al recibir la respuesta:
   const form = document.createElement('form')
   form.method = 'POST'
   form.action = url
   const input = document.createElement('input')
   input.type = 'hidden'
   input.name = 'token_ws'
   input.value = token
   form.appendChild(input)
   document.body.appendChild(form)
   form.submit()

5. Usuario paga (o cancela) en el formulario de Transbank
6. Transbank hace POST a returnUrl con token_ws
7. Backend en /api/webhooks/webpay:
   a. Llama webpay.commit(token_ws)
   b. Verifica response_code === 0 (aprobado)
   c. Verifica amount === order.total_amount
   d. Actualiza order.status → 'paid'
   e. Llama deduct_stock(order_id) [ATÓMICO]
   f. Redirect → /checkout/exito?order_id=xxx
```

### Códigos de Respuesta Webpay

```
response_code:
  0  = Transacción aprobada ✅
  -1 = Transacción rechazada
  -2 = Transacción debe reintentarse
  -3 = Error en transacción
  -4 = Rechazo de transacción
  -5 = Rechazo por error de tasa
  -6 = Excede cupo máximo mensual
  -7 = Excede límite diario por transacción
  -8 = Rubro no autorizado

Solo procesar como exitoso cuando response_code === 0
```

### Credenciales de Prueba (Integración)

```
Tarjeta de crédito: 4051 8856 0044 6623
CVV: 123
Fecha expiración: cualquier fecha futura
RUT: 11.111.111-1
Clave: 123

Para aprobar: monto cualquiera
Para rechazar: usar CVV 119
```

---

## MERCADOPAGO

### Instalación

```bash
npm install mercadopago
```

### Configuración

```typescript
// lib/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import type { CartItem } from '@/types'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

interface CreatePreferenceParams {
  order: {
    id: string
    total_amount: number
    items: CartItem[]
  }
  customer: {
    email: string
    name: string
    phone?: string
  }
  backUrls: {
    success: string
    failure: string
    pending: string
  }
}

interface PreferenceResult {
  preference_id: string
  init_point: string // URL de pago MP (producción)
  sandbox_init_point: string // URL de pago MP (sandbox)
}

export async function createMercadoPagoPreference(
  params: CreatePreferenceParams
): Promise<PreferenceResult> {
  const { order, customer, backUrls } = params

  const preference = new Preference(client)

  const response = await preference.create({
    body: {
      external_reference: order.id, // ID de nuestra orden (para el webhook)
      items: order.items.map(item => ({
        id: item.product_id,
        title: `${item.product_name} - Talla ${item.size}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'CLP',
        category_id: 'fashion',
      })),
      payer: {
        email: customer.email,
        name: customer.name.split(' ')[0],
        surname: customer.name.split(' ').slice(1).join(' '),
        phone: customer.phone ? { number: customer.phone } : undefined,
      },
      back_urls: backUrls,
      auto_return: 'approved', // Auto-redirige si fue aprobado
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'DESDE LA GRADA',
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    }
  })

  return {
    preference_id: response.id!,
    init_point: response.init_point!,
    sandbox_init_point: response.sandbox_init_point!,
  }
}

// Función para verificar un pago (usada en el webhook)
export async function getMercadoPagoPayment(paymentId: string) {
  const payment = new Payment(client)
  return await payment.get({ id: paymentId })
}
```

### Flujo Completo MercadoPago

```
1. Frontend → POST /api/checkout/init (con payment_gateway: 'mercadopago')
2. Backend crea orden, llama preference.create()
3. Backend retorna { type: 'mercadopago', preference_id, init_point }
4. Frontend → window.location.href = init_point (en sandbox: sandbox_init_point)
5. Usuario paga en la plataforma de MP
6. MP redirige a back_urls según resultado:
   - success → /checkout/mercadopago/return?status=success&payment_id=xxx
   - failure → /checkout/mercadopago/return?status=failure
   - pending → /checkout/mercadopago/return?status=pending
7. MP también envía IPN (webhook) a notification_url:
   - POST /api/webhooks/mercadopago con { type: 'payment', data: { id: payment_id } }
8. El webhook es el canal confiable (el redirect puede fallar si el usuario cierra el browser)
```

### Página de Return MercadoPago

```typescript
// app/checkout/mercadopago/return/page.tsx
// Esta página solo muestra un estado de espera/confirmación
// El procesamiento real ocurre en el webhook

export default function MercadoPagoReturn({
  searchParams
}: {
  searchParams: { status: string; payment_id?: string; merchant_order_id?: string }
}) {
  if (searchParams.status === 'success') {
    // El webhook debería haber procesado el pago
    // Consultar el estado de la orden por el payment_id o merchant_order_id
    // Mostrar "Confirmando tu pago..." con spinner y redirect a /checkout/exito
  }
  // ... manejar failure y pending
}
```

### Estados de Pago MercadoPago

```
payment.status:
  'approved'  → Pago aprobado ✅ → order: 'paid'
  'pending'   → Pago pendiente (ej: transferencia) → mantener 'pending'
  'in_process'→ En revisión → mantener 'pending'
  'rejected'  → Rechazado → order: 'cancelled'
  'cancelled' → Cancelado → order: 'cancelled'
  'refunded'  → Reembolsado → order: 'refunded'

payment.status_detail (cuando rejected):
  'cc_rejected_bad_filled_card_number' → Número de tarjeta incorrecto
  'cc_rejected_insufficient_amount'     → Sin fondos
  'cc_rejected_high_risk'               → Rechazado por riesgo
  ... (ver documentación MP para lista completa)
```

### Credenciales de Prueba MP (Sandbox)

```
En tu cuenta MP, ir a: Tu negocio → Credenciales → Credenciales de prueba

Tarjetas de prueba (usuario comprador):
  Visa aprobada:    4009 1753 3280 6176  CVV: 123  Fecha: 11/25
  Mastercard fail:  5031 4332 1540 6351  CVV: 123  Fecha: 11/25

Usuario vendedor (para ver pagos en sandbox):
  Usar credenciales TEST de tu cuenta MP
```

---

## MANEJO DE ERRORES Y CASOS BORDE

### Timeout del formulario de pago

```
Si el usuario no completa el pago en 24h:
- La orden queda en status 'pending' indefinidamente
- CRON JOB: correr cada 6h (via Vercel Cron Jobs)
  SELECT id FROM orders WHERE status='pending' AND created_at < NOW() - INTERVAL '48 hours'
  → UPDATE status='cancelled'

// vercel.json
{
  "crons": [{
    "path": "/api/cron/cancel-stale-orders",
    "schedule": "0 */6 * * *"
  }]
}
```

### Stock race condition

```
Escenario: 2 usuarios compran el último item simultáneamente
Solución: la función PG deduct_stock usa:
  WHERE stock_quantity >= item.quantity
  → Si no encuentra (stock ya fue tomado) → RAISE EXCEPTION
  → La transacción falla → HTTP 409
  → El webhook retorna error → Transbank/MP puede reintentar
  → Si el pago ya fue capturado, necesitas hacer refund manual (documentar proceso)
```

### Doble webhook

```
Transbank y MP pueden enviar el webhook más de una vez.
Solución (ya implementada en el spec de API):
  IF order.status !== 'pending' → return { received: true } sin procesar
```
