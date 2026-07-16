import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Route as RouteIcon, Bus, Ticket, IndianRupee, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: routesCount },
        { data: routesData },
        { count: bookingsCount, data: recentBookings },
        { data: allBookings }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("bus_routes").select("*", { count: "exact", head: true }),
        supabase.from("bus_routes").select("bus_number"),
        supabase.from("tickets").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
        supabase.from("tickets").select("price, created_at, status").eq("status", "success")
      ]);

      const totalRevenue = (allBookings || []).reduce((sum, b) => sum + (Number(b.price) || 0), 0);

      // Get unique buses from bus_routes
      const uniqueBuses = new Set((routesData || []).map(r => r.bus_number).filter(Boolean));

      // Generate chart data for last 7 days
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return {
          date: format(d, "MMM dd"),
          fullDate: format(d, "yyyy-MM-dd"),
          revenue: 0,
        };
      });

      (allBookings || []).forEach(b => {
        const bDate = format(new Date(b.created_at), "yyyy-MM-dd");
        const day = last7Days.find(d => d.fullDate === bDate);
        if (day) day.revenue += Number(b.price) || 0;
      });

      return {
        users: usersCount || 0,
        routes: routesCount || 0,
        buses: uniqueBuses.size,
        bookings: bookingsCount || 0,
        revenue: totalRevenue,
        recentBookings: recentBookings || [],
        chartData: last7Days
      };
    }
  });

  if (statsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.bookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes</CardTitle>
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.routes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buses</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.buses}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats?.recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{booking.passenger_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.from_name} to {booking.to_name}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">+₹{booking.price}</div>
                </div>
              ))}
              {stats?.recentBookings.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No recent bookings</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
