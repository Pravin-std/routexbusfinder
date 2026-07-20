import React from "react";
import { ArrowRight, Bus } from "lucide-react";
import logo from "@/assets/routex-logo.jpg";
import type { SavedTicket } from "./TicketFlow";

export const RainbowTicket: React.FC<{
  ticket: SavedTicket;
  issuedDate: string;
  busName: string;
}> = ({ ticket, issuedDate, busName }) => {
  const stubId = ticket.ticketId.replace(/[^A-Z0-9]/g, "").slice(-6);
  const [h, m] = ticket.departure.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const depTime = `${hour12}:${m.toString().padStart(2, "0")} ${period}`;

  return (
    <div className="relative mx-auto w-full">
      {/* outer rainbow frame */}
      <div className="rounded-2xl bg-gradient-to-r from-red-500 via-orange-400 via-30% via-yellow-400 via-50% via-green-500 via-70% via-blue-500 to-purple-500 p-[2px] shadow-lg">
        <div className="relative flex overflow-hidden rounded-[14px] bg-card">
          {/* left brand band */}
          <div className="relative flex w-16 shrink-0 flex-col items-center justify-center gap-2 border-r-2 border-dashed border-border bg-gradient-to-b from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-500 py-3">
            <img
              src={logo}
              alt="RouteX"
              className="h-9 w-9 rounded-md object-contain ring-2 ring-card"
            />
            <span
              className="text-[10px] font-extrabold uppercase tracking-widest text-card"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              RouteX
            </span>
          </div>

          {/* main body */}
          <div className="flex-1 p-4">
            {/* top row: bus chip + paid */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                <Bus className="h-3 w-3" />
                {ticket.busNumber}
              </span>
              <span className="rounded-md border-2 border-success px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success">
                Paid ✓
              </span>
            </div>

            {/* From → To */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  From
                </p>
                <p className="break-words text-sm font-extrabold leading-tight text-foreground">
                  {ticket.fromName}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  To
                </p>
                <p className="break-words text-sm font-extrabold leading-tight text-foreground">
                  {ticket.toName}
                </p>
              </div>
            </div>

            {/* meta row */}
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-2 text-[10px]">
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Departure
                </p>
                <p className="text-xs font-bold text-foreground">{depTime}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Bus
                </p>
                <p className="truncate text-[11px] font-bold text-foreground">{busName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Fare
                </p>
                <p className="bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 bg-clip-text text-base font-extrabold text-transparent">
                  ₹{ticket.price}
                </p>
              </div>
            </div>

            {/* footer row */}
            <div className="mt-2 flex items-end justify-between border-t border-dashed border-border pt-2 text-[10px]">
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Passenger
                </p>
                <p className="text-[11px] font-bold text-foreground">{ticket.passenger}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Issued
                </p>
                <p className="text-[10px] font-bold text-foreground">{issuedDate}</p>
              </div>
            </div>
          </div>

          {/* right perforated stub */}
          <div className="flex w-12 shrink-0 items-center justify-center border-l-2 border-dashed border-border bg-gradient-to-b from-purple-500 via-blue-500 via-green-500 via-yellow-400 to-red-500">
            <span
              className="font-mono text-sm font-extrabold tracking-widest text-card"
              style={{ writingMode: "vertical-rl" }}
            >
              {stubId}
            </span>
          </div>

          {/* perforation notches */}
          <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
        </div>
      </div>

      <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
        {ticket.ticketId}
      </p>
    </div>
  );
};
