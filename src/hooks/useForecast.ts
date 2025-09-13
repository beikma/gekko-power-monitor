import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ForecastPoint {
  timestamp: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface HistoricalPoint {
  timestamp: string;
  actual: number;
}

export interface ForecastData {
  success: boolean;
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  model_info: {
    training_samples: number;
    forecast_horizon_hours: number;
    generated_at: string;
    training_duration_ms: number;
    algorithm: string;
  };
  error?: string;
}

export function useForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const runForecast = useCallback(async (options: { 
    useLiveData?: boolean; 
    forecastHours?: number 
  } = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Running forecast with options:', options);
      
      // Call Supabase Edge Function with query parameters
      const params = new URLSearchParams();
      if (options.useLiveData) params.append('live', 'true');
      if (options.forecastHours) params.append('hours', options.forecastHours.toString());
      
      // For GET requests with query params, we need to call the function URL directly
      const functionUrl = `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/energy-forecast?${params.toString()}`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheXR0d21tZGN1YmZqcXJwenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzQ3MzcsImV4cCI6MjA3MzI1MDczN30.40c-xV4k_w8k5TX7xtWUBOn2MU1yif6FzfYDE5e3tNI`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Forecast generation failed');
      }
      
      setData(result);
      setLastRefresh(new Date());
      
      console.log(`Forecast completed: ${result.forecast?.length || 0} points generated`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Forecast error:', errorMessage);
      setError(errorMessage);
      
      // Set empty data on error
      setData({
        success: false,
        historical: [],
        forecast: [],
        model_info: {
          training_samples: 0,
          forecast_horizon_hours: 0,
          generated_at: new Date().toISOString(),
          training_duration_ms: 0,
          algorithm: 'error'
        },
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearForecast = useCallback(() => {
    setData(null);
    setError(null);
    setLastRefresh(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    lastRefresh,
    runForecast,
    clearForecast,
    // Computed properties
    hasData: data?.success && data.forecast.length > 0,
    trainingDuration: data?.model_info.training_duration_ms || 0,
    forecastHours: data?.model_info.forecast_horizon_hours || 0,
    algorithm: data?.model_info.algorithm || 'Unknown'
  };
}