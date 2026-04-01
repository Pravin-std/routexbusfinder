-- Create stops table
CREATE TABLE public.stops (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  district TEXT NOT NULL
);

ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stops are publicly readable" ON public.stops
  FOR SELECT USING (true);

-- Create bus_routes table
CREATE TABLE public.bus_routes (
  id TEXT PRIMARY KEY,
  bus_number TEXT NOT NULL,
  bus_name TEXT NOT NULL,
  from_id TEXT NOT NULL REFERENCES public.stops(id),
  to_id TEXT NOT NULL REFERENCES public.stops(id),
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  route_type TEXT NOT NULL CHECK (route_type IN ('direct', 'stops')),
  status TEXT NOT NULL DEFAULT 'onTime' CHECK (status IN ('onTime', 'delayed')),
  bus_type TEXT NOT NULL CHECK (bus_type IN ('ordinary', 'express', 'superDeluxe', 'ac')),
  intermediate_stops TEXT[] DEFAULT '{}'
);

ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bus routes are publicly readable" ON public.bus_routes
  FOR SELECT USING (true);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bus_route_id TEXT NOT NULL REFERENCES public.bus_routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, bus_route_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create recent_searches table
CREATE TABLE public.recent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_id TEXT NOT NULL REFERENCES public.stops(id),
  to_id TEXT NOT NULL REFERENCES public.stops(id),
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own searches" ON public.recent_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add searches" ON public.recent_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" ON public.recent_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();