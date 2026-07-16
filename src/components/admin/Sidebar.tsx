import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Route as RouteIcon,
  MapPin,
  Bus,
  CalendarDays,
  Banknote,
  Ticket,
  CreditCard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/routex-logo.jpg";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Routes", href: "/admin/routes", icon: RouteIcon },
  { name: "Bus Stops", href: "/admin/stops", icon: MapPin },
  { name: "Buses", href: "/admin/buses", icon: Bus },
  { name: "Schedules", href: "/admin/schedules", icon: CalendarDays },
  { name: "Fares", href: "/admin/fares", icon: Banknote },
  { name: "Bookings", href: "/admin/bookings", icon: Ticket },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export const Sidebar = ({ isOpen, setOpen }: { isOpen: boolean; setOpen: (open: boolean) => void }) => {
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border transition-transform duration-300 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <img src={logo} alt="RouteX" className="h-8 w-8 rounded-md object-contain" />
        <span className="text-lg font-bold">RouteX Admin</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/admin"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};
