import { useState, useCallback } from 'react';

export interface SolarPVData {
  timestamp: string;
  pv_output_kwh: number;
  solar_irradiance: number;
  efficiency: number;
}

export interface SolarForecast {
  system_info: {
    capacity_kw: number;
    latitude: number;
    longitude: number;
    tilt: number;
    azimuth: number;
  };
  forecast: SolarPVData[];
  total_daily_kwh: number;
  updated_at: string;
}

export function useSolarForecast() {
  const [data, setData] = useState<SolarForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSolarForecast = useCallback(async (options: {
    latitude: number;
    longitude: number;
    capacity_kw?: number;
    tilt?: number;
    azimuth?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const {
        latitude,
        longitude,
        capacity_kw = 10, // Default 10kW system
        tilt = 30,
        azimuth = 180 // South-facing
      } = options;

      // Use NREL PVWatts API with demo key for solar estimates
      const params = new URLSearchParams({
        api_key: 'DEMO_KEY',
        lat: latitude.toString(),
        lon: longitude.toString(),
        system_capacity: capacity_kw.toString(),
        tilt: tilt.toString(),
        azimuth: azimuth.toString(),
        module_type: '1', // Standard
        losses: '10', // 10% system losses
        array_type: '1', // Fixed (roof mount)
        format: 'json'
      });

      const response = await fetch(`https://developer.nrel.gov/api/pvwatts/v6.json?${params}`);
      
      if (!response.ok) {
        throw new Error(`Solar API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Solar API: ${result.errors.join(', ')}`);
      }

      // Get weather data for solar irradiance forecast
      const weatherParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        hourly: 'shortwave_radiation',
        timezone: 'auto',
        forecast_days: '7'
      });

      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`);
      const weatherData = await weatherResponse.json();

      // Combine NREL annual data with current weather forecast
      const annualOutput = result.outputs.ac_monthly;
      const avgDailyOutput = annualOutput.reduce((sum: number, month: number) => sum + month, 0) / 365;

      // Create hourly forecast based on solar irradiance
      const forecast: SolarPVData[] = weatherData.hourly.time.map((time: string, index: number) => {
        const irradiance = weatherData.hourly.shortwave_radiation[index] || 0;
        const hour = new Date(time).getHours();
        
        // Simple model: PV output proportional to irradiance and time of day
        const timeOfDayFactor = hour >= 6 && hour <= 18 ? 
          Math.sin(((hour - 6) / 12) * Math.PI) : 0;
        
        const pv_output = (irradiance / 1000) * capacity_kw * timeOfDayFactor * 0.8; // 80% efficiency
        
        return {
          timestamp: time,
          pv_output_kwh: Math.max(0, pv_output),
          solar_irradiance: irradiance,
          efficiency: irradiance > 0 ? (pv_output / (capacity_kw * timeOfDayFactor)) * 100 : 0
        };
      }).slice(0, 48); // Next 48 hours

      const totalDailyKwh = forecast
        .slice(0, 24)
        .reduce((sum, point) => sum + point.pv_output_kwh, 0);

      const solarData: SolarForecast = {
        system_info: {
          capacity_kw,
          latitude,
          longitude,
          tilt,
          azimuth
        },
        forecast,
        total_daily_kwh: totalDailyKwh,
        updated_at: new Date().toISOString()
      };

      setData(solarData);
      console.log(`Solar forecast loaded: ${totalDailyKwh.toFixed(1)} kWh expected today`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch solar forecast';
      console.error('Solar forecast error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchSolarForecast,
    // Computed properties
    hasData: !!data,
    dailyOutput: data?.total_daily_kwh || 0,
    peakOutput: data?.forecast.reduce((max, point) => Math.max(max, point.pv_output_kwh), 0) || 0,
    systemCapacity: data?.system_info.capacity_kw || 0
  };
}