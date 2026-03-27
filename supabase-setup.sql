-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  cover_image TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (sizes + stock per product)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  UNIQUE(product_id, size)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Public can read active products
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true);

-- Service role can do everything
CREATE POLICY "Service role all products" ON products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read inventory" ON inventory
  FOR SELECT USING (true);

CREATE POLICY "Service role all inventory" ON inventory
  FOR ALL USING (auth.role() = 'service_role');

-- Site settings (landing page CMS)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
CREATE POLICY "Public read site_settings" ON site_settings
  FOR SELECT USING (true);

-- Service role can write settings
CREATE POLICY "Service role all site_settings" ON site_settings
  FOR ALL USING (auth.role() = 'service_role');
