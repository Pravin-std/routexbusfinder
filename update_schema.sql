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
