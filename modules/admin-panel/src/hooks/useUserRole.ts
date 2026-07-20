import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-role", user?.id, "force-fetch"],
    enabled: !!user?.id,
    queryFn: async () => {
      // LOCAL DEVELOPMENT BYPASS
      if (import.meta.env.DEV && user?.id === "dev-admin-uuid-1234") {
        return { roles: ["admin"], isAdmin: true };
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data || []).map((r) => r.role as string);

      return {
        roles,
        isAdmin: roles.includes("admin"),
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};
