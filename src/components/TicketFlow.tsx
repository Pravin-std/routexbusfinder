import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStops } from "@/hooks/useStops";
import { BusRoute } from "@/hooks/useBusSearch";
import { ArrowRight, Bus, CheckCircle2, Copy, Loader2, Pencil, Ticket, X } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/routex-logo.jpg";

// Razorpay Checkout Integration

interface TicketFlowProps {
  open: boolean;
  onClose: () => void;
  bus: BusRoute;
}

type Step = "summary" | "payment" | "processing";

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
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RX-${yyyy}${mm}${dd}-${rand}`;
};

const TicketFlow: React.FC<TicketFlowProps> = ({ open, onClose, bus }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { data: stops = [] } = useStops();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("summary");
  const [ticket, setTicket] = useState<SavedTicket | null>(null);
  const [editing, setEditing] = useState(false);

  const getStopName = (id: string) => {
    const s = stops.find((x) => x.id === id);
    if (!s) return id;
    return lang === "ta" ? s.name_ta : s.name_en;
  };

  // Full ordered list of stops along this bus's route
  const routeStopIds = useMemo(
    () => [bus.from_id, ...(bus.intermediate_stops || []), bus.to_id],
    [bus.from_id, bus.intermediate_stops, bus.to_id]
  );

  // User-selected boarding / alighting points (default = full route)
  const [fromId, setFromId] = useState<string>(bus.from_id);
  const [toId, setToId] = useState<string>(bus.to_id);

  const fromName = getStopName(fromId);
  const toName = getStopName(toId);
  const passengerName = user?.name || "Guest";

  // Compute fare proportional to the segment of the route the passenger uses.
  // Min fare ₹10, rounded up to nearest ₹5.
  const totalSegments = Math.max(1, routeStopIds.length - 1);
  const fromIdx = Math.max(0, routeStopIds.indexOf(fromId));
  const toIdx = Math.max(fromIdx + 1, routeStopIds.indexOf(toId));
  const usedSegments = Math.max(1, toIdx - fromIdx);
  const segmentPrice = Math.max(
    10,
    Math.ceil((bus.price * usedSegments) / totalSegments / 5) * 5
  );

  // Estimate departure time at the chosen boarding stop, linearly along the route.
  const estimatedDeparture = useMemo(() => {
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const toHHMM = (mins: number) => {
      const m = ((mins % 1440) + 1440) % 1440;
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };
    const dep = toMin(bus.departure);
    const arr = toMin(bus.arrival);
    const total = arr >= dep ? arr - dep : arr + 1440 - dep;
    const offset = Math.round((total * fromIdx) / totalSegments);
    return toHHMM(dep + offset);
  }, [bus.departure, bus.arrival, fromIdx, totalSegments]);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setStep("summary");
      setTicket(null);
      setEditing(false);
      setFromId(bus.from_id);
      setToId(bus.to_id);
    }
  }, [open, bus.id, bus.from_id, bus.to_id]);

  // Load Razorpay Script
  useEffect(() => {
    const loadRazorpay = async () => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  const handleRazorpayPayment = async () => {
    setStep("processing");

    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-order", {
        body: { amount: segmentPrice * 100, currency: "INR" },
      });

      if (orderError || !orderData || orderData.success === false) {
        throw new Error(orderError?.message || orderData?.error || "Failed to create order");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T3XUzXPBSj8GPV",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "RouteX",
        description: `Ticket: ${fromName} to ${toName}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyError || !verifyData?.success) {
              throw new Error("Payment verification failed");
            }

            await handlePaymentSuccess(response.razorpay_payment_id);
          } catch (err: any) {
            toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
            setStep("summary");
          }
        },
        prefill: {
          name: passengerName,
        },
        theme: {
          color: "#F97316", // RouteX Orange
        },
        modal: {
          ondismiss: function () {
            toast({ title: "Payment Cancelled", description: "You cancelled the payment." });
            setStep("summary");
          },
        },
      };

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error("Razorpay SDK failed to load. Please check your network.");
      }

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
        setStep("summary");
      });
      rzp.open();

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("summary");
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    const t = {
      ticketId: generateTicketId(),
      passenger: passengerName,
      fromName,
      toName,
      busNumber: bus.bus_number,
      busName: bus.bus_name,
      departure: estimatedDeparture,
      arrival: bus.arrival,
      price: segmentPrice,
      issuedAt: new Date().toISOString(),
      paymentId,
      bus_route_id: bus.id,
      from_id: fromId,
      to_id: toId,
    };
    
    onClose();
    navigate(`/payment-success`, { state: { pendingTicket: t } });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent 
        className="w-[min(95vw,420px)] max-w-[420px] overflow-hidden overflow-x-hidden p-0 gap-0 box-border mx-auto sm:w-full"
      >
        {step === "summary" && (
          <div className="animate-fade-in p-5">
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Trip Summary</h2>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg p-1 text-left transition-colors hover:bg-secondary/60"
                  aria-label="Edit boarding and drop point"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From</p>
                    <p className="break-words text-sm font-semibold text-foreground">{fromName}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">To</p>
                    <p className="break-words text-sm font-semibold text-foreground">{toName}</p>
                  </div>
                  <Pencil className="ml-1 h-3.5 w-3.5 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Choose your stops</p>
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary"
                      aria-label="Close edit"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                      Boarding (From)
                    </label>
                    <select
                      value={fromId}
                      onChange={(e) => {
                        const newFrom = e.target.value;
                        setFromId(newFrom);
                        const newFromIdx = routeStopIds.indexOf(newFrom);
                        const curToIdx = routeStopIds.indexOf(toId);
                        if (curToIdx <= newFromIdx) {
                          setToId(routeStopIds[newFromIdx + 1] || bus.to_id);
                        }
                      }}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground"
                    >
                      {routeStopIds.slice(0, -1).map((id) => (
                        <option key={id} value={id}>
                          {getStopName(id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                      Drop (To)
                    </label>
                    <select
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground"
                    >
                      {routeStopIds
                        .slice(routeStopIds.indexOf(fromId) + 1)
                        .map((id) => (
                          <option key={id} value={id}>
                            {getStopName(id)}
                          </option>
                        ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full min-h-[50px]"
                    onClick={() => setEditing(false)}
                  >
                    Apply
                  </Button>
                </div>
              )}

              <div className="my-3 h-px bg-border" />

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Bus Number</dt>
                  <dd className="font-medium text-foreground">{bus.bus_number}</dd>
                </div>
                <div className="flex justify-between">                  <dt className="text-muted-foreground">Departure</dt>
                  <dd className="font-medium text-foreground">{formatTime12(estimatedDeparture)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ticket Price</dt>
                  <dd className="text-base font-bold text-primary">₹{segmentPrice}</dd>
                </div>
                {segmentPrice < bus.price && (
                  <p className="pt-1 text-[10px] text-muted-foreground">
                    Fare adjusted for selected segment (full route ₹{bus.price})
                  </p>
                )}
              </dl>
            </div>

            <Button className="mt-5 w-full min-h-[50px]" onClick={handleRazorpayPayment}>
              Proceed to Pay
            </Button>
          </div>
        )}



        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Verifying payment...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketFlow;
export type { SavedTicket };
export { STORAGE_KEY as TICKETS_STORAGE_KEY };