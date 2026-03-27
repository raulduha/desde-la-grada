# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DLG - Desde la Grada** is a Chilean streetwear e-commerce platform. This repo currently contains the full specification (no code yet). The specs are the source of truth for implementation.

## Spec Files (read in this order)

1. `00_MASTER_SPEC.md` — Stack, folder structure, env vars
2. `01_DATABASE.md` — PostgreSQL schema, RLS policies, PG functions
3. `02_API_ROUTES.md` — All API endpoints with TypeScript examples
4. `03_FRONTEND.md` — Pages, components, design system, Zustand cart
5. `04_PAYMENTS.md` — Webpay Plus + MercadoPago flows, webhooks
6. `05_SHIPPING_EMAIL_ADMIN.md` — Starken shipping, Resend emails, admin dashboard
7. `06_CLAUDE_CODE_PROMPTS.md` — 8 sequential implementation prompts

## Stack

- **Framework**: Next.js 14 App Router + TypeScript
- **DB / Auth / Storage**: Supabase (PostgreSQL + Google OAuth + Storage)
- **Styling**: TailwindCSS (dark theme, brutalist)
- **State**: Zustand (cart, persisted to localStorage)
- **Payments**: Transbank Webpay Plus (primary) + MercadoPago (alternative)
- **Shipping**: Fixed $3,500 CLP for RM (region 13); Starken API for other regions
- **Email**: Resend + React Email
- **Deploy**: Vercel

## Commands (once project is initialized)

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint
```

Initialize with:
```bash
npx create-next-app@latest dlg --typescript --tailwind --app --src-dir=false
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs zustand react-hook-form zod @hookform/resolvers framer-motion transbank-sdk mercadopago resend @react-email/components
```

## Architecture

### Route Groups
- `app/(store)/` — Public storefront (home, catalog, product detail, cart, checkout)
- `app/admin/` — Protected admin panel (Google OAuth + `admin_users` table whitelist)
- `app/api/` — API routes (public, admin, webhooks, cron)

### Supabase Clients (three distinct usages)
- `lib/supabase/client.ts` — `createBrowserClient` for Client Components
- `lib/supabase/server.ts` — `createServerClient` with cookies for Server Components
- `lib/supabase/admin.ts` — `SUPABASE_SERVICE_ROLE_KEY` for all API routes (server-only)

### Payment Flows
**Webpay**: `POST /api/checkout/init` → order created (status: pending) → Transbank redirect → user pays → Transbank POSTs to `/api/webhooks/webpay` → confirm transaction, verify amount, update order, deduct stock, send email → redirect to `/checkout/exito`.

**MercadoPago**: same init flow → MP redirect → MP POSTs IPN to `/api/webhooks/mercadopago` → query MP API to verify payment → update order.

### Stock Management
Always use the `deduct_stock(order_id)` PostgreSQL RPC for atomic stock deduction — never update inventory directly from application code. Validate with `validate_stock()` before creating an order.

### Security Rules
- Never trust frontend prices — always recalculate totals from DB in API routes
- Use `supabaseAdmin` (service role) in all API routes, never the anon client
- Webhooks must verify amounts match `order.total_amount` and check idempotency (skip if already processed)
- Admin routes protected by `middleware.ts` — validates Google OAuth session + `admin_users` table

## Design System

- Background: `#0e0e0e`, text: `#ffffff`, accent: `#00FF00`
- Fonts: Space Grotesk (headlines, bold/black, uppercase, `tracking-tighter`), Inter (body)
- No border radius (`rounded-none` everywhere)
- Images: grayscale by default, color on hover
- Buttons: `bg-white text-black font-black uppercase`
- Admin badges: paid=`#00FF00`, shipped=purple, cancelled=red

## Key Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TRANSBANK_API_KEY=
TRANSBANK_COMMERCE_CODE=
TRANSBANK_ENV=integration   # or production
MP_ACCESS_TOKEN=
NEXT_PUBLIC_MP_PUBLIC_KEY=
STARKEN_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://desdelagrada.cl
WEBHOOK_SECRET=
```

## Vercel Cron Job

`GET /api/cron/cancel-stale-orders` — cancels orders stuck in `pending` status for > 48h. Configure in `vercel.json`.
