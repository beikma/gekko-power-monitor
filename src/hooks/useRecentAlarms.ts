import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemAlarm {
  id: string;
  description: string;
  alarm_type: string;
  start_time: string;
  end_time?: string;
  status: string;
  severity: string;
  created_at: string;
  metadata?: any;
}

export function useRecentAlarms(limit: number = 3) {
  const {
    data: alarms = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["recent_alarms", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_alarms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SystemAlarm[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const activeAlarms = alarms.filter(alarm => alarm.status === 'active');
  const criticalAlarms = alarms.filter(alarm => 
    alarm.severity === 'critical' || alarm.severity === 'high'
  );

  return {
    alarms,
    activeAlarms,
    criticalAlarms,
    isLoading,
    error,
    refetch
  };
}