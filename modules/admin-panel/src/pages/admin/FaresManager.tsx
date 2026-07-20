import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, IndianRupee, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function FaresManager() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkDiscount, setBulkDiscount] = useState<number>(0);
  
  const [formData, setFormData] = useState<any>({ price: 50 });

  const { data: fares = [], isLoading } = useQuery({
    queryKey: ["admin-fares-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_routes").select(`
        *,
        from_stop:stops!bus_routes_from_id_fkey(name_en),
        to_stop:stops!bus_routes_to_id_fkey(name_en)
      `);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (fare: any) => {
      const { data, error } = await supabase
        .from("bus_routes")
        .update({ price: Number(fare.price) })
        .eq("id", editingId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fares-routes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success("Fare updated successfully");
      setIsEditOpen(false);
      setEditingId(null);
    },
    onError: (error: any) => toast.error(`Failed to save fare: ${error.message}`),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (discountVal: number) => {
      // Fetch all routes to modify them one by one or apply a SQL command
      // In Supabase, if we want to run a bulk UPDATE where we decrease the price, we can do it via RPC or update all records.
      // Let's fetch all, update locally, and update them.
      const { data: routes } = await supabase.from("bus_routes").select("id, price");
      if (!routes) return;

      const promises = routes.map(r => {
        const newPrice = Math.max(0, Math.round(r.price * (1 - discountVal / 100)));
        return supabase.from("bus_routes").update({ price: newPrice }).eq("id", r.id);
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fares-routes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success(`Applied ${bulkDiscount}% discount to all routes!`);
    },
    onError: (error: any) => toast.error(`Bulk update failed: ${error.message}`),
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ price: item.price });
    setIsEditOpen(true);
  };

  const columns = [
    { header: "Route ID", accessorKey: "id" as any, sortable: true },
    { 
      header: "Route Description", 
      cell: (item: any) => `${item.from_stop?.name_en || item.from_id} → ${item.to_stop?.name_en || item.to_id}`
    },
    { 
      header: "Bus", 
      cell: (item: any) => `${item.bus_number} (${item.bus_name})`
    },
    { header: "Base Fare", cell: (item: any) => <span className="font-bold text-green-600">₹{item.price}</span> },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.price) {
      toast.error("Please enter a valid fare");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fares Manager</h2>
          <p className="text-sm text-muted-foreground">Manage route pricing and apply dynamic bulk discounts.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            placeholder="Bulk Disc %" 
            className="w-24 h-9" 
            value={bulkDiscount} 
            onChange={e => setBulkDiscount(Number(e.target.value))} 
          />
          <Button variant="secondary" size="sm" onClick={() => {
            if (confirm(`Apply ${bulkDiscount}% discount to ALL routes?`)) {
              bulkUpdateMutation.mutate(bulkDiscount);
            }
          }} disabled={bulkUpdateMutation.isPending}>
            Apply All
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) setEditingId(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Fare: {editingId}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Base Fare (₹) *</Label>
              <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Fare"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <IndianRupee className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={fares} 
              columns={columns} 
              searchKey="id" 
              searchPlaceholder="Search fares..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
