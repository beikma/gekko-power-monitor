import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnergyReading {
  id: string;
  created_at: string;
  current_power: number;
  daily_energy: number;
  battery_level: number;
  pv_power: number;
  grid_power: number;
  temperature?: number;
  humidity?: number;
  weather_condition?: string;
  efficiency_score?: number;
  cost_estimate?: number;
}

export function useEnergyReadings() {
  const {
    data: readings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["energy_readings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_readings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EnergyReading[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const latestReading = readings?.[0];

  return {
    readings,
    latestReading,
    isLoading,
    error,
    refetch
  };
}