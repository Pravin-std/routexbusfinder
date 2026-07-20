import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStops } from "@/hooks/useStops";
import { Clock } from "lucide-react";

interface RecentSearch {
  fromId: string;
  toId: string;
  timestamp: number;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (fromId: string, toId: string) => void;
}

const RecentSearches = ({ searches, onSelect }: RecentSearchesProps) => {
  const { t, lang } = useLanguage();
  const { data: stops = [] } = useStops();

  const getStopName = (id: string) => {
    const stop = stops.find((s) => s.id === id);
    if (!stop) return id;
    return lang === "ta" ? stop.name_ta : stop.name_en;
  };

  if (searches.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {t.search.recentSearches}
      </h3>
      <div className="flex flex-wrap gap-2">
        {searches.map((s, i) => (
          <button key={i} onClick={() => onSelect(s.fromId, s.toId)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-secondary">
            {getStopName(s.fromId)} → {getStopName(s.toId)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
export type { RecentSearch };
