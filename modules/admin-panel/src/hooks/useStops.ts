import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusStop {
  id: string;
  name_en: string;
  name_ta: string;
  district: string;
}

export const useStops = () => {
  return useQuery({
    queryKey: ["stops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stops").select("*");
      if (error) throw error;
      return data as BusStop[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
};
