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

  const downloadTicket = () => {
    if (!ticket) return;
    const text = [
      "=== RouteX Digital Ticket ===",
      `Ticket ID: ${ticket.ticketId}`,
      `Passenger: ${ticket.passenger}`,
      `From: ${ticket.fromName}`,
      `To: ${ticket.toName}`,
      `Bus: ${ticket.busNumber} (${ticket.busName})`,
      `Departure: ${formatTime12(ticket.departure)}`,
      `Arrival: ${formatTime12(ticket.arrival)}`,
      `Fare: ₹${ticket.price}`,
      `Issued: ${issuedDate}`,
      `Status: PAID`,
      "",
      "Show this ticket to the conductor if asked.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticket.ticketId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From</p>
                  <p className="truncate text-sm font-semibold text-foreground">{fromName}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">To</p>
                  <p className="truncate text-sm font-semibold text-foreground">{toName}</p>
                </div>
              </div>

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
              <QrCode className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Payment</h2>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center">
              <p className="text-sm font-medium text-foreground">
                Scan the QR code available inside the bus to complete payment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pay ₹{bus.price} using any UPI app
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <PayBadge label="GPay" bg="bg-info/10" fg="text-info" />
                <PayBadge label="PhonePe" bg="bg-accent/30" fg="text-accent-foreground" />
                <PayBadge label="Paytm" bg="bg-primary/10" fg="text-primary" />
              </div>
            </div>

            <Button className="mt-5 w-full" onClick={() => setStep("processing")}>
              I Have Paid
            </Button>
            <button
              onClick={() => setStep("summary")}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
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
          <div className="animate-fade-in">
            <div className="flex flex-col items-center gap-2 bg-success/10 px-5 py-6 text-center">
              <div className="rounded-full bg-success/20 p-2">
                <CheckCircle2 className="h-8 w-8 text-success animate-scale-in" />
              </div>
              <p className="text-base font-bold text-success">Payment Successful</p>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Passenger</p>
                    <p className="text-sm font-semibold text-foreground">{ticket.passenger}</p>
                  </div>
                  <span className="rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold text-success-foreground">
                    PAID ✓
                  </span>
                </div>

                <div className="my-3 h-px bg-border" />

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From</p>
                    <p className="truncate text-sm font-semibold text-foreground">{ticket.fromName}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">To</p>
                    <p className="truncate text-sm font-semibold text-foreground">{ticket.toName}</p>
                  </div>
                </div>

                <div className="my-3 h-px bg-border" />

                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Bus</dt>
                    <dd className="font-medium text-foreground">{ticket.busNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fare</dt>
                    <dd className="font-medium text-foreground">₹{ticket.price}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Departure</dt>
                    <dd className="font-medium text-foreground">{formatTime12(ticket.departure)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Issued</dt>
                    <dd className="font-medium text-foreground">{issuedDate}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Ticket ID</dt>
                    <dd className="font-mono text-sm font-bold text-primary">{ticket.ticketId}</dd>
                  </div>
                </dl>
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Show this ticket to conductor if asked
              </p>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={downloadTicket}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PayBadge: React.FC<{ label: string; bg: string; fg: string }> = ({ label, bg, fg }) => (
  <div className={`flex h-10 w-16 items-center justify-center rounded-lg ${bg}`}>
    <span className={`text-xs font-bold ${fg}`}>{label}</span>
  </div>
);

export default TicketFlow;
export type { SavedTicket };
export { STORAGE_KEY as TICKETS_STORAGE_KEY };