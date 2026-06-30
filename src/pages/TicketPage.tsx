import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RainbowTicket } from "@/components/RainbowTicket";
import type { SavedTicket } from "@/components/TicketFlow";
import { TICKETS_STORAGE_KEY } from "@/components/TicketFlow";
import { Button } from "@/components/ui/button";

const TicketPage = () => {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SavedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketCode) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from Supabase first
        const { data, error: dbError } = await supabase
          .from("tickets")
          .select("*")
          .eq("ticket_code", ticketCode)
          .maybeSingle();

        if (data) {
          const fetchedTicket: SavedTicket = {
            ticketId: data.ticket_code,
            passenger: data.passenger_name,
            fromName: data.from_name,
            toName: data.to_name,
            busNumber: data.bus_number,
            busName: data.bus_name,
            departure: data.departure,
            arrival: data.arrival,
            price: data.price,
            issuedAt: data.issued_at,
          };
          setTicket(fetchedTicket);
          return;
        }

        if (dbError && dbError.code !== 'PGRST116') {
           console.error("Supabase fetch error:", dbError);
        }

        // Fallback to localStorage (for unauthenticated users who just bought a ticket)
        const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
        if (raw) {
          const list: SavedTicket[] = JSON.parse(raw);
          const found = list.find((t) => t.ticketId === ticketCode);
          if (found) {
            setTicket(found);
            return;
          }
        }

        // If not found in either
        setError("Ticket not found.");
      } catch (err: any) {
        console.error("Error fetching ticket:", err);
        setError("Failed to load ticket data.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketCode]);

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      {/* Top App Bar */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Your Ticket</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md p-4 pt-6">
        {loading ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4 animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading ticket details...</p>
          </div>
        ) : error || !ticket ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="rounded-full bg-destructive/10 p-4">
              <span className="text-3xl">🎫</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Ticket Not Found</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {error || "We couldn't find the ticket you're looking for."}
              </p>
            </div>
            <Button asChild className="mt-4">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Have a safe journey!</h2>
              <p className="text-xs text-muted-foreground mt-1">Please show this digital ticket to the conductor</p>
            </div>

            <RainbowTicket
              ticket={ticket}
              issuedDate={new Date(ticket.issuedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              busName={ticket.busName}
            />

            <div className="flex flex-col gap-3 pt-6">
              <Button asChild variant="default" className="w-full">
                <Link to="/">Book Another Ticket</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-card">
                <Link to="/tickets">View All Tickets</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TicketPage;
