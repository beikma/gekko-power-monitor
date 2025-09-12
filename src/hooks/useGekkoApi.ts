import { useState, useEffect, useCallback } from 'react';

interface GekkoData {
  [key: string]: any;
}

interface GekkoApiConfig {
  username: string;
  key: string;
  gekkoid: string;
  refreshInterval?: number;
}

interface UseGekkoApiReturn {
  data: GekkoData | null;
  status: GekkoData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refetch: () => void;
  connectionStatus: 'connected' | 'disconnected' | 'loading';
}

const defaultConfig: GekkoApiConfig = {
  username: 'mustermann@my-gekko.com',
  key: 'tpc77Dlxn9kHtBUvoZ3hQ5',
  gekkoid: '99Y9-JUTZ-8TYO-6P63',
  refreshInterval: 5000, // 5 seconds
};

export function useGekkoApi(config: Partial<GekkoApiConfig> = {}): UseGekkoApiReturn {
  const [data, setData] = useState<GekkoData | null>(null);
  const [status, setStatus] = useState<GekkoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  const finalConfig = { ...defaultConfig, ...config };

  const fetchData = useCallback(async () => {
    setConnectionStatus('loading');
    
    try {
      const baseParams = new URLSearchParams({
        username: finalConfig.username,
        key: finalConfig.key,
        gekkoid: finalConfig.gekkoid,
      });

      // Use our Supabase Edge Function to proxy the requests
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      
      const [dataResponse, statusResponse] = await Promise.all([
        fetch(`${proxyUrl}?endpoint=var&${baseParams}`),
        fetch(`${proxyUrl}?endpoint=var/status&${baseParams}`),
      ]);

      if (!dataResponse.ok || !statusResponse.ok) {
        throw new Error(`API Error: ${dataResponse.status} / ${statusResponse.status}`);
      }

      const [dataResult, statusResult] = await Promise.all([
        dataResponse.json(),
        statusResponse.json(),
      ]);

      setData(dataResult);
      setStatus(statusResult);
      setError(null);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig.username, finalConfig.key, finalConfig.gekkoid]);

  useEffect(() => {
    fetchData();
    
    if (finalConfig.refreshInterval && finalConfig.refreshInterval > 0) {
      const interval = setInterval(fetchData, finalConfig.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, finalConfig.refreshInterval]);

  return {
    data,
    status,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchData,
    connectionStatus,
  };
}