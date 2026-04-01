import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusRoute {
  id: string;
  bus_number: string;
  bus_name: string;
  from_id: string;
  to_id: string;
  departure: string;
  arrival: string;
  duration_minutes: number;
  price: number;
  route_type: string;
  status: string;
  bus_type: string;
  intermediate_stops: string[] | null;
}

export const useBusSearch = (fromId: string, toId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["busSearch", fromId, toId],
    queryFn: async () => {
      // Build list of IDs to match (handle prefix matching like salem -> salem-new)
      const fromIds = [fromId];
      const toIds = [toId];

      // Check for sub-stops (e.g. "salem" should match "salem-new", "salem-old")
      const { data: fromStops } = await supabase
        .from("stops")
        .select("id")
        .like("id", `${fromId}-%`);
      if (fromStops) fromIds.push(...fromStops.map((s) => s.id));

      const { data: toStops } = await supabase
        .from("stops")
        .select("id")
        .like("id", `${toId}-%`);
      if (toStops) toIds.push(...toStops.map((s) => s.id));

      const { data, error } = await supabase
        .from("bus_routes")
        .select("*")
        .in("from_id", fromIds)
        .in("to_id", toIds);

      if (error) throw error;
      return data as BusRoute[];
    },
    enabled,
  });
};
