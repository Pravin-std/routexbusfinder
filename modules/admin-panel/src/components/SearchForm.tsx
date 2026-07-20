import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStops, BusStop } from "@/hooks/useStops";
import { ArrowDownUp, Search } from "lucide-react";
import Fuse from "fuse.js";

interface SearchFormProps {
  onSearch: (fromId: string, toId: string) => void;
}

const SearchForm = ({ onSearch }: SearchFormProps) => {
  const { t, lang } = useLanguage();
  const { data: stops = [] } = useStops();
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [error, setError] = useState("");
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () => new Fuse(stops, { keys: ["name_en", "name_ta"], threshold: 0.4, distance: 100 }),
    [stops]
  );

  const getStopName = (stop: BusStop) => (lang === "ta" ? stop.name_ta : stop.name_en);

  const filterStops = (query: string): BusStop[] => {
    if (!query.trim()) return stops.slice(0, 8);
    return fuse.search(query).map((r) => r.item).slice(0, 8);
  };

  const fromSuggestions = filterStops(fromQuery);
  const toSuggestions = filterStops(toQuery);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFromSuggestions(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setShowToSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectFrom = (stop: BusStop) => { setFromId(stop.id); setFromQuery(getStopName(stop)); setShowFromSuggestions(false); setError(""); };
  const selectTo = (stop: BusStop) => { setToId(stop.id); setToQuery(getStopName(stop)); setShowToSuggestions(false); setError(""); };

  const handleSwap = () => { setFromQuery(toQuery); setToQuery(fromQuery); setFromId(toId); setToId(fromId); };

  const handleSearch = () => {
    if (!fromId || !toId) { setError(t.errors.selectBoth); return; }
    if (fromId === toId) { setError(t.errors.sameStops); return; }
    setError("");
    onSearch(fromId, toId);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 bus-card-shadow text-foreground">
      <div className="flex flex-col gap-3">
        <div ref={fromRef} className="relative">
          <label className="mb-1 block text-xs font-medium !text-white lg:!text-muted-foreground">{t.search.from}</label>
          <div className="flex items-center gap-2 rounded-lg border bg-background border-input px-3 py-2.5 min-h-[48px] lg:min-h-0">
            <Search className="h-4 w-4 text-white/70 lg:text-muted-foreground" />
            <input type="text" value={fromQuery} onChange={(e) => { setFromQuery(e.target.value); setFromId(""); setShowFromSuggestions(true); }} onFocus={() => setShowFromSuggestions(true)} placeholder={t.search.fromPlaceholder} className="w-full bg-transparent text-sm !text-white lg:!text-foreground outline-none placeholder:text-white/60 lg:placeholder:text-muted-foreground" />
          </div>
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {fromSuggestions.map((stop) => (
                <button key={stop.id} onClick={() => selectFrom(stop)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-secondary">
                  <span className="font-medium">{getStopName(stop)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button onClick={handleSwap} className="flex items-center justify-center min-h-[44px] min-w-[44px] lg:min-h-[auto] lg:min-w-[auto] rounded-full border border-white/20 lg:border-border bg-black/20 lg:bg-secondary p-2 text-white lg:text-secondary-foreground transition-colors hover:bg-black/30 lg:hover:bg-muted" aria-label={t.search.swap}>
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        <div ref={toRef} className="relative">
          <label className="mb-1 block text-xs font-medium !text-white lg:!text-muted-foreground">{t.search.to}</label>
          <div className="flex items-center gap-2 rounded-lg border bg-background border-input px-3 py-2.5 min-h-[48px] lg:min-h-0">
            <Search className="h-4 w-4 text-white/70 lg:text-muted-foreground" />
            <input type="text" value={toQuery} onChange={(e) => { setToQuery(e.target.value); setToId(""); setShowToSuggestions(true); }} onFocus={() => setShowToSuggestions(true)} placeholder={t.search.toPlaceholder} className="w-full bg-transparent text-sm !text-white lg:!text-foreground outline-none placeholder:text-white/60 lg:placeholder:text-muted-foreground" />
          </div>
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {toSuggestions.map((stop) => (
                <button key={stop.id} onClick={() => selectTo(stop)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-secondary">
                  <span className="font-medium">{getStopName(stop)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-center text-xs text-destructive">{error}</p>}

        <button onClick={handleSearch} className="mt-1 rounded-lg bg-primary px-4 py-3 min-h-[48px] text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90">
          {t.search.find}
        </button>
      </div>
    </div>
  );
};

export default SearchForm;
