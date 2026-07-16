import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, MapPin, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StopsManager() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState = { id: "", name_en: "", name_ta: "", district: "", display_order: 0 };
  const [formData, setFormData] = useState<any>(initialFormState);

  const { data: stops = [], isLoading } = useQuery({
    queryKey: ["admin-stops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stops").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (stop: any) => {
      if (editingId) {
        const { data, error } = await supabase.from("stops").update(stop).eq("id", editingId);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("stops").insert(stop);
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stops"] });
      toast.success(editingId ? "Stop updated successfully" : "Stop added successfully");
      setIsAddOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
    },
    onError: (error: any) => toast.error(`Failed to save stop: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stops"] });
      toast.success("Stop deleted successfully");
    },
    onError: (error: any) => toast.error(`Failed to delete stop: ${error.message}`),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string, newOrder: number }) => {
      const { error } = await supabase.from("stops").update({ display_order: newOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stops"] });
    },
    onError: (error: any) => toast.error(`Failed to reorder: ${error.message}`)
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
    setIsAddOpen(true);
  };

  const moveUp = (item: any, index: number) => {
    if (index > 0) {
      reorderMutation.mutate({ id: item.id, newOrder: index - 1 });
      const prev = stops[index - 1];
      if (prev) reorderMutation.mutate({ id: prev.id, newOrder: index });
    }
  };

  const moveDown = (item: any, index: number) => {
    if (index < stops.length - 1) {
      reorderMutation.mutate({ id: item.id, newOrder: index + 1 });
      const next = stops[index + 1];
      if (next) reorderMutation.mutate({ id: next.id, newOrder: index });
    }
  };

  const columns = [
    { header: "Stop ID", accessorKey: "id" as any, sortable: true },
    { header: "Name (English)", accessorKey: "name_en" as any },
    { header: "Name (Tamil)", accessorKey: "name_ta" as any },
    { header: "District", accessorKey: "district" as any },
    {
      header: "Order",
      cell: (item: any) => {
        const index = stops.findIndex((s: any) => s.id === item.id);
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => moveUp(item, index)}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === stops.length - 1} onClick={() => moveDown(item, index)}>
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            if (confirm(`Are you sure you want to delete ${item.name_en}?`)) {
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
    if (!formData.id || !formData.name_en) {
      toast.error("Please fill ID and Name");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stops Manager</h2>
          <p className="text-sm text-muted-foreground">Manage bus stops, terminals, and their districts.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData(initialFormState);
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Stop</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Stop" : "Add New Stop"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Stop ID *</Label>
                <Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!editingId} placeholder="e.g. SLM" />
              </div>
              <div className="space-y-2">
                <Label>Name (English) *</Label>
                <Input value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="Salem" />
              </div>
              <div className="space-y-2">
                <Label>Name (Tamil)</Label>
                <Input value={formData.name_ta} onChange={e => setFormData({...formData, name_ta: e.target.value})} placeholder="சேலம்" />
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="Salem" />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Stop"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <MapPin className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={stops} 
              columns={columns} 
              searchKey="name_en" 
              searchPlaceholder="Search stops..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
