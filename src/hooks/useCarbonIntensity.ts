import { useState, useCallback } from 'react';

export interface CarbonIntensityData {
  timestamp: string;
  intensity: number; // gCO2/kWh
  index: 'very low' | 'low' | 'moderate' | 'high' | 'very high';
  forecast?: boolean;
}

export interface CarbonForecast {
  current: CarbonIntensityData;
  forecast: CarbonIntensityData[];
  region: string;
  updated_at: string;
}

export function useCarbonIntensity() {
  const [data, setData] = useState<CarbonForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCarbonIntensity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch current intensity
      const currentResponse = await fetch('https://api.carbonintensity.org.uk/intensity');
      
      if (!currentResponse.ok) {
        throw new Error(`Carbon Intensity API error: ${currentResponse.status}`);
      }

      const currentData = await currentResponse.json();
      
      // Fetch 48-hour forecast
      const forecastResponse = await fetch('https://api.carbonintensity.org.uk/intensity/date');
      const forecastData = await forecastResponse.json();

      // Transform current data
      const current: CarbonIntensityData = {
        timestamp: currentData.data[0]?.from || new Date().toISOString(),
        intensity: currentData.data[0]?.intensity?.actual || currentData.data[0]?.intensity?.forecast || 0,
        index: currentData.data[0]?.intensity?.index || 'moderate',
        forecast: !currentData.data[0]?.intensity?.actual
      };

      // Transform forecast data
      const forecast: CarbonIntensityData[] = (forecastData.data || []).map((item: any) => ({
        timestamp: item.from,
        intensity: item.intensity.forecast,
        index: item.intensity.index,
        forecast: true
      })).slice(0, 48); // Next 48 hours

      const carbonData: CarbonForecast = {
        current,
        forecast,
        region: 'UK',
        updated_at: new Date().toISOString()
      };

      setData(carbonData);
      console.log(`Carbon intensity loaded: current ${current.intensity} gCO2/kWh (${current.index})`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch carbon intensity data';
      console.error('Carbon intensity error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper to get optimal time slots for energy usage (lowest carbon periods)
  const getOptimalTimeSlots = useCallback((hours: number = 4): CarbonIntensityData[] => {
    if (!data?.forecast) return [];
    
    return [...data.forecast]
      .sort((a, b) => a.intensity - b.intensity)
      .slice(0, hours);
  }, [data]);

  // Helper to check if current time is good for energy usage
  const isLowCarbonPeriod = useCallback((): boolean => {
    if (!data?.current) return false;
    return data.current.intensity < 200; // Below 200 gCO2/kWh is considered good
  }, [data]);

  return {
    data,
    isLoading,
    error,
    fetchCarbonIntensity,
    getOptimalTimeSlots,
    isLowCarbonPeriod,
    // Computed properties
    hasData: !!data,
    currentIntensity: data?.current?.intensity,
    currentIndex: data?.current?.index,
    isGreenTime: isLowCarbonPeriod()
  };
}