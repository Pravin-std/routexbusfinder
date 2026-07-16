import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, Bus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function BusesManager() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBusNumber, setEditingBusNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({ bus_name: "", bus_type: "ordinary" });

  const { data: buses = [], isLoading } = useQuery({
    queryKey: ["admin-buses-from-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_routes").select("bus_number, bus_name, bus_type");
      if (error) throw error;

      // Group by bus_number to get unique buses
      const uniqueBusesMap: Record<string, any> = {};
      (data || []).forEach((item: any) => {
        if (item.bus_number && !uniqueBusesMap[item.bus_number]) {
          uniqueBusesMap[item.bus_number] = {
            id: item.bus_number,
            bus_number: item.bus_number,
            bus_name: item.bus_name || "Unknown Bus",
            bus_type: item.bus_type || "ordinary",
          };
        }
      });

      return Object.values(uniqueBusesMap);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedBus: any) => {
      // Update all bus_routes that have the matching bus_number
      const { data, error } = await supabase
        .from("bus_routes")
        .update({
          bus_name: updatedBus.bus_name,
          bus_type: updatedBus.bus_type,
        })
        .eq("bus_number", editingBusNumber);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-buses-from-routes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success("Bus updated successfully");
      setIsEditOpen(false);
      setEditingBusNumber(null);
    },
    onError: (error: any) => toast.error(`Failed to update bus: ${error.message}`),
  });

  const handleEdit = (item: any) => {
    setEditingBusNumber(item.bus_number);
    setFormData({
      bus_name: item.bus_name,
      bus_type: item.bus_type,
    });
    setIsEditOpen(true);
  };

  const columns = [
    { header: "Bus Number", accessorKey: "bus_number" as any, sortable: true },
    { header: "Name", accessorKey: "bus_name" as any },
    { header: "Type", cell: (item: any) => <span className="capitalize">{item.bus_type}</span> },
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
    if (!formData.bus_name) {
      toast.error("Please fill all required fields");
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Buses Fleet</h2>
          <p className="text-sm text-muted-foreground">Manage your buses list automatically derived from active Routes.</p>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) setEditingBusNumber(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bus: {editingBusNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Bus Name *</Label>
              <Input value={formData.bus_name} onChange={e => setFormData({...formData, bus_name: e.target.value})} placeholder="RouteX Express" />
            </div>
            <div className="space-y-2">
              <Label>Bus Type</Label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" value={formData.bus_type} onChange={e => setFormData({...formData, bus_type: e.target.value})}>
                <option value="ordinary">Ordinary</option>
                <option value="express">Express</option>
                <option value="ac">AC</option>
                <option value="superDeluxe">Super Deluxe</option>
                <option value="sleeper">Sleeper</option>
                <option value="semiSleeper">Semi Sleeper</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Bus className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={buses} 
              columns={columns} 
              searchKey="bus_number" 
              searchPlaceholder="Search by bus number..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
