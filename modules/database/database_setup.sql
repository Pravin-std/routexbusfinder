-- ==========================================
-- ROUTEX ADMIN PANEL DATABASE MIGRATION
-- ==========================================

-- 1. Create Routes Table
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_id UUID NOT NULL REFERENCES public.stops(id),
    destination_id UUID NOT NULL REFERENCES public.stops(id),
    distance_km NUMERIC,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Route Stops Table (Intermediate stops)
CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    fare_from_previous NUMERIC DEFAULT 0,
    arrival_offset_minutes INTEGER DEFAULT 0, -- Minutes from departure at source
    departure_offset_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(route_id, stop_id),
    UNIQUE(route_id, stop_order)
);

-- 3. Create Buses Table
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    bus_name VARCHAR(100) NOT NULL,
    bus_type VARCHAR(50) NOT NULL CHECK (bus_type IN ('ordinary', 'express', 'ac', 'superDeluxe', 'sleeper', 'semiSleeper')),
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 40,
    operator VARCHAR(100) DEFAULT 'RouteX Transport',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES public.routes(id),
    bus_id UUID NOT NULL REFERENCES public.buses(id),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    journey_duration_minutes INTEGER NOT NULL,
    operating_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon, 7=Sun
    driver_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'delayed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Fares Table (Dynamic Pricing overrides)
CREATE TABLE IF NOT EXISTS public.fares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    source_stop_id UUID NOT NULL REFERENCES public.stops(id),
    destination_stop_id UUID NOT NULL REFERENCES public.stops(id),
    fare NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(route_id, source_stop_id, destination_stop_id)
);

-- 6. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    passenger_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    schedule_id UUID NOT NULL REFERENCES public.schedules(id),
    route_id UUID NOT NULL REFERENCES public.routes(id),
    seat_number VARCHAR(10),
    amount NUMERIC NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    booking_status VARCHAR(50) DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'completed')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'razorpay',
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    refund_status VARCHAR(50) DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure profiles exist (it was in the previous schema, assuming it's still there)
-- If not, create it or ensure it's there.

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all new tables
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Routes: Everyone can read, only admin can modify
CREATE POLICY "Routes are viewable by everyone." ON public.routes FOR SELECT USING (true);
CREATE POLICY "Admins can insert routes." ON public.routes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update routes." ON public.routes FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete routes." ON public.routes FOR DELETE USING (is_admin());

-- Route Stops: Everyone can read, only admin can modify
CREATE POLICY "Route stops are viewable by everyone." ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Admins can insert route_stops." ON public.route_stops FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update route_stops." ON public.route_stops FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete route_stops." ON public.route_stops FOR DELETE USING (is_admin());

-- Buses: Everyone can read, only admin can modify
CREATE POLICY "Buses are viewable by everyone." ON public.buses FOR SELECT USING (true);
CREATE POLICY "Admins can insert buses." ON public.buses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update buses." ON public.buses FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete buses." ON public.buses FOR DELETE USING (is_admin());

-- Schedules: Everyone can read, only admin can modify
CREATE POLICY "Schedules are viewable by everyone." ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Admins can insert schedules." ON public.schedules FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update schedules." ON public.schedules FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete schedules." ON public.schedules FOR DELETE USING (is_admin());

-- Fares: Everyone can read, only admin can modify
CREATE POLICY "Fares are viewable by everyone." ON public.fares FOR SELECT USING (true);
CREATE POLICY "Admins can insert fares." ON public.fares FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update fares." ON public.fares FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete fares." ON public.fares FOR DELETE USING (is_admin());

-- Bookings: Users can see their own, admins can see all.
CREATE POLICY "Users can view their own bookings." ON public.bookings FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can create their own bookings." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins can update bookings." ON public.bookings FOR UPDATE USING (is_admin());

-- Payments: Users can see their own (via booking relation), admins can see all.
CREATE POLICY "Users can view their own payments." ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = payments.booking_id AND user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Users can insert payments." ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = payments.booking_id AND user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Admins can update payments." ON public.payments FOR UPDATE USING (is_admin());

-- Feedback: Users can see their own and insert. Admins can view/update all.
CREATE POLICY "Users can view their own feedback." ON public.feedback FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert feedback." ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update feedback." ON public.feedback FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete feedback." ON public.feedback FOR DELETE USING (is_admin());

-- Setup triggers to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_routes_modtime BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_buses_modtime BEFORE UPDATE ON public.buses FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_schedules_modtime BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_fares_modtime BEFORE UPDATE ON public.fares FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_feedback_modtime BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
