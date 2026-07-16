import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Route as RouteIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStops } from "@/hooks/useStops";

export default function RoutesManager() {
  const queryClient = useQueryClient();
  const { data: stops = [] } = useStops();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState = {
    id: "", bus_number: "", bus_name: "", from_id: "", to_id: "",
    departure: "", arrival: "", duration_minutes: 60, price: 50,
    bus_type: "ordinary", route_type: "intercity", intermediate_stops: "", status: "onTime"
  };
  const [formData, setFormData] = useState<any>(initialFormState);

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_routes").select("*, from_stop:stops!bus_routes_from_id_fkey(name_en), to_stop:stops!bus_routes_to_id_fkey(name_en)");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (route: any) => {
      const intermediate = typeof route.intermediate_stops === 'string' 
        ? route.intermediate_stops.split(",").map((s: string) => s.trim()).filter(Boolean)
        : route.intermediate_stops;
      
      const payload = { ...route, intermediate_stops: intermediate, price: Number(route.price), duration_minutes: Number(route.duration_minutes) };
      
      if (editingId) {
        // Remove the id from payload when updating, unless we are updating the ID itself (which is bad practice for primary keys, but required if it's a natural string key).
        // For bus_routes, id is a string. So we update eq('id', editingId)
        const { data, error } = await supabase.from("bus_routes").update(payload).eq("id", editingId);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("bus_routes").insert(payload);
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success(editingId ? "Route updated successfully" : "Route added successfully");
      setIsAddOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
    },
    onError: (error: any) => toast.error(`Failed to save route: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bus_routes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success("Route deleted successfully");
    },
    onError: (error: any) => toast.error(`Failed to delete route: ${error.message}`),
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      intermediate_stops: item.intermediate_stops ? item.intermediate_stops.join(", ") : ""
    });
    setIsAddOpen(true);
  };

  const columns = [
    { header: "Route ID", accessorKey: "id" as any, sortable: true },
    { header: "Bus", accessorKey: "bus_number" as any },
    { header: "From", cell: (item: any) => item.from_stop?.name_en || item.from_id },
    { header: "To", cell: (item: any) => item.to_stop?.name_en || item.to_id },
    { header: "Departure", accessorKey: "departure" as any },
    { header: "Arrival", accessorKey: "arrival" as any },
    { header: "Price", cell: (item: any) => `₹${item.price}` },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            if (confirm(`Are you sure you want to delete route ${item.id}?`)) {
              deleteMutation.mutate(item.id);
            }
          }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.from_id || !formData.to_id || !formData.bus_number || !formData.departure || !formData.arrival) {
      toast.error("Please fill all required fields");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Routes Manager</h2>
          <p className="text-sm text-muted-foreground">Manage active bus routes and their details.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData(initialFormState);
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Route</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Route" : "Add New Route"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Route ID *</Label>
                <Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!editingId} placeholder="e.g. SLM-CBE-01" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bus Number *</Label>
                  <Input value={formData.bus_number} onChange={e => setFormData({...formData, bus_number: e.target.value})} placeholder="TN-30-A-1234" />
                </div>
                <div className="space-y-2">
                  <Label>Bus Name</Label>
                  <Input value={formData.bus_name} onChange={e => setFormData({...formData, bus_name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Stop *</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" value={formData.from_id} onChange={e => setFormData({...formData, from_id: e.target.value})}>
                    <option value="">Select</option>
                    {stops.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>To Stop *</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" value={formData.to_id} onChange={e => setFormData({...formData, to_id: e.target.value})}>
                    <option value="">Select</option>
                    {stops.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure (HH:MM) *</Label>
                  <Input value={formData.departure} onChange={e => setFormData({...formData, departure: e.target.value})} placeholder="08:00" />
                </div>
                <div className="space-y-2">
                  <Label>Arrival (HH:MM) *</Label>
                  <Input value={formData.arrival} onChange={e => setFormData({...formData, arrival: e.target.value})} placeholder="12:00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Route"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RouteIcon className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={routes} 
              columns={columns} 
              searchKey="id" 
              searchPlaceholder="Search by route ID..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
