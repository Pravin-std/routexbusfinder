import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useStops } from "@/hooks/useStops";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import LanguageToggle from "@/components/LanguageToggle";
import logo from "@/assets/routex-logo.jpg";

const BUS_TYPES = ["ordinary", "express", "ac", "superDeluxe"] as const;
const ROUTE_TYPES = ["intercity", "intracity", "longDistance"] as const;

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: stops = [] } = useStops();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: "",
    bus_number: "",
    bus_name: "",
    from_id: "",
    to_id: "",
    departure: "",
    arrival: "",
    duration_minutes: 60,
    price: 50,
    bus_type: "ordinary",
    route_type: "intercity",
    intermediate_stops: "",
    status: "onTime",
  });

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Admin access only</p>
        <p className="text-xs text-muted-foreground">Please sign in with the admin account.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (!role?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldCheck className="h-10 w-10 text-destructive" />
        <p className="text-sm font-semibold text-foreground">Not authorized</p>
        <p className="text-xs text-muted-foreground">Your account is not an admin.</p>
        <Button variant="secondary" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.from_id || !form.to_id || !form.bus_number || !form.departure || !form.arrival) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const intermediate = form.intermediate_stops
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await supabase.from("bus_routes").insert({
      id: form.id,
      bus_number: form.bus_number,
      bus_name: form.bus_name || form.bus_number,
      from_id: form.from_id,
      to_id: form.to_id,
      departure: form.departure,
      arrival: form.arrival,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      bus_type: form.bus_type,
      route_type: form.route_type,
      intermediate_stops: intermediate,
      status: form.status,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to add route", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bus route added ✓", description: `${form.bus_number} created` });
    setForm({ ...form, id: "", bus_number: "", bus_name: "", departure: "", arrival: "", intermediate_stops: "" });
  };

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-md p-1 text-foreground hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
            <img src={logo} alt="RouteX" className="h-6 w-6 rounded-md object-contain" />
            <span className="text-sm font-bold">Admin · Add Bus Route</span>
          </button>
          <LanguageToggle />
        </div>
      </header>

      <main className="container max-w-lg py-6">
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <Field label="Route ID *">
            <input className={inputCls} placeholder="e.g. SLM-ERD-22" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bus Number *">
              <input className={inputCls} placeholder="TN 30 N 1234" value={form.bus_number} onChange={(e) => setForm({ ...form, bus_number: e.target.value })} />
            </Field>
            <Field label="Bus Name">
              <input className={inputCls} placeholder="TNSTC" value={form.bus_name} onChange={(e) => setForm({ ...form, bus_name: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="From *">
              <select className={inputCls} value={form.from_id} onChange={(e) => setForm({ ...form, from_id: e.target.value })}>
                <option value="">Select</option>
                {stops.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
              </select>
            </Field>
            <Field label="To *">
              <select className={inputCls} value={form.to_id} onChange={(e) => setForm({ ...form, to_id: e.target.value })}>
                <option value="">Select</option>
                {stops.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Intermediate stop IDs (comma-separated)">
            <input className={inputCls} placeholder="kondalampatti, sankari, bhavani" value={form.intermediate_stops} onChange={(e) => setForm({ ...form, intermediate_stops: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure (HH:MM, 24h) *">
              <input className={inputCls} placeholder="06:30" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} />
            </Field>
            <Field label="Arrival (HH:MM, 24h) *">
              <input className={inputCls} placeholder="08:00" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (mins)">
              <input type="number" className={inputCls} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </Field>
            <Field label="Price (₹)">
              <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bus Type">
              <select className={inputCls} value={form.bus_type} onChange={(e) => setForm({ ...form, bus_type: e.target.value })}>
                {BUS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Route Type">
              <select className={inputCls} value={form.route_type} onChange={(e) => setForm({ ...form, route_type: e.target.value })}>
                {ROUTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Add Bus Route</>}
          </Button>
        </form>
      </main>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
    {children}
  </div>
);

export default AdminPage;
