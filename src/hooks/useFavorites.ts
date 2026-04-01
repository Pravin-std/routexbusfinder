import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("bus_route_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((f) => f.bus_route_id));
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (busRouteId: string) => {
      if (!user) return;
      const isSaved = favoritesQuery.data?.has(busRouteId);
      if (isSaved) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("bus_route_id", busRouteId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, bus_route_id: busRouteId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  return {
    savedRouteIds: favoritesQuery.data || new Set<string>(),
    isLoading: favoritesQuery.isLoading,
    toggleFavorite: toggleFavorite.mutate,
  };
};
