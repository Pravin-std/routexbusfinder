import React, { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStops } from "@/hooks/useStops";
import { useBusSearch, BusRoute } from "@/hooks/useBusSearch";
import { useFavorites } from "@/hooks/useFavorites";
import LanguageToggle from "@/components/LanguageToggle";
import SearchForm from "@/components/SearchForm";
import BusResults from "@/components/BusResults";
import RecentSearches, { RecentSearch } from "@/components/RecentSearches";
import { Heart, User, LogOut, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/routex-logo.jpg";

const Dashboard = () => {
  const { t, lang } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: stops = [] } = useStops();
  const { savedRouteIds, toggleFavorite } = useFavorites();

  const [currentSearch, setCurrentSearch] = useState<{ from: string; to: string } | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    const saved = localStorage.getItem("tn-bus-recent");
    return saved ? JSON.parse(saved) : [];
  });

  const { data: results, isLoading: searchLoading } = useBusSearch(
    currentSearch?.from || "",
    currentSearch?.to || "",
    !!currentSearch
  );

  const handleSearch = useCallback(
    (fromId: string, toId: string) => {
      setCurrentSearch({ from: fromId, to: toId });

      const newRecent: RecentSearch = { fromId, toId, timestamp: Date.now() };
      const updated = [newRecent, ...recentSearches.filter((s) => !(s.fromId === fromId && s.toId === toId))].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("tn-bus-recent", JSON.stringify(updated));
    },
    [recentSearches]
  );

  const handleSaveRoute = useCallback(
    (bus: BusRoute) => {
      toggleFavorite(bus.id);
    },
    [toggleFavorite]
  );

  const getStopName = (id: string) => {
    const stop = stops.find((s) => s.id === id);
    return stop ? (lang === "ta" ? stop.name_ta : stop.name_en) : id;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="RouteX" className="h-7 w-7 rounded-md object-contain" />
            <span className="text-sm font-bold text-foreground">{t.app.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button onClick={() => navigate("/favorites")} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label={t.nav.favorites}>
              <Heart className="h-4 w-4" />
            </button>
            <button onClick={() => navigate("/tickets")} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="My Tickets">
              <Ticket className="h-4 w-4" />
            </button>
            <button onClick={() => navigate("/profile")} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label={t.nav.profile}>
              <User className="h-4 w-4" />
            </button>
            <button onClick={async () => { await logout(); navigate("/"); }} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive" aria-label={t.nav.logout}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-lg py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">
            {lang === "ta" ? "வணக்கம்" : "Hello"}, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>

        <SearchForm onSearch={handleSearch} />

        {!currentSearch && (
          <RecentSearches searches={recentSearches} onSelect={(f, t) => handleSearch(f, t)} />
        )}

        {currentSearch && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setCurrentSearch(null)} className="text-xs font-medium text-primary hover:underline">
                ← {t.common.back}
              </button>
              <span className="text-xs text-muted-foreground">
                {getStopName(currentSearch.from)} → {getStopName(currentSearch.to)}
              </span>
            </div>
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <BusResults buses={results || []} onSaveRoute={handleSaveRoute} savedRouteIds={savedRouteIds} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
