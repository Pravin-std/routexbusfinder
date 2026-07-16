import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Ticket, Calendar, Clock, Bus, MapPin, 
  CreditCard, ArrowRight, Loader2, Sparkles, AlertCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/routex-logo.jpg";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface ScannedTicket {
  id: string;
  user_id: string | null;
  ticket_id: string | null;
  ticket_photo_url: string;
  ocr_text: string | null;
  bus_name: string | null;
  bus_number: string | null;
  from_stop: string | null;
  to_stop: string | null;
  fare: number | null;
  travel_date: string | null;
  travel_time: string | null;
  ticket_number: string | null;
  created_at: string;
}

export const SecureImage = ({ path, alt, className }: { path: string; alt?: string; className?: string }) => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) return;
    if (path.startsWith("http")) {
      setUrl(path);
      setLoading(false);
      return;
    }

    const loadSignedUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from("ticket-scans")
          .createSignedUrl(path, 3600);
        if (error) throw error;
        if (data?.signedUrl) {
          setUrl(data.signedUrl);
        }
      } catch (err) {
        console.error("Failed to load signed URL:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSignedUrl();
  }, [path]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} />;
};

export default function MyScannedTicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scans, setScans] = useState<ScannedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected ticket for modal detail view
  const [selectedTicket, setSelectedTicket] = useState<ScannedTicket | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("ticket_scans")
        .select("*")
        .order("created_at", { ascending: false });

      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else {
        // Fallback for unauthenticated devs / guest users
        query = query.is("user_id", null);
      }

      const { data, error: dbError } = await query;
      
      if (dbError) {
        console.error("Failed to fetch from ticket_scans, trying hyphenated table:", dbError);
        // Try fallback table name if any schema error occurred
        let fallbackQuery = supabase
          .from("ticket-scans" as any)
          .select("*")
          .order("created_at", { ascending: false });

        if (user?.id) {
          fallbackQuery = fallbackQuery.eq("user_id", user.id);
        } else {
          fallbackQuery = fallbackQuery.is("user_id", null);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) {
          throw fallbackError;
        }
        setScans(fallbackData || []);
      } else {
        setScans(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching scanned tickets:", err);
      setError("Failed to load scanned tickets. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md px-4">
        <div className="container max-w-lg flex h-14 items-center justify-between py-3 px-0">
          <button
            onClick={() => navigate("/tickets")}
            className="flex items-center gap-2 rounded-md p-1 text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <img src={logo} alt="RouteX" className="h-6 w-6 rounded-md object-contain" />
            <span className="text-sm font-bold">My Scanned Tickets</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="container max-w-lg pt-6 px-4">
        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-secondary/50 p-1 rounded-xl">
          <button 
            className="py-2 text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-all"
            onClick={() => navigate("/tickets")}
          >
            Booked Tickets
          </button>
          <button 
            className="py-2 text-xs font-bold rounded-lg bg-card text-foreground shadow-sm"
            disabled
          >
            Scanned Tickets
          </button>
        </div>

        {loading ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-muted-foreground">Loading scanned tickets...</p>
          </div>
        ) : error ? (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">An error occurred</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchScans} variant="outline" className="rounded-xl">
              Retry
            </Button>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-5">
            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 p-5 text-indigo-500 animate-pulse">
              <Ticket className="h-12 w-12 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">No scanned tickets yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
                Capture your physical tickets on the ticket confirmation screen to save a digital copy here.
              </p>
            </div>
            <Button 
              onClick={() => navigate("/")} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md px-6 font-semibold"
            >
              Go to Booking
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {scans.map((scan) => {
              const formattedDate = scan.travel_date 
                ? new Date(scan.travel_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                : "N/A";
                
              return (
                <Card 
                  key={scan.id} 
                  className="overflow-hidden border border-border/80 bg-card hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col"
                >
                  <div className="flex h-36 relative overflow-hidden bg-muted/20">
                    <SecureImage 
                      path={scan.ticket_photo_url} 
                      alt={scan.bus_name || "Scanned Ticket"} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-3">
                      <div className="self-end">
                        <span className="bg-indigo-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          OCR Scanned
                        </span>
                      </div>
                      <div className="text-white">
                        <h4 className="font-bold text-sm truncate">{scan.bus_name || "Unknown Operator"}</h4>
                        <p className="text-[10px] text-white/70">
                          {scan.bus_number && `Bus No: ${scan.bus_number}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">From</p>
                        <p className="text-xs font-bold text-foreground truncate">{scan.from_stop}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">To</p>
                        <p className="text-xs font-bold text-foreground truncate">{scan.to_stop}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-border">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {scan.fare ? `₹${scan.fare}` : "N/A"}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setSelectedTicket(scan)}
                      className="w-full mt-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/30 font-bold rounded-xl py-2 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      View Digital Ticket
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md w-[95%] p-0 overflow-hidden border border-border/80 bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-500" />
              Scanned Digital Ticket
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex flex-col p-4 max-h-[80vh] overflow-y-auto space-y-4">
              {/* Photo section */}
              <div className="rounded-xl overflow-hidden border border-border/80 bg-secondary/10 relative aspect-[2/1]">
                <SecureImage 
                  path={selectedTicket.ticket_photo_url} 
                  alt="Original Ticket Scan" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <span className="text-[10px] font-semibold text-white/95">Original Photo</span>
                </div>
              </div>

              {/* Digital ticket representation */}
              <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-xl overflow-hidden bus-card-shadow">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Bus badge */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide">
                    <Bus className="h-3.5 w-3.5" />
                    {selectedTicket.bus_number || "N/A"}
                  </span>
                  <span className="text-[10px] font-semibold text-white/60">
                    ID: {selectedTicket.id?.slice(-8) || "SCANNED"}
                  </span>
                </div>

                {/* From / To stops */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">From</p>
                    <p className="text-base font-extrabold truncate">{selectedTicket.from_stop}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/50" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">To</p>
                    <p className="text-base font-extrabold truncate">{selectedTicket.to_stop}</p>
                  </div>
                </div>

                {/* Date / Time / Fare */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-xs">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </p>
                    <p className="font-bold mt-0.5">
                      {selectedTicket.travel_date 
                        ? new Date(selectedTicket.travel_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" /> Time
                    </p>
                    <p className="font-bold mt-0.5">{selectedTicket.travel_time || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 flex items-center justify-end gap-1">
                      <CreditCard className="h-3 w-3" /> Fare
                    </p>
                    <p className="font-extrabold text-sm text-yellow-300 mt-0.5">
                      ₹{selectedTicket.fare || "0"}
                    </p>
                  </div>
                </div>

                {/* Additional OCR Scanned details */}
                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] text-white/80">
                  <div>
                    <span className="font-semibold text-white/50">Tkt No: </span>
                    {selectedTicket.ticket_number || "N/A"}
                  </div>
                  <div className="col-span-2 text-white/40 text-[9px] mt-1 italic">
                    Scanned at: {new Date(selectedTicket.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>

                <Ticket className="absolute right-2 bottom-2 h-16 w-16 text-white/5 -rotate-12 pointer-events-none" />
              </div>

              {/* Operator details block */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator:</span>
                  <span className="font-bold text-foreground">{selectedTicket.bus_name || "Unknown Operator"}</span>
                </div>
              </div>

              {/* OCR raw text accordion look-alike for transparency */}
              <details className="rounded-xl border border-border/80 bg-muted/10 p-3 text-xs cursor-pointer group">
                <summary className="font-bold text-muted-foreground select-none flex justify-between items-center">
                  <span>Raw OCR Text Data</span>
                  <span className="text-[10px] text-muted-foreground group-open:hidden">Show</span>
                  <span className="text-[10px] text-muted-foreground hidden group-open:inline">Hide</span>
                </summary>
                <p className="mt-2 text-[10px] font-mono text-muted-foreground bg-card p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {selectedTicket.ocr_text || "No text parsed."}
                </p>
              </details>

              <Button 
                onClick={() => setSelectedTicket(null)} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow"
              >
                Close Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <MobileBottomNav />
    </div>
  );
}
