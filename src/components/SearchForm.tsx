import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { stops, BusStop } from "@/data/stops";
import { ArrowDownUp, Search } from "lucide-react";
import Fuse from "fuse.js";

interface SearchFormProps {
  onSearch: (fromId: string, toId: string) => void;
}

const SearchForm = ({ onSearch }: SearchFormProps) => {
  const { t, lang } = useLanguage();
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [error, setError] = useState("");
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Fuse.js for fuzzy matching
  const fuse = useMemo(
    () =>
      new Fuse(stops, {
        keys: ["nameEn", "nameTa"],
        threshold: 0.4,
        distance: 100,
      }),
    []
  );

  const getStopName = (stop: BusStop) => (lang === "ta" ? stop.nameTa : stop.nameEn);

  const filterStops = (query: string): BusStop[] => {
    if (!query.trim()) return stops.slice(0, 8);
    return fuse.search(query).map((r) => r.item).slice(0, 8);
  };

  const fromSuggestions = filterStops(fromQuery);
  const toSuggestions = filterStops(toQuery);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFromSuggestions(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setShowToSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectFrom = (stop: BusStop) => {
    setFromId(stop.id);
    setFromQuery(getStopName(stop));
    setShowFromSuggestions(false);
    setError("");
  };

  const selectTo = (stop: BusStop) => {
    setToId(stop.id);
    setToQuery(getStopName(stop));
    setShowToSuggestions(false);
    setError("");
  };

  const handleSwap = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
    setFromId(toId);
    setToId(fromId);
  };

  const handleSearch = () => {
    if (!fromId || !toId) {
      setError(t.errors.selectBoth);
      return;
    }
    if (fromId === toId) {
      setError(t.errors.sameStops);
      return;
    }
    setError("");
    onSearch(fromId, toId);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 bus-card-shadow">
      <div className="flex flex-col gap-3">
        {/* From input */}
        <div ref={fromRef} className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t.search.from}</label>
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setFromId("");
                setShowFromSuggestions(true);
              }}
              onFocus={() => setShowFromSuggestions(true)}
              placeholder={t.search.fromPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {fromSuggestions.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => selectFrom(stop)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-secondary"
                >
                  <span className="font-medium">{getStopName(stop)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="rounded-full border border-border bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-muted"
            aria-label={t.search.swap}
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        {/* To input */}
        <div ref={toRef} className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t.search.to}</label>
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setToId("");
                setShowToSuggestions(true);
              }}
              onFocus={() => setShowToSuggestions(true)}
              placeholder={t.search.toPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {toSuggestions.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => selectTo(stop)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-secondary"
                >
                  <span className="font-medium">{getStopName(stop)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-center text-xs text-destructive">{error}</p>}

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="mt-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {t.search.find}
        </button>
      </div>
    </div>
  );
};

export default SearchForm;
