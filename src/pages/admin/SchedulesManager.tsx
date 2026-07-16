import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, CalendarClock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SchedulesManager() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({ departure: "", arrival: "", status: "onTime" });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["admin-schedules-routes"],
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
    mutationFn: async (schedule: any) => {
      const { data, error } = await supabase
        .from("bus_routes")
        .update({
          departure: schedule.departure,
          arrival: schedule.arrival,
          status: schedule.status
        })
        .eq("id", editingId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-routes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success("Schedule updated successfully");
      setIsEditOpen(false);
      setEditingId(null);
    },
    onError: (error: any) => toast.error(`Failed to save schedule: ${error.message}`),
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      departure: item.departure,
      arrival: item.arrival,
      status: item.status
    });
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
    { header: "Departure", accessorKey: "departure" as any },
    { header: "Arrival", accessorKey: "arrival" as any },
    { 
      header: "Status", 
      cell: (item: any) => (
        <span className={`capitalize font-medium ${item.status === 'onTime' ? 'text-green-600' : 'text-yellow-600'}`}>
          {item.status}
        </span>
      )
    },
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
    if (!formData.departure || !formData.arrival) {
      toast.error("Please fill all required fields");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schedules Manager</h2>
          <p className="text-sm text-muted-foreground">Manage bus schedules and timing directly on your Routes.</p>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) setEditingId(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Schedule: {editingId}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure Time *</Label>
                <Input value={formData.departure} onChange={e => setFormData({...formData, departure: e.target.value})} placeholder="e.g. 08:00" />
              </div>
              <div className="space-y-2">
                <Label>Arrival Time *</Label>
                <Input value={formData.arrival} onChange={e => setFormData({...formData, arrival: e.target.value})} placeholder="e.g. 12:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="onTime">On Time</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <CalendarClock className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={schedules} 
              columns={columns} 
              searchKey="id" 
              searchPlaceholder="Search schedules..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
