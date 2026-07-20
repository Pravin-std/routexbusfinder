import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { MessageSquare, Check, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("routex-feedback");
    if (saved) {
      setFeedbacks(JSON.parse(saved));
    } else {
      const defaultFeedback = [
        { id: "1", user_name: "John Doe", rating: 5, comment: "Amazing booking experience! Highly recommended.", status: "pending", created_at: new Date().toISOString() },
        { id: "2", user_name: "Priya Kumar", rating: 4, comment: "Bus was on time, very clean interior.", status: "resolved", created_at: new Date().toISOString() }
      ];
      localStorage.setItem("routex-feedback", JSON.stringify(defaultFeedback));
      setFeedbacks(defaultFeedback);
    }
  }, []);

  const saveFeedback = (updated: any[]) => {
    localStorage.setItem("routex-feedback", JSON.stringify(updated));
    setFeedbacks(updated);
  };

  const handleResolve = (id: string) => {
    const updated = feedbacks.map(f => f.id === id ? { ...f, status: "resolved" } : f);
    saveFeedback(updated);
    toast.success("Feedback marked as resolved");
  };

  const handleDelete = (id: string) => {
    const updated = feedbacks.filter(f => f.id !== id);
    saveFeedback(updated);
    toast.success("Feedback deleted");
  };

  const columns = [
    { 
      header: "User", 
      accessorKey: "user_name" as any
    },
    { 
      header: "Rating", 
      cell: (item: any) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
      )
    },
    { header: "Comment", accessorKey: "comment" as any },
    { 
      header: "Status", 
      cell: (item: any) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          item.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {item.status.toUpperCase()}
        </span>
      ) 
    },
    { header: "Submitted", cell: (item: any) => format(new Date(item.created_at), "dd MMM yyyy") },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          {item.status !== 'resolved' && (
            <Button variant="ghost" size="icon" onClick={() => handleResolve(item.id)}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => {
            if (confirm("Are you sure you want to delete this feedback?")) {
              handleDelete(item.id);
            }
          }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feedback Manager</h2>
          <p className="text-sm text-muted-foreground">Review user feedback and ratings (Stored locally).</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable 
            data={feedbacks} 
            columns={columns} 
            searchKey="comment" 
            searchPlaceholder="Search feedback comments..." 
          />
        </CardContent>
      </Card>
    </div>
  );
}
