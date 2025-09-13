import { useQuery } from "@tanstack/react-query";

export interface MyGekkoAlarm {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  category: string;
  priority: string;
  acknowledged: boolean;
  resolved: boolean;
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
      try {
        const currentYear = new Date().getFullYear();
        const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
        const params = new URLSearchParams({
          endpoint: `list/alarm/lists/list0/status`,
          startrow: '0',
          rowcount: limit.toString(),
          year: currentYear.toString(),
          username: 'mustermann@my-gekko.com',
          key: 'HjR9j4BrruA8wZiBeiWXnD',
          gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
        });
        
        const response = await fetch(`${proxyUrl}?${params}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform myGEKKO alarm data
        if (!data || !data.alarms) {
          return [];
        }

        return data.alarms.slice(0, limit).map((alarm: any, index: number) => ({
          id: alarm.id || `alarm_${index}`,
          timestamp: alarm.timestamp || alarm.date || new Date().toISOString(),
          status: alarm.status || (alarm.acknowledged ? 'acknowledged' : 'active'),
          description: alarm.text || alarm.description || 'System alarm',
          category: alarm.category || alarm.type || 'system',
          priority: alarm.priority || alarm.severity || 'medium',
          acknowledged: alarm.acknowledged || false,
          resolved: alarm.resolved || alarm.status === 'resolved'
        })) as MyGekkoAlarm[];
        
      } catch (error) {
        console.error('Failed to fetch myGEKKO alarms:', error);
        return [];
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const activeAlarms = alarms.filter(alarm => !alarm.resolved);
  const criticalAlarms = alarms.filter(alarm => 
    alarm.priority === 'critical' || alarm.priority === 'high' || alarm.priority === '1'
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