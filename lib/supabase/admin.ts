import { createClient } from '@supabase/supabase-js'

// Fallback vacío para que Next.js no explote al analizar rutas en el build.
// En producción siempre estarán las vars reales.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-key'
)
