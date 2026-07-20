import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Ticket, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BookingsManager() {
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking status updated");
    },
    onError: (error: any) => toast.error(`Failed to update status: ${error.message}`),
  });

  const columns = [
    { header: "Code", accessorKey: "ticket_code" as any, sortable: true },
    { header: "Passenger", accessorKey: "passenger_name" as any },
    { 
      header: "Route", 
      cell: (item: any) => `${item.from_name} → ${item.to_name}` 
    },
    { 
      header: "Date", 
      cell: (item: any) => format(new Date(item.created_at), "dd MMM yyyy, HH:mm") 
    },
    { header: "Amount", cell: (item: any) => `₹${item.price}` },
    {
      header: "Status",
      cell: (item: any) => (
        <select 
          className="bg-transparent border-none text-sm p-0 focus:ring-0 font-medium" 
          value={item.status} 
          onChange={(e) => updateStatusMutation.mutate({ id: item.id, status: e.target.value })}
        >
          <option value="success">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          {item.status !== 'cancelled' && (
            <Button variant="outline" size="sm" onClick={() => {
              if (confirm(`Are you sure you want to cancel booking ${item.ticket_code}?`)) {
                updateStatusMutation.mutate({ id: item.id, status: 'cancelled' });
              }
            }}>
              <Ban className="h-4 w-4 mr-1 text-red-500" /> Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bookings Manager</h2>
          <p className="text-sm text-muted-foreground">Manage customer bus bookings and tickets.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Ticket className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={bookings} 
              columns={columns} 
              searchKey="ticket_code" 
              searchPlaceholder="Search by ticket code..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
