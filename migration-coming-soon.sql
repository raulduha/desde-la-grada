-- Agrega columna coming_soon a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN DEFAULT false;

-- Permite que el servicio admin (service_role) también lea productos coming_soon
-- (ya funciona porque supabaseAdmin usa la service_role key, que bypasea RLS)
-- No se necesita política adicional para el uso actual.
