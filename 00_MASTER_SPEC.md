# DLG — DESDE LA GRADA · MASTER SPEC
> Lee este archivo primero. Contiene el mapa completo del proyecto.

## Stack Definitivo

| Capa | Tecnología | Servicio |
|------|-----------|---------|
| Frontend + API | Next.js 14 (App Router) | Vercel |
| Base de datos | PostgreSQL | Supabase |
| Auth (admin) | Google OAuth | Supabase Auth |
| Storage imágenes | Supabase Storage | Supabase |
| Pagos 1 | Webpay Plus | Transbank SDK |
| Pagos 2 | MercadoPago | MP Python SDK (via Next.js API route proxy o directo) |
| Envíos RM | Precio fijo $3.500 CLP | — |
| Envíos regiones | Starken API | Starken |
| Email transaccional | Resend | resend.com |
| Estilos | TailwindCSS | — |

## Decisión de Arquitectura: Next.js Fullstack
- **Un solo repositorio**, un solo deploy en Vercel
- API Routes de Next.js reemplazan FastAPI
- Supabase maneja DB + Auth + Storage
- Escalar a microservicios después si es necesario

## Archivos de Spec (leer en orden)

1. `01_DATABASE.md` — Schema SQL completo, tablas, índices, RLS policies
2. `02_API_ROUTES.md` — Todos los endpoints Next.js API Routes (públicos + admin + webhooks)
3. `03_FRONTEND.md` — Páginas, componentes, diseño DLG, estado del carrito
4. `04_PAYMENTS.md` — Flujo Webpay + MercadoPago, webhooks, manejo de errores
5. `05_SHIPPING.md` — Lógica RM/Starken, cotización, fallback
6. `06_ADMIN.md` — Dashboard admin completo: productos, órdenes, stats, descuentos
7. `07_EMAIL.md` — Templates Resend, triggers, variables

## Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Transbank Webpay
TRANSBANK_API_KEY=
TRANSBANK_COMMERCE_CODE=
TRANSBANK_ENV=integration # o production

# MercadoPago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Starken
STARKEN_API_KEY=
STARKEN_API_URL=https://api.starken.cl/v1

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hola@desdelagrada.cl

# App
NEXT_PUBLIC_APP_URL=https://desdelagrada.cl
NEXT_PUBLIC_APP_URL_DEV=http://localhost:3000
WEBHOOK_SECRET=  # string aleatorio para validar webhooks internos

# Google OAuth (via Supabase)
# Configurar en Supabase Dashboard → Auth → Providers → Google
```

## Estructura de Carpetas

```
dlg/
├── app/
│   ├── (store)/              # Rutas públicas de la tienda
│   │   ├── page.tsx          # Home
│   │   ├── productos/
│   │   │   └── [slug]/page.tsx
│   │   ├── carrito/page.tsx
│   │   └── checkout/
│   │       ├── page.tsx
│   │       ├── exito/page.tsx
│   │       └── error/page.tsx
│   ├── admin/                # Rutas protegidas admin
│   │   ├── layout.tsx        # Middleware auth Google OAuth
│   │   ├── page.tsx          # Dashboard / stats
│   │   ├── productos/
│   │   │   ├── page.tsx      # Lista productos
│   │   │   ├── nuevo/page.tsx
│   │   │   └── [id]/page.tsx # Editar producto
│   │   ├── ordenes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── descuentos/page.tsx
│   └── api/
│       ├── productos/route.ts
│       ├── productos/[slug]/route.ts
│       ├── checkout/init/route.ts
│       ├── checkout/quote/route.ts
│       ├── webhooks/
│       │   ├── webpay/route.ts
│       │   └── mercadopago/route.ts
│       └── admin/
│           ├── productos/route.ts
│           ├── productos/[id]/route.ts
│           ├── ordenes/route.ts
│           ├── ordenes/[id]/route.ts
│           ├── stats/route.ts
│           └── descuentos/route.ts
├── components/
│   ├── store/
│   │   ├── ProductCard.tsx
│   │   ├── SizePicker.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CheckoutForm.tsx
│   │   └── PaymentSelector.tsx
│   ├── admin/
│   │   ├── StatsCard.tsx
│   │   ├── OrdersTable.tsx
│   │   ├── ProductForm.tsx
│   │   └── DiscountForm.tsx
│   └── ui/
│       ├── NavBar.tsx
│       ├── Footer.tsx
│       └── Badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Supabase browser client
│   │   ├── server.ts         # Supabase server client
│   │   └── admin.ts          # Service role client (solo server-side)
│   ├── transbank.ts
│   ├── mercadopago.ts
│   ├── starken.ts
│   ├── resend.ts
│   └── cart.ts               # Lógica carrito (Zustand)
├── store/
│   └── cart.ts               # Zustand store
├── types/
│   └── index.ts              # Todos los tipos TypeScript
└── middleware.ts              # Protección rutas /admin/*
```

## Orden de Implementación Recomendado para Claude Code

1. Setup: Supabase, schema SQL, variables de entorno
2. Types TypeScript
3. API Routes públicas (productos)
4. Frontend tienda (home, catálogo, producto)
5. Carrito (Zustand)
6. Checkout + pagos
7. Webhooks
8. Emails Resend
9. Admin dashboard
10. Descuentos
