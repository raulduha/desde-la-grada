# DLG — DATABASE SPEC (Supabase PostgreSQL)

## Instrucciones para Claude Code
Ejecutar este SQL en Supabase → SQL Editor en el orden exacto indicado.
Habilitar RLS en todas las tablas. Las políticas están al final.

---

## EXTENSIONES

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda de texto
```

---

## TABLA: products

```sql
CREATE TYPE product_category AS ENUM ('bordado', 'serigrafia');

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  base_price    INTEGER NOT NULL CHECK (base_price > 0), -- CLP, sin decimales
  category      product_category NOT NULL,
  images        TEXT[] NOT NULL DEFAULT '{}', -- URLs Supabase Storage
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);
```

---

## TABLA: inventory

```sql
CREATE TYPE clothing_size AS ENUM ('S', 'M', 'L', 'XL', '2XL', '3XL');

CREATE TABLE inventory (
  id              SERIAL PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size            clothing_size NOT NULL,
  stock_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  UNIQUE(product_id, size)
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

---

## TABLA: discount_codes

```sql
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE discount_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) NOT NULL UNIQUE,
  type            discount_type NOT NULL,
  value           INTEGER NOT NULL CHECK (value > 0),
  -- Si type='percentage': value=10 → 10% de descuento (máx 100)
  -- Si type='fixed': value=5000 → $5.000 CLP de descuento
  min_order_amount INTEGER DEFAULT 0, -- Monto mínimo para aplicar
  max_uses        INTEGER, -- NULL = ilimitado
  uses_count      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ, -- NULL = no expira
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
```

---

## TABLA: orders

```sql
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_gateway AS ENUM ('webpay', 'mercadopago');

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Cliente
  customer_email      VARCHAR(255) NOT NULL,
  customer_name       VARCHAR(255) NOT NULL,
  customer_phone      VARCHAR(20),
  -- Dirección (JSONB para flexibilidad)
  shipping_address    JSONB NOT NULL,
  -- Ejemplo shipping_address:
  -- {
  --   "street": "Av. Providencia 1234",
  --   "apartment": "Depto 5B",
  --   "commune": "Providencia",
  --   "commune_id": 13119,
  --   "region": "Región Metropolitana",
  --   "region_id": 13,
  --   "city": "Santiago",
  --   "zip_code": "7500000"
  -- }
  -- Montos (todos en CLP entero)
  subtotal            INTEGER NOT NULL CHECK (subtotal > 0),
  discount_amount     INTEGER NOT NULL DEFAULT 0,
  shipping_cost       INTEGER NOT NULL DEFAULT 0,
  total_amount        INTEGER NOT NULL CHECK (total_amount > 0),
  -- Descuento aplicado
  discount_code_id    UUID REFERENCES discount_codes(id),
  discount_code_used  VARCHAR(50), -- Guardar el código como string también
  -- Pago
  status              order_status NOT NULL DEFAULT 'pending',
  payment_gateway     payment_gateway,
  payment_id          VARCHAR(255), -- token_ws (Webpay) o payment_id (MP)
  payment_data        JSONB, -- Respuesta completa del gateway (para auditoría)
  -- Envío
  shipping_method     VARCHAR(50) DEFAULT 'starken', -- 'starken' o 'flat'
  tracking_number     VARCHAR(100),
  tracking_url        TEXT,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at             TIMESTAMPTZ,
  shipped_at          TIMESTAMPTZ
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
```

---

## TABLA: order_items

```sql
CREATE TABLE order_items (
  id              SERIAL PRIMARY KEY,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  product_name    VARCHAR(100) NOT NULL, -- Snapshot al momento de la compra
  product_slug    VARCHAR(100) NOT NULL,
  product_image   TEXT, -- Primera imagen del producto
  size            clothing_size NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      INTEGER NOT NULL CHECK (unit_price > 0), -- Precio al momento de compra
  total_price     INTEGER NOT NULL -- quantity * unit_price
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

---

## TABLA: admin_users

```sql
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar el primer admin manualmente:
-- INSERT INTO admin_users (email) VALUES ('tu@email.com');
```

---

## FUNCIONES Y TRIGGERS

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para descontar stock de forma ATÓMICA (usada en webhooks)
CREATE OR REPLACE FUNCTION deduct_stock(
  p_order_id UUID
) RETURNS VOID AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN
    SELECT product_id, size, quantity
    FROM order_items
    WHERE order_id = p_order_id
  LOOP
    UPDATE inventory
    SET stock_quantity = stock_quantity - item.quantity
    WHERE product_id = item.product_id
      AND size = item.size
      AND stock_quantity >= item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para producto % talla %',
        item.product_id, item.size;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para validar stock antes de crear orden
CREATE OR REPLACE FUNCTION validate_stock(
  items JSONB -- Array de {product_id, size, quantity}
) RETURNS BOOLEAN AS $$
DECLARE
  item JSONB;
  available INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    SELECT stock_quantity INTO available
    FROM inventory
    WHERE product_id = (item->>'product_id')::UUID
      AND size = (item->>'size')::clothing_size;

    IF available IS NULL OR available < (item->>'quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función incrementar uses_count de discount_code
CREATE OR REPLACE FUNCTION increment_discount_uses(p_code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_codes
  SET uses_count = uses_count + 1
  WHERE id = p_code_id;
END;
$$ LANGUAGE plpgsql;
```

---

## ROW LEVEL SECURITY (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: lectura pública de productos activos
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (is_active = true);

-- PRODUCTS: solo service_role puede escribir (via API server-side)
CREATE POLICY "products_service_write"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

-- INVENTORY: lectura pública
CREATE POLICY "inventory_public_read"
  ON inventory FOR SELECT
  USING (true);

CREATE POLICY "inventory_service_write"
  ON inventory FOR ALL
  USING (auth.role() = 'service_role');

-- ORDERS: solo service_role (nunca exposición directa al cliente)
CREATE POLICY "orders_service_only"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "order_items_service_only"
  ON order_items FOR ALL
  USING (auth.role() = 'service_role');

-- DISCOUNT_CODES: lectura solo service_role
CREATE POLICY "discount_codes_service_only"
  ON discount_codes FOR ALL
  USING (auth.role() = 'service_role');

-- ADMIN_USERS: solo service_role
CREATE POLICY "admin_users_service_only"
  ON admin_users FOR ALL
  USING (auth.role() = 'service_role');
```

---

## STORAGE BUCKETS (Supabase Dashboard)

```
Bucket: product-images
  - Public: true (URLs públicas directas)
  - Max file size: 5MB
  - Allowed MIME types: image/jpeg, image/png, image/webp

Política upload: solo autenticados con rol admin
Política lectura: pública
```

```sql
-- Crear bucket via SQL (alternativa al dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Policy: solo admins autenticados pueden subir
CREATE POLICY "admin_can_upload_images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Policy: lectura pública
CREATE POLICY "public_can_view_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

---

## DATOS SEED INICIALES

```sql
-- Comunas de la RM para cotización de envíos
-- (simplificado, expandir según necesidad)
-- En la app esto se maneja con un JSON estático o API de Starken

-- Primer admin (reemplazar email)
INSERT INTO admin_users (email, name)
VALUES ('admin@desdelagrada.cl', 'Admin DLG');

-- Producto demo
INSERT INTO products (name, slug, description, base_price, category, images)
VALUES (
  'Sudadera Terrace Concrete',
  'sudadera-terrace-concrete',
  '100% algodón pesado. Ajuste oversize para las gradas frías.',
  89000,
  'bordado',
  ARRAY['https://<supabase_url>/storage/v1/object/public/product-images/terrace-concrete-front.jpg']
);

-- Inventario del producto demo
INSERT INTO inventory (product_id, size, stock_quantity)
SELECT id, unnest(ARRAY['S','M','L','XL','2XL','3XL']::clothing_size[]), 10
FROM products WHERE slug = 'sudadera-terrace-concrete';

-- Código de descuento demo
INSERT INTO discount_codes (code, type, value, min_order_amount, max_uses)
VALUES
  ('GRADA10', 'percentage', 10, 0, NULL),      -- 10% ilimitado
  ('BIENVENIDO5000', 'fixed', 5000, 30000, 100); -- $5.000 fijo, mín $30.000, máx 100 usos
```
