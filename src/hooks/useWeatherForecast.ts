import { useState, useCallback } from 'react';

export interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  solar_radiation: number;
  wind_speed: number;
  precipitation: number;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly: WeatherData[];
  daily: WeatherData[];
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  updated_at: string;
}

export function useWeatherForecast() {
  const [data, setData] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        hourly: 'temperature_2m,relative_humidity_2m,shortwave_radiation,wind_speed_10m,precipitation',
        daily: 'temperature_2m_max,temperature_2m_min,shortwave_radiation_sum,precipitation_sum',
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
        timezone: 'auto',
        forecast_days: '7'
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform the data into our format
      const weatherData: WeatherForecast = {
        current: {
          timestamp: result.current.time,
          temperature: result.current.temperature_2m,
          humidity: result.current.relative_humidity_2m,
          solar_radiation: 0, // Current doesn't include solar radiation
          wind_speed: result.current.wind_speed_10m,
          precipitation: 0
        },
        hourly: result.hourly.time.map((time: string, index: number) => ({
          timestamp: time,
          temperature: result.hourly.temperature_2m[index],
          humidity: result.hourly.relative_humidity_2m[index],
          solar_radiation: result.hourly.shortwave_radiation[index],
          wind_speed: result.hourly.wind_speed_10m[index],
          precipitation: result.hourly.precipitation[index]
        })).slice(0, 48), // Next 48 hours
        daily: result.daily.time.map((time: string, index: number) => ({
          timestamp: time,
          temperature: (result.daily.temperature_2m_max[index] + result.daily.temperature_2m_min[index]) / 2,
          humidity: 0, // Daily doesn't include humidity
          solar_radiation: result.daily.shortwave_radiation_sum[index],
          wind_speed: 0,
          precipitation: result.daily.precipitation_sum[index]
        })),
        location: {
          latitude,
          longitude
        },
        updated_at: new Date().toISOString()
      };

      setData(weatherData);
      console.log(`Weather forecast loaded: ${weatherData.hourly.length} hourly points`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      console.error('Weather forecast error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to get weather for common locations
  const fetchWeatherForLocation = useCallback((location: 'bolzano' | 'london' | 'berlin' | 'custom', customLat?: number, customLng?: number) => {
    const coordinates = {
      bolzano: { lat: 46.4983, lng: 11.3548 },
      london: { lat: 51.5074, lng: -0.1278 },
      berlin: { lat: 52.5200, lng: 13.4050 }
    };

    if (location === 'custom' && customLat !== undefined && customLng !== undefined) {
      return fetchWeather(customLat, customLng);
    } else if (location in coordinates) {
      const coord = coordinates[location];
      return fetchWeather(coord.lat, coord.lng);
    }
  }, [fetchWeather]);

  return {
    data,
    isLoading,
    error,
    fetchWeather,
    fetchWeatherForLocation,
    // Computed properties
    hasData: !!data,
    currentTemperature: data?.current.temperature,
    solarPotential: data?.hourly.reduce((sum, h) => sum + h.solar_radiation, 0) || 0
  };
}