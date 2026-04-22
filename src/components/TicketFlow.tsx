import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStops } from "@/hooks/useStops";
import { BusRoute } from "@/hooks/useBusSearch";
import { ArrowRight, Bus, CheckCircle2, Loader2, Pencil, Ticket } from "lucide-react";
import logo from "@/assets/routex-logo.jpg";

// TODO: replace with the merchant's real UPI VPA + display name
const UPI_VPA = "routex@upi";
const UPI_PAYEE_NAME = "RouteX";

interface TicketFlowProps {
  open: boolean;
  onClose: () => void;
  bus: BusRoute;
}

type Step = "summary" | "payment" | "processing" | "ticket";

interface SavedTicket {
  ticketId: string;
  passenger: string;
  fromName: string;
  toName: string;
  busNumber: string;
  busName: string;
  departure: string;
  arrival: string;
  price: number;
  issuedAt: string;
}

const STORAGE_KEY = "routex-tickets";

const formatTime12 = (time24: string) => {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
};

const generateTicketId = () => {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `RX-${time}${rand}`;
};

const TicketFlow: React.FC<TicketFlowProps> = ({ open, onClose, bus }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { data: stops = [] } = useStops();
  const [step, setStep] = useState<Step>("summary");
  const [ticket, setTicket] = useState<SavedTicket | null>(null);

  const getStopName = (id: string) => {
    const s = stops.find((x) => x.id === id);
    if (!s) return id;
    return lang === "ta" ? s.name_ta : s.name_en;
  };

  const fromName = getStopName(bus.from_id);
  const toName = getStopName(bus.to_id);
  const passengerName = user?.name || "Guest";

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setStep("summary");
      setTicket(null);
    }
  }, [open, bus.id]);

  // Simulate payment processing
  useEffect(() => {
    if (step !== "processing") return;
    const timer = setTimeout(() => {
      const t: SavedTicket = {
        ticketId: generateTicketId(),
        passenger: passengerName,
        fromName,
        toName,
        busNumber: bus.bus_number,
        busName: bus.bus_name,
        departure: bus.departure,
        arrival: bus.arrival,
        price: bus.price,
        issuedAt: new Date().toISOString(),
      };
      setTicket(t);
      // Save to local "My Tickets"
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list: SavedTicket[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify([t, ...list].slice(0, 50)));
      } catch {
        /* ignore */
      }
      setStep("ticket");
    }, 1400);
    return () => clearTimeout(timer);
  }, [step, bus, fromName, toName, passengerName]);

  const issuedDate = useMemo(() => {
    if (!ticket) return "";
    const d = new Date(ticket.issuedAt);
    return d.toLocaleString(lang === "ta" ? "ta-IN" : "en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [ticket, lang]);

  // After launching a UPI app, when the user returns to this tab,
  // automatically move to processing → ticket.
  const launchedRef = useRef(false);
  useEffect(() => {
    if (step !== "payment") {
      launchedRef.current = false;
      return;
    }
    const onVisible = () => {
      if (document.visibilityState === "visible" && launchedRef.current) {
        launchedRef.current = false;
        setStep("processing");
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [step]);

  const openUpi = () => {
    launchedRef.current = true;
    const params = new URLSearchParams({
      pa: UPI_VPA,
      pn: UPI_PAYEE_NAME,
      am: String(bus.price),
      cu: "INR",
      tn: `RouteX ${bus.bus_number} ${fromName}->${toName}`,
    });
    window.location.href = `upi://pay?${params.toString()}`;
  };

  const handleEditTrip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {step === "summary" && (
          <div className="animate-fade-in p-5">
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Trip Summary</h2>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <button
                type="button"
                onClick={handleEditTrip}
                className="group flex w-full items-center justify-between gap-3 rounded-lg p-1 text-left transition-colors hover:bg-secondary/60"
                aria-label="Edit From and To"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From</p>
                  <p className="truncate text-sm font-semibold text-foreground">{fromName}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">To</p>
                  <p className="truncate text-sm font-semibold text-foreground">{toName}</p>
                </div>
                <Pencil className="ml-1 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>

              <div className="my-3 h-px bg-border" />

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Bus Number</dt>
                  <dd className="font-medium text-foreground">{bus.bus_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Departure</dt>
                  <dd className="font-medium text-foreground">{formatTime12(bus.departure)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ticket Price</dt>
                  <dd className="text-base font-bold text-primary">₹{bus.price}</dd>
                </div>
              </dl>
            </div>

            <Button className="mt-5 w-full" onClick={() => setStep("payment")}>
              Proceed to Pay
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="animate-fade-in p-5">
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Pay ₹{bus.price}</h2>
            </div>

            <p className="mb-3 text-center text-xs text-muted-foreground">
              Choose a UPI app to complete payment
            </p>

            <div className="grid grid-cols-3 gap-2">
              <PayButton label="GPay" bg="bg-info/10" fg="text-info" onClick={openUpi} />
              <PayButton label="PhonePe" bg="bg-accent/30" fg="text-accent-foreground" onClick={openUpi} />
              <PayButton label="Paytm" bg="bg-primary/10" fg="text-primary" onClick={openUpi} />
            </div>

            <button
              onClick={() => setStep("summary")}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Verifying payment...</p>
          </div>
        )}

        {step === "ticket" && ticket && (
          <div className="animate-fade-in p-5">
            <div className="mb-3 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
              <p className="text-sm font-bold text-success">Payment Successful</p>
            </div>

            <HorizontalTicketStub
              ticket={ticket}
              issuedDate={issuedDate}
            />

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Show this ticket to conductor if asked
            </p>

            <Button className="mt-4 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PayButton: React.FC<{
  label: string;
  bg: string;
  fg: string;
  onClick: () => void;
}> = ({ label, bg, fg, onClick }) => (
  <button
    onClick={onClick}
    className={`flex h-14 items-center justify-center rounded-xl ${bg} font-bold ${fg} transition-transform active:scale-95`}
  >
    {label}
  </button>
);

const HorizontalTicketStub: React.FC<{
  ticket: SavedTicket;
  issuedDate: string;
}> = ({ ticket, issuedDate }) => {
  // Yellow paper-stub style ticket inspired by classic cinema/bus tickets.
  const stubId = ticket.ticketId.replace(/[^A-Z0-9]/g, "").slice(-6);
  return (
    <div
      className="relative mx-auto flex w-full max-w-md overflow-hidden rounded-lg bg-[hsl(45_85%_60%)] text-[hsl(0_70%_35%)] shadow-lg ring-1 ring-[hsl(0_70%_35%/0.4)]"
      style={{
        backgroundImage:
          "radial-gradient(hsl(45 60% 50% / 0.25) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
      }}
    >
      {/* left stub */}
      <div className="flex w-14 items-center justify-center border-r-2 border-dashed border-[hsl(0_70%_35%/0.6)]">
        <span
          className="font-mono text-lg font-extrabold tracking-widest"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {stubId}
        </span>
      </div>

      {/* center */}
      <div className="flex-1 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <img
            src={logo}
            alt="RouteX"
            className="h-9 w-9 rounded-md object-contain ring-1 ring-[hsl(0_70%_35%/0.4)]"
          />
          <div className="flex items-center gap-1 rounded-full bg-[hsl(0_70%_35%)] px-2 py-0.5 text-[10px] font-bold text-[hsl(45_85%_92%)]">
            <Bus className="h-3 w-3" />
            {ticket.busNumber}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">From</p>
            <p className="truncate text-sm font-extrabold leading-tight">{ticket.fromName}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">To</p>
            <p className="truncate text-sm font-extrabold leading-tight">{ticket.toName}</p>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-dashed border-[hsl(0_70%_35%/0.5)] pt-2 text-[10px] font-semibold">
          <div>
            <p className="opacity-70">Departure</p>
            <p className="text-xs font-bold">
              {(() => {
                const [h, m] = ticket.departure.split(":").map(Number);
                const period = h >= 12 ? "PM" : "AM";
                const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
              })()}
            </p>
          </div>
          <div className="text-center">
            <p className="opacity-70">Issued</p>
            <p className="text-[10px] font-bold">{issuedDate}</p>
          </div>
          <div className="text-right">
            <p className="opacity-70">Fare</p>
            <p className="text-base font-extrabold">₹{ticket.price}</p>
          </div>
        </div>
      </div>

      {/* right stub */}
      <div className="flex w-14 items-center justify-center border-l-2 border-dashed border-[hsl(0_70%_35%/0.6)]">
        <span
          className="font-mono text-lg font-extrabold tracking-widest"
          style={{ writingMode: "vertical-rl" }}
        >
          {stubId}
        </span>
      </div>

      {/* perforation notches */}
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
      <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
    </div>
  );
};

export default TicketFlow;
export type { SavedTicket };
export { STORAGE_KEY as TICKETS_STORAGE_KEY };