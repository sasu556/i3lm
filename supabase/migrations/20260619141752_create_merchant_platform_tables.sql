/*
# Create merchant platform tables

1. New Tables
   - `stores` — one row per merchant store. Columns:
     - id (uuid PK)
     - store_name (text, not null)
     - store_slug (text, unique, not null) — used in /store/:slug URLs
     - user_id (uuid, FK → auth.users, defaults to auth.uid())
     - admin_email (text)
     - admin_name (text)
     - admin_password (text)
     - primary_color (text, default '#4f46e5')
     - bg_color (text, default '#f9fafb')
     - bg_image_url (text)
     - font_family (text, default 'system-ui') — NEW: optional font override applied to storefront
     - created_at (timestamptz)
   - `products` — store inventory. Columns:
     - id (uuid PK)
     - store_slug (text, indexed)
     - title (text, not null)
     - price (numeric, not null)
     - description (text)
     - image_url (text)
     - product_type (text, default 'physical')
     - created_at (timestamptz)
   - `orders` — customer orders. Columns:
     - id (uuid PK)
     - store_slug (text, indexed)
     - customer_name (text)
     - customer_phone (text)
     - customer_address (text)
     - items (jsonb)
     - total_price (numeric)
     - created_at (timestamptz)

2. Security (RLS)
   - Enable RLS on all three tables.
   - `stores`: authenticated owner can SELECT/INSERT/UPDATE/DELETE their own rows.
     Public (anon) can SELECT stores by slug so storefront loads for customers.
   - `products`: public (anon) can SELECT so storefront loads; authenticated owner can INSERT/UPDATE/DELETE
     (scoped to slugs they own via subquery).
   - `orders`: public (anon) can INSERT so customers place orders; authenticated owner can SELECT
     orders for their stores; no UPDATE/DELETE needed.

3. Important Notes
   - All migration statements are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
   - No destructive operations.
   - `user_id` on stores defaults to auth.uid() so merchant inserts succeed without passing it.
*/

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  store_slug text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email text,
  admin_name text,
  admin_password text,
  primary_color text DEFAULT '#4f46e5',
  bg_color text DEFAULT '#f9fafb',
  bg_image_url text,
  font_family text DEFAULT 'system-ui',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug text NOT NULL,
  title text NOT NULL,
  price numeric NOT NULL,
  description text,
  image_url text,
  product_type text DEFAULT 'physical',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_store_slug_idx ON products(store_slug);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug text NOT NULL,
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb,
  total_price numeric,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_store_slug_idx ON orders(store_slug);

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- stores: owner-scoped CRUD + public read for storefront
DROP POLICY IF EXISTS "select_own_stores" ON stores;
CREATE POLICY "select_own_stores" ON stores FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_select_stores" ON stores;
CREATE POLICY "public_select_stores" ON stores FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "insert_own_stores" ON stores;
CREATE POLICY "insert_own_stores" ON stores FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stores" ON stores;
CREATE POLICY "update_own_stores" ON stores FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_stores" ON stores;
CREATE POLICY "delete_own_stores" ON stores FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- products: public read for storefront, owner-scoped write
DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.store_slug = products.store_slug AND stores.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.store_slug = products.store_slug AND stores.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.store_slug = products.store_slug AND stores.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.store_slug = products.store_slug AND stores.user_id = auth.uid())
  );

-- orders: public can insert (checkout); owners can read their store's orders
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.store_slug = orders.store_slug AND stores.user_id = auth.uid())
  );
