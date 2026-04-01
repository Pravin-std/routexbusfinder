import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusRoute } from "@/hooks/useBusSearch";
import BusCard from "@/components/BusCard";
import { SlidersHorizontal } from "lucide-react";

interface BusResultsProps {
  buses: BusRoute[];
  onSaveRoute?: (bus: BusRoute) => void;
  savedRouteIds?: Set<string>;
}

type SortOption = "price" | "departure" | "duration";

const BusResults = ({ buses, onSaveRoute, savedRouteIds = new Set() }: BusResultsProps) => {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>("departure");
  const [directOnly, setDirectOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...buses];
    if (directOnly) result = result.filter((b) => b.route_type === "direct");
    return result;
  }, [buses, directOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "price": return arr.sort((a, b) => a.price - b.price);
      case "duration": return arr.sort((a, b) => a.duration_minutes - b.duration_minutes);
      default: return arr.sort((a, b) => a.departure.localeCompare(b.departure));
    }
  }, [filtered, sortBy]);

  const cheapestId = useMemo(() => sorted.length ? sorted.reduce((min, b) => (b.price < min.price ? b : min), sorted[0]).id : null, [sorted]);
  const fastestId = useMemo(() => sorted.length ? sorted.reduce((min, b) => (b.duration_minutes < min.duration_minutes ? b : min), sorted[0]).id : null, [sorted]);
  const nextBusId = useMemo(() => {
    if (!sorted.length) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const upcoming = sorted.filter((b) => { const [h, m] = b.departure.split(":").map(Number); return h * 60 + m >= nowMins; });
    return upcoming.length ? upcoming[0].id : null;
  }, [sorted]);

  const getHighlight = (id: string) => {
    if (id === cheapestId) return "cheapest" as const;
    if (id === fastestId) return "fastest" as const;
    if (id === nextBusId) return "next" as const;
    return null;
  };

  if (buses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold text-foreground">{t.results.noBuses}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t.results.tryAnother}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {t.results.title} <span className="text-sm font-normal text-muted-foreground">({sorted.length})</span>
        </h2>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-secondary">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t.results.filterBy}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 animate-fade-in rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t.results.sortBy}:</span>
              {(["departure", "price", "duration"] as SortOption[]).map((opt) => (
                <button key={opt} onClick={() => setSortBy(opt)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sortBy === opt ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                  {t.results[`sort${opt.charAt(0).toUpperCase() + opt.slice(1)}` as keyof typeof t.results] as string}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-card-foreground">
              <input type="checkbox" checked={directOnly} onChange={(e) => setDirectOnly(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              {t.results.directOnly}
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((bus) => (
          <BusCard key={bus.id} bus={bus} highlight={getHighlight(bus.id)} onSaveRoute={onSaveRoute ? () => onSaveRoute(bus) : undefined} isSaved={savedRouteIds.has(bus.id)} />
        ))}
      </div>
    </div>
  );
};

export default BusResults;
