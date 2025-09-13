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
      
      // Call Supabase Edge Function
      const params = new URLSearchParams();
      if (options.useLiveData) params.append('live', 'true');
      if (options.forecastHours) params.append('hours', options.forecastHours.toString());
      
      const { data: result, error: supabaseError } = await supabase.functions.invoke(
        'energy-forecast',
        {
          method: 'GET',
          body: null,
        }
      );
      
      if (supabaseError) {
        throw new Error(`Forecast API error: ${supabaseError.message}`);
      }
      
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