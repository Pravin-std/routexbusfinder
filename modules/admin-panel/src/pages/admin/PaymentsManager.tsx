import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { CreditCard, Download } from "lucide-react";
import { format } from "date-fns";

export default function PaymentsManager() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments-from-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    if (payments.length === 0) return;
    
    // Generate CSV
    const headers = ["Ticket Code", "Passenger", "Amount", "Status", "Date"];
    const csvRows = payments.map((p: any) => [
      p.ticket_code,
      p.passenger_name || "N/A",
      p.price,
      p.status,
      format(new Date(p.created_at), "yyyy-MM-dd HH:mm:ss")
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_report_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { header: "Ticket Code", accessorKey: "ticket_code" as any, sortable: true },
    { header: "Passenger", accessorKey: "passenger_name" as any },
    { header: "Amount Paid", cell: (item: any) => <span className="font-medium">₹{item.price}</span> },
    { 
      header: "Status", 
      cell: (item: any) => {
        const color = item.status === 'success' ? 'text-green-600' : item.status === 'failed' ? 'text-red-600' : 'text-yellow-600';
        return <span className={`capitalize font-medium ${color}`}>{item.status === 'success' ? 'Paid' : item.status}</span>;
      } 
    },
    { header: "Payment Date", cell: (item: any) => format(new Date(item.created_at), "dd MMM yyyy, HH:mm") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments Log</h2>
          <p className="text-sm text-muted-foreground">Monitor booking transactions and export financial reports directly from your Tickets database.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={payments.length === 0 || isLoading}>
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <CreditCard className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={payments} 
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
