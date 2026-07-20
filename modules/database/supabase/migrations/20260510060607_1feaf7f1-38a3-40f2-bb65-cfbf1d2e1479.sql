-- Roles enum & user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to designated email; user role for everyone else
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'pravinstark456@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Backfill role if admin email already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'pravinstark456@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- Admin write access on bus_routes & stops
CREATE POLICY "Admins can insert bus routes"
  ON public.bus_routes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bus routes"
  ON public.bus_routes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bus routes"
  ON public.bus_routes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert stops"
  ON public.stops FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stops"
  ON public.stops FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_code TEXT NOT NULL UNIQUE,
  passenger_name TEXT NOT NULL,
  bus_route_id TEXT,
  bus_number TEXT NOT NULL,
  bus_name TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_tickets_user ON public.tickets(user_id, issued_at DESC);