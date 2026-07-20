import React, { useState, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStops } from "@/hooks/useStops";
import { BusRoute } from "@/hooks/useBusSearch";
import { ArrowRight, AlertTriangle, Zap, BadgeIndianRupee, Timer, Ticket } from "lucide-react";
import TicketFlow from "@/components/TicketFlow";

interface BusCardProps {
  bus: BusRoute;
  highlight?: "cheapest" | "fastest" | "next" | null;
  onSaveRoute?: () => void;
  isSaved?: boolean;
}

const BusCard = memo(({ bus, highlight, onSaveRoute, isSaved }: BusCardProps) => {
  const { t, lang } = useLanguage();
  const { data: stops = [] } = useStops();
  const [showTicket, setShowTicket] = useState(false);

  const getStopName = (id: string) => {
    const stop = stops.find((s) => s.id === id);
    if (!stop) return id;
    return lang === "ta" ? stop.name_ta : stop.name_en;
  };

  const formatTime12 = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? `${m}m` : ""}`;
  };

  const highlightLabel = highlight === "cheapest" ? t.results.cheapest : highlight === "fastest" ? t.results.fastest : highlight === "next" ? t.results.nextAvailable : null;
  const highlightColor = highlight === "cheapest" ? "bg-success text-success-foreground" : highlight === "fastest" ? "bg-info text-info-foreground" : highlight === "next" ? "bg-warning text-warning-foreground" : "";

  const busTypeLabel: Record<string, string> = { ordinary: "Ordinary", express: "Express", superDeluxe: "Super Deluxe", ac: "A/C" };

  return (
    <div className="animate-fade-in rounded-xl border border-border bg-card p-4 bus-card-shadow transition-shadow hover:bus-card-shadow-hover text-foreground">
      {highlightLabel && (
        <span className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${highlightColor}`}>
          {highlight === "cheapest" && <BadgeIndianRupee className="h-3 w-3" />}
          {highlight === "fastest" && <Zap className="h-3 w-3" />}
          {highlight === "next" && <Timer className="h-3 w-3" />}
          {highlightLabel}
        </span>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{bus.bus_number}</h3>
          <p className="text-xs text-muted-foreground">{bus.bus_name} · {busTypeLabel[bus.bus_type] || bus.bus_type}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">₹{bus.price}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${bus.route_type === "direct" ? "text-success" : "text-muted-foreground"}`}>
            {bus.route_type === "direct" ? t.results.direct : t.results.stops}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-foreground">{formatTime12(bus.departure)}</span>
          <span className="text-[10px] text-muted-foreground">{getStopName(bus.from_id)}</span>
        </div>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-[10px] text-muted-foreground">{formatDuration(bus.duration_minutes)}</span>
          <div className="relative flex w-full items-center">
            <div className="h-px flex-1 bg-border" />
            <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground" />
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-foreground">{formatTime12(bus.arrival)}</span>
          <span className="text-[10px] text-muted-foreground">{getStopName(bus.to_id)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${bus.status === "onTime" ? "text-success" : "text-destructive"}`}>
          {bus.status === "delayed" && <AlertTriangle className="h-3 w-3" />}
          {bus.status === "onTime" ? t.results.onTime : t.results.delayed}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTicket(true)} className="flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 lg:px-2.5 lg:py-1 text-sm lg:text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 min-h-[44px] lg:min-h-0 min-w-[110px] lg:min-w-0">
            <Ticket className="h-3 w-3 lg:h-3 lg:w-3" />
            Book Ticket
          </button>
          {onSaveRoute && (
            <button onClick={onSaveRoute} className={`text-sm lg:text-xs font-medium transition-colors flex items-center justify-center min-h-[44px] lg:min-h-0 px-2 lg:px-0 ${isSaved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              {isSaved ? "★ " + t.favorites.saved : "☆ " + t.favorites.save}
            </button>
          )}
        </div>
      </div>

      <TicketFlow open={showTicket} onClose={() => setShowTicket(false)} bus={bus} />
    </div>
  );
});

export default BusCard;
