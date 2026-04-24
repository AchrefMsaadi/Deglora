-- ============================================================
-- DEGLORA — Supabase Schema
-- Run this SQL in your Supabase project:
--   Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================================

-- ============ PROFILES ============
-- Extends Supabase's built-in auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT DEFAULT '',
  points      INTEGER DEFAULT 0,
  tier        TEXT DEFAULT 'Seed',   -- Seed | Oat | Date
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS public.orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  items       JSONB NOT NULL DEFAULT '[]',
  total_tnd   NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping    JSONB NOT NULL DEFAULT '{}',
  payment     TEXT NOT NULL DEFAULT 'card',  -- card | cash | d17
  pts_earned  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'pending',         -- pending | confirmed | shipped | delivered | cancelled
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ QR SCANS ============
CREATE TABLE IF NOT EXISTS public.qr_scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  qr_code     TEXT NOT NULL,
  pts_earned  INTEGER DEFAULT 0,
  scanned_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one bonus per user per bottle
CREATE UNIQUE INDEX IF NOT EXISTS qr_scans_first_scan
  ON public.qr_scans (user_id, qr_code);

-- ============ RPC: increment_points ============
-- Atomically adds delta points to a profile and updates tier
CREATE OR REPLACE FUNCTION public.increment_points(user_id UUID, delta INTEGER)
RETURNS VOID AS $$
DECLARE
  new_points INTEGER;
  new_tier   TEXT;
BEGIN
  UPDATE public.profiles
  SET points = GREATEST(points + delta, 0)
  WHERE id = user_id
  RETURNING points INTO new_points;

  -- Auto-tier upgrade
  IF new_points >= 500 THEN
    new_tier := 'Date';
  ELSIF new_points >= 200 THEN
    new_tier := 'Oat';
  ELSE
    new_tier := 'Seed';
  END IF;

  UPDATE public.profiles SET tier = new_tier WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update only their own row
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Orders: users can insert and read their own orders
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- QR scans: users can insert and read their own scans
CREATE POLICY "qr_scans_insert_own" ON public.qr_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "qr_scans_select_own" ON public.qr_scans
  FOR SELECT USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_user_id  ON public.qr_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_code     ON public.qr_scans (qr_code);

-- ============ SAMPLE DATA (optional) ============
-- Uncomment to seed bottle registry for demo
-- INSERT INTO public.qr_codes (code, blend, origin) VALUES
--   ('DGL-001-ORIG', 'Original Blend',   'Tozeur, Tunisia'),
--   ('DGL-002-FOCS', 'Focus Formula',    'Tozeur, Tunisia'),
--   ('DGL-003-ATHL', 'Athlete Formula',  'Tozeur, Tunisia'),
--   ('DGL-004-VTAL', 'Vitality Formula', 'Tozeur, Tunisia')
-- ON CONFLICT DO NOTHING;
