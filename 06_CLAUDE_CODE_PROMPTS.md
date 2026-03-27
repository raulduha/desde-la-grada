# DLG — CLAUDE CODE PROMPTS
> Copia y pega estos prompts en Claude Code en el orden indicado.

---

## PROMPT 1 — Setup inicial del proyecto

```
Crea un proyecto Next.js 14 para una tienda de ropa streetwear chilena llamada "DLG - Desde la Grada".

Stack:
- Next.js 14 con App Router y TypeScript
- TailwindCSS con la configuración exacta del spec (ver 03_FRONTEND.md)
- Supabase para DB, Auth y Storage
- Zustand para estado del carrito

Pasos:
1. Inicializar el proyecto con `npx create-next-app@latest dlg --typescript --tailwind --app --src-dir=false`
2. Instalar dependencias: @supabase/supabase-js @supabase/auth-helpers-nextjs zustand react-hook-form zod @hookform/resolvers framer-motion transbank-sdk mercadopago resend @react-email/components
3. Configurar tailwind.config.js con la paleta exacta de 03_FRONTEND.md
4. Crear el archivo .env.local con todas las variables de 00_MASTER_SPEC.md (valores vacíos)
5. Crear la estructura de carpetas completa de 00_MASTER_SPEC.md
6. Crear types/index.ts con todos los tipos de 02_API_ROUTES.md
7. Crear lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/admin.ts
8. Configurar next.config.js para permitir imágenes de Supabase Storage

Para los clientes de Supabase:
- client.ts: createBrowserClient (para componentes cliente)
- server.ts: createServerClient con cookies (para Server Components)
- admin.ts: createClient con SUPABASE_SERVICE_ROLE_KEY (solo server-side)
```

---

## PROMPT 2 — Base de datos

```
Ejecuta el schema SQL completo de 01_DATABASE.md en Supabase.

Instrucciones:
1. Ve a tu proyecto Supabase → SQL Editor
2. Ejecuta en orden: extensiones, tipos ENUM, tablas, índices, funciones, triggers, RLS policies
3. Crea el bucket 'product-images' en Storage → configurar como público
4. Inserta el primer admin con tu email en admin_users
5. Opcionalmente, inserta los datos seed del final del archivo

Después de ejecutar el SQL, implementa en el proyecto:
- lib/starken.ts con la función getShippingCost() de 05_SHIPPING_EMAIL_ADMIN.md
- lib/discounts.ts con validateDiscountCode() de 05_SHIPPING_EMAIL_ADMIN.md
- lib/chile-geo.ts con el JSON de regiones y comunas de Chile (busca o genera la lista completa de 16 regiones y sus comunas)
- lib/utils.ts con la función formatCLP()
```

---

## PROMPT 3 — API Routes públicas

```
Implementa las siguientes API Routes de 02_API_ROUTES.md:

1. GET /api/productos — con filtros de categoría y paginación
2. GET /api/productos/[slug] — detalle de producto
3. POST /api/checkout/quote — cotización de envío + validación de descuento
4. POST /api/checkout/init — crear orden + iniciar pago (Webpay y MercadoPago)

Para Webpay, implementa lib/transbank.ts con la función createWebpayTransaction()
Para MercadoPago, implementa lib/mercadopago.ts con createMercadoPagoPreference()

Asegúrate de:
- Nunca confiar en precios del frontend, siempre recalcular desde DB
- Usar supabaseAdmin (service role) en todas las API routes
- Validar stock con la función PG validate_stock()
- Manejar errores apropiadamente con los códigos HTTP correctos
```

---

## PROMPT 4 — Webhooks de pago

```
Implementa los webhooks de pago de 02_API_ROUTES.md y 04_PAYMENTS.md:

1. POST /api/webhooks/webpay — confirmación Transbank
   - Manejar tanto el caso de pago exitoso (token_ws) como cancelación (TBK_TOKEN)
   - Llamar webpay.commit(token_ws) para confirmar
   - Verificar response_code === 0 y que el monto coincida
   - Actualizar orden, descontar stock (deduct_stock RPC), incrementar usos de descuento
   - Redirigir a /checkout/exito o /checkout/error

2. POST /api/webhooks/mercadopago — IPN de MercadoPago
   - Verificar que body.type === 'payment'
   - Consultar el pago real en la API de MP (no confiar en el body del webhook)
   - Manejar status: approved → paid, rejected/cancelled → cancelled
   - Idempotencia: ignorar si la orden ya está procesada

3. Implementar el Vercel Cron Job para cancelar órdenes pendientes vencidas:
   GET /api/cron/cancel-stale-orders (cancela órdenes pending > 48h)
   Agregar vercel.json con el schedule

4. Implementar lib/emails/order-confirmation.tsx y lib/emails/order-shipped.tsx de 05_SHIPPING_EMAIL_ADMIN.md
5. Implementar lib/resend.ts
```

---

## PROMPT 5 — Frontend de la tienda

```
Implementa el frontend de la tienda de 03_FRONTEND.md:

COMPONENTES BASE:
1. store/cart.ts (Zustand store) — exactamente como en 03_FRONTEND.md
2. components/ui/NavBar.tsx — con contador del carrito
3. components/ui/Footer.tsx — igual al diseño DLG existente
4. components/store/CartDrawer.tsx — slide-in desde la derecha
5. components/store/ProductCard.tsx — con hover de imagen y compra rápida
6. components/store/SizePicker.tsx — con tallas deshabilitadas si sin stock

PÁGINAS:
7. app/layout.tsx — NavBar + CartDrawer + fuentes Google
8. app/(store)/page.tsx — Home con hero, bento grid, editorial, newsletter
9. app/(store)/productos/page.tsx — Catálogo con filtros y paginación
10. app/(store)/productos/[slug]/page.tsx — Detalle de producto con galería

DISEÑO VISUAL (seguir estrictamente):
- Fondo #0e0e0e, texto blanco
- Space Grotesk para headlines (bold/black, uppercase, tracking-tighter)
- Inter para body
- Sin bordes redondeados (rounded-none)
- Imágenes en grayscale por defecto, color al hover
- Botones primarios: bg-white text-black font-black uppercase

Basarte en el HTML del Google Stitch incluido en el contexto como referencia visual exacta.
```

---

## PROMPT 6 — Checkout y páginas de pago

```
Implementa el flujo completo de checkout de 03_FRONTEND.md:

1. app/(store)/carrito/page.tsx — vista completa del carrito
2. app/(store)/checkout/page.tsx — formulario CheckoutForm con:
   - Validación con react-hook-form + zod
   - Selector de región/comuna de Chile (usando lib/chile-geo.ts)
   - Cotización de envío automática al cambiar la dirección (debounced 500ms)
   - Campo de código de descuento con validación en tiempo real
   - Selección de método de pago (Webpay | MercadoPago)
   - Al submit: llamar /api/checkout/init y redirigir al gateway

3. app/(store)/checkout/exito/page.tsx — página de éxito post-pago
4. app/(store)/checkout/error/page.tsx — página de error con mensaje según reason
5. app/(store)/checkout/webpay/return/page.tsx — procesamiento redirect Webpay
6. app/(store)/checkout/mercadopago/return/page.tsx — procesamiento redirect MP

Para el formulario de Transbank, implementar el auto-submit del form POST
(ver 04_PAYMENTS.md, sección "Flujo Completo Webpay").
```

---

## PROMPT 7 — Admin completo

```
Implementa el panel de administración completo de 03_FRONTEND.md y 02_API_ROUTES.md:

AUTH:
1. middleware.ts — protección de /admin/* y /api/admin/* con verificación de Google OAuth + tabla admin_users
2. app/admin/login/page.tsx — botón "Iniciar sesión con Google" via Supabase Auth
3. app/admin/layout.tsx — sidebar de navegación + header con logout

DASHBOARD:
4. GET /api/admin/stats con las consultas de lib/admin-stats.ts
5. app/admin/page.tsx — 4 stats cards + alerta stock bajo + tabla órdenes recientes

PRODUCTOS:
6. GET/POST/PATCH/DELETE /api/admin/productos y /api/admin/productos/[id]
7. Incluir upload de imágenes a Supabase Storage (ver 05_SHIPPING_EMAIL_ADMIN.md)
8. app/admin/productos/page.tsx — tabla con toggle activo/inactivo
9. app/admin/productos/nuevo/page.tsx — ProductForm
10. app/admin/productos/[id]/page.tsx — ProductForm con datos pre-cargados

ÓRDENES:
11. GET/PATCH /api/admin/ordenes y /api/admin/ordenes/[id]
12. app/admin/ordenes/page.tsx — tabla con filtros por estado
13. app/admin/ordenes/[id]/page.tsx — detalle + formulario de actualización (status + tracking)
    Al cambiar a 'shipped': llamar sendOrderShippedEmail()

DESCUENTOS:
14. GET/POST/PATCH/DELETE /api/admin/descuentos
15. app/admin/descuentos/page.tsx — lista + formulario inline para crear/editar

DISEÑO ADMIN:
- Mantener el estilo visual DLG (dark, Space Grotesk, minimal)
- Badges de estado con colores: paid=#00FF00, shipped=purple, cancelled=red, etc.
- Formatear todos los precios con formatCLP()
```

---

## PROMPT 8 — Deploy

```
Prepara el proyecto para deploy en Vercel:

1. Verificar que todas las variables de entorno estén en .env.local
2. En Transbank: cambiar a credenciales reales de producción (TRANSBANK_ENV=production)
3. En MercadoPago: usar ACCESS_TOKEN de producción (no sandbox)
4. Configurar en Vercel Dashboard todas las variables de entorno
5. En Supabase: verificar que Site URL = https://desdelagrada.cl
6. En Google Cloud Console: agregar https://desdelagrada.cl/admin a Authorized redirect URIs
7. Verificar CORS en Supabase → Storage → Policies
8. Configurar dominio personalizado en Vercel
9. Testear flujo completo: agregar producto → checkout → pago → webhook → email
10. Verificar los Cron Jobs de Vercel están activos
```
