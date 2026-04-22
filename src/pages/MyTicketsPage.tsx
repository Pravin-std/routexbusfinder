import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Ticket as TicketIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TICKETS_STORAGE_KEY, type SavedTicket } from "@/components/TicketFlow";
import LanguageToggle from "@/components/LanguageToggle";
import logo from "@/assets/routex-logo.jpg";

const formatTime12 = (time24: string) => {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [tickets, setTickets] = useState<SavedTicket[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
      setTickets(raw ? JSON.parse(raw) : []);
    } catch {
      setTickets([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-md p-1 text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            <img src={logo} alt="RouteX" className="h-6 w-6 rounded-md object-contain" />
            <span className="text-sm font-bold">My Tickets</span>
          </button>
          <LanguageToggle />
        </div>
      </header>

      <main className="container max-w-lg py-6">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TicketIcon className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">No tickets yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Book a bus to see your tickets here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => {
              const issued = new Date(ticket.issuedAt).toLocaleString(
                lang === "ta" ? "ta-IN" : "en-IN",
                { dateStyle: "medium", timeStyle: "short" }
              );
              return (
                <div
                  key={ticket.ticketId}
                  className="animate-fade-in rounded-xl border border-border bg-card p-4 bus-card-shadow"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-bold text-primary">{ticket.ticketId}</p>
                    <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success-foreground">
                      PAID ✓
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{ticket.fromName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-sm font-semibold text-foreground">{ticket.toName}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {ticket.busNumber} · {formatTime12(ticket.departure)}
                    </span>
                    <span className="font-semibold text-foreground">₹{ticket.price}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{issued}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTicketsPage;