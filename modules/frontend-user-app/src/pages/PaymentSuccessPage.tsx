import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { PhysicalTicketScanner } from "@/components/PhysicalTicketScanner";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const pendingTicket = location.state?.pendingTicket;
  
  if (!pendingTicket) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pt-16 p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border p-6 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
        <p className="text-muted-foreground text-sm">
          Your payment was received. To generate your digital ticket, you must scan the physical ticket given by the conductor to verify your trip.
        </p>
        
        <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left border border-border/50">
           <p className="font-semibold mb-2 text-foreground">Expected Trip Details:</p>
           <ul className="space-y-1.5 text-muted-foreground">
             <li className="flex justify-between"><span>Bus Number:</span> <span className="font-medium text-foreground">{pendingTicket.busNumber}</span></li>
             <li className="flex justify-between"><span>From:</span> <span className="font-medium text-foreground truncate ml-4">{pendingTicket.fromName}</span></li>
             <li className="flex justify-between"><span>To:</span> <span className="font-medium text-foreground truncate ml-4">{pendingTicket.toName}</span></li>
             <li className="flex justify-between"><span>Fare:</span> <span className="font-medium text-primary">₹{pendingTicket.price}</span></li>
           </ul>
        </div>

        <div className="pt-2">
          <PhysicalTicketScanner 
            pendingTicket={pendingTicket} 
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
