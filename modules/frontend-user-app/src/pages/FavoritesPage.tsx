import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { BusRoute } from "@/hooks/useBusSearch";
import BusCard from "@/components/BusCard";
import { Bus, ArrowLeft } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const FavoritesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedRouteIds, toggleFavorite } = useFavorites();

  const { data: favoriteBuses = [], isLoading } = useQuery({
    queryKey: ["favoriteBuses", user?.id],
    queryFn: async () => {
      const { data: favs, error: favErr } = await supabase
        .from("favorites")
        .select("bus_route_id")
        .eq("user_id", user!.id);
      if (favErr) throw favErr;
      if (!favs.length) return [];

      const ids = favs.map((f) => f.bus_route_id);
      const { data, error } = await supabase
        .from("bus_routes")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return data as BusRoute[];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-foreground">{t.favorites.title}</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="container max-w-lg pt-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : favoriteBuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bus className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{t.favorites.noFavorites}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {favoriteBuses.map((bus) => (
              <div key={bus.id} className="relative">
                <BusCard bus={bus} />
                <button
                  onClick={() => toggleFavorite(bus.id)}
                  className="absolute right-3 top-3 text-xs font-medium text-destructive hover:underline"
                >
                  {t.favorites.remove}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default FavoritesPage;
