-- ==========================================
-- ROUTEX ADMIN PANEL SCHEMA UPDATE (PRODUCTION SAFE)
-- Only modifying existing tables: bus_routes, stops, tickets, profiles
-- ==========================================

-- 1. Add columns to profiles for Users Manager
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- 2. Add display_order to stops
ALTER TABLE public.stops ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 3. Create secure function to detect admin role (idempotent via CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security (idempotent, safe to re-run)
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies only if they do not exist (idempotent and non-destructive)
DO $$
BEGIN
  -- bus_routes admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'bus_routes' AND policyname = 'Admins manage bus_routes'
  ) THEN
    CREATE POLICY "Admins manage bus_routes" ON public.bus_routes 
        FOR ALL TO authenticated 
        USING (public.is_admin()) 
        WITH CHECK (public.is_admin());
  END IF;

  -- stops admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stops' AND policyname = 'Admins manage stops'
  ) THEN
    CREATE POLICY "Admins manage stops" ON public.stops 
        FOR ALL TO authenticated 
        USING (public.is_admin()) 
        WITH CHECK (public.is_admin());
  END IF;

  -- tickets admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tickets' AND policyname = 'Admins manage tickets'
  ) THEN
    CREATE POLICY "Admins manage tickets" ON public.tickets 
        FOR ALL TO authenticated 
        USING (public.is_admin()) 
        WITH CHECK (public.is_admin());
  END IF;

  -- profiles admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins manage profiles'
  ) THEN
    CREATE POLICY "Admins manage profiles" ON public.profiles 
        FOR ALL TO authenticated 
        USING (public.is_admin()) 
        WITH CHECK (public.is_admin());
  END IF;

  -- user_roles admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins manage user_roles'
  ) THEN
    CREATE POLICY "Admins manage user_roles" ON public.user_roles 
        FOR ALL TO authenticated 
        USING (public.is_admin()) 
        WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ==========================================
-- PHYSICAL TICKET SCANNING FEATURE
-- ==========================================

-- Create ticket_scans table
CREATE TABLE IF NOT EXISTS public.ticket_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    ticket_photo_url TEXT NOT NULL,
    ocr_text TEXT,
    bus_name TEXT,
    bus_number TEXT,
    from_stop TEXT,
    to_stop TEXT,
    fare NUMERIC,
    travel_date DATE,
    travel_time TEXT,
    ticket_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ticket_scans ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Users can view their own ticket scans" ON public.ticket_scans;
CREATE POLICY "Users can view their own ticket scans" 
    ON public.ticket_scans FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all ticket scans" ON public.ticket_scans;
CREATE POLICY "Admins can view all ticket scans" 
    ON public.ticket_scans FOR SELECT TO authenticated
    USING (public.is_admin());

-- Insert policy
DROP POLICY IF EXISTS "Users can insert their own ticket scans" ON public.ticket_scans;
CREATE POLICY "Users can insert their own ticket scans" 
    ON public.ticket_scans FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create private bucket and storage policies (using DO to catch errors if bucket insertion fails due to permissions)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('ticket-scans', 'ticket-scans', false) 
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not insert bucket, ignoring...';
END $$;

-- Storage policies for ticket-scans bucket
DROP POLICY IF EXISTS "Public Read Access on ticket-scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to ticket-scans" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to ticket-scans" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can view ticket-scans" ON storage.objects;

-- 1. Only authenticated users can upload ticket images
CREATE POLICY "Authenticated users can upload to ticket-scans" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'ticket-scans');

-- 2. Users can only view their own, admins can view all
CREATE POLICY "Users and admins can view ticket-scans" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'ticket-scans' AND (split_part(name, '_', 1) = auth.uid()::text OR public.is_admin()));

