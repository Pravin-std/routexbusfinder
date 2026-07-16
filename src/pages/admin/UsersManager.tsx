import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck, Users as UsersIcon, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UsersManager() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: pError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (pError) throw pError;

      // Fetch roles
      const { data: roles, error: rError } = await supabase.from("user_roles").select("*");
      if (rError) throw rError;

      // Merge data
      return profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "user",
          role_id: userRole?.id
        };
      });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isCurrentlyAdmin, roleId }: { userId: string, isCurrentlyAdmin: boolean, roleId?: string }) => {
      if (isCurrentlyAdmin) {
        if (roleId) {
          const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: "admin"
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => toast.error(`Failed to update role: ${error.message}`),
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string, isBlocked: boolean }) => {
      // @ts-ignore
      const { error } = await supabase.from("profiles").update({ is_blocked: isBlocked }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User block status updated");
    },
    onError: (error: any) => toast.error(`Failed to update block status: ${error.message}`),
  });

  const columns = [
    { 
      header: "User", 
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.avatar_url || ""} />
            <AvatarFallback>{(item.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{item.name || "Unknown User"}</span>
            <span className="text-xs text-muted-foreground">{item.email || "No Email"}</span>
          </div>
        </div>
      )
    },
    { 
      header: "Joined Date", 
      cell: (item: any) => format(new Date(item.created_at), "MMM dd, yyyy") 
    },
    { 
      header: "Role", 
      cell: (item: any) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          item.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {item.role === 'admin' ? <ShieldCheck className="mr-1 h-3 w-3" /> : null}
          {item.role.toUpperCase()}
        </span>
      )
    },
    { 
      header: "Status", 
      cell: (item: any) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          item.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {item.is_blocked ? 'Blocked' : 'Active'}
        </span>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => {
        const isAdmin = item.role === 'admin';
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => {
                if (confirm(`Are you sure you want to ${isAdmin ? 'remove admin rights from' : 'make'} ${item.name || 'this user'} ${isAdmin ? '?' : 'an admin?'}`)) {
                  toggleAdminMutation.mutate({ 
                    userId: item.user_id, 
                    isCurrentlyAdmin: isAdmin, 
                    roleId: item.role_id 
                  });
                }
              }}
            >
              {isAdmin ? (
                <><ShieldAlert className="mr-2 h-4 w-4 text-orange-500" /> Remove Admin</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" /> Make Admin</>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              title={item.is_blocked ? "Unblock User" : "Block User"} 
              onClick={() => {
                if (confirm(`Are you sure you want to ${item.is_blocked ? 'unblock' : 'block'} ${item.name || 'this user'}?`)) {
                  toggleBlockMutation.mutate({ id: item.id, isBlocked: !item.is_blocked });
                }
              }}
            >
              {item.is_blocked ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Ban className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users Manager</h2>
          <p className="text-sm text-muted-foreground">Manage user accounts, roles, and access control.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <UsersIcon className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={users} 
              columns={columns} 
              searchKey="name" 
              searchPlaceholder="Search by user name..." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
