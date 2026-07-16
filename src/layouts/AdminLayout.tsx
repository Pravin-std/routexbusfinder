import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Menu, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sidebar } from "@/components/admin/Sidebar";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !role?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <ShieldCheck className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-sm text-muted-foreground">You must be an administrator to view this area.</p>
        
        <div className="mt-6 rounded-md bg-secondary p-4 text-left text-xs text-secondary-foreground shadow-sm max-w-md w-full border border-border">
          <h3 className="font-bold mb-2 border-b border-border pb-1">Auth Debug Info</h3>
          <p><strong>UUID:</strong> {user?.id || "Not authenticated"}</p>
          <p><strong>Email:</strong> {user?.email || "N/A"}</p>
          <p><strong>Roles from DB:</strong> {role?.roles ? JSON.stringify(role.roles) : "None or Error"}</p>
          <p><strong>Is Admin:</strong> {role?.isAdmin ? "Yes" : "No"}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {user ? (
              role?.roles?.includes("admin") ? "Authorized." : "UUID mismatch or role missing in user_roles table. Please ensure the user_roles table has an entry mapping your UUID to 'admin', and RLS allows SELECT for your UUID."
            ) : "Please log in to verify your UUID and roles."}
          </p>
        </div>

        <div className="flex gap-4 mt-4">
          <Button variant="outline" onClick={() => window.location.href = "/"}>Return to Home</Button>
          {!user && (
            <Button onClick={() => window.location.href = "/profile"}>Go to Login</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 hover:bg-secondary md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold md:text-base">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="hidden h-8 w-8 rounded-full bg-primary/10 md:flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
