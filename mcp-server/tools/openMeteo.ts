import axios from 'axios';

interface WeatherForecastData {
  timestamps: string[];
  temperature: number[];
  solar_radiation: number[];
}

export class OpenMeteoTools {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  async weatherForecast(lat: number, lon: number, hours: number = 48): Promise<any> {
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    if (hours < 1 || hours > 168) {
      throw new Error('Hours must be between 1 and 168 (7 days)');
    }

    try {
      const startTime = Date.now();
      
      const response = await axios.get(this.baseUrl, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'temperature_2m,solar_radiation',
          forecast_days: Math.ceil(hours / 24),
          timezone: 'auto'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'MCP-OpenMeteo-Server/1.0.0'
        }
      });

      const data = response.data;
      
      if (!data.hourly || !data.hourly.time) {
        throw new Error('Invalid response format from Open-Meteo API');
      }

      // Normalize data and limit to requested hours
      const timestamps = data.hourly.time.slice(0, hours);
      const temperature = data.hourly.temperature_2m ? data.hourly.temperature_2m.slice(0, hours) : [];
      const solarRadiation = data.hourly.solar_radiation ? data.hourly.solar_radiation.slice(0, hours) : [];

      // Fill missing values with null
      while (temperature.length < timestamps.length) {
        temperature.push(null);
      }
      while (solarRadiation.length < timestamps.length) {
        solarRadiation.push(null);
      }

      const result: WeatherForecastData = {
        timestamps,
        temperature,
        solar_radiation: solarRadiation
      };

      return {
        success: true,
        data: result,
        location: {
          latitude: lat,
          longitude: lon,
          timezone: data.timezone || 'UTC',
          elevation: data.elevation || null
        },
        metadata: {
          source: 'Open-Meteo',
          requestedHours: hours,
          actualHours: timestamps.length,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Open-Meteo API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Invalid parameters provided to Open-Meteo API');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded for Open-Meteo API');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - Open-Meteo API did not respond in time');
        }
      }
      
      throw new Error(`Failed to fetch weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async health(): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Test with a simple request to a known location (Vienna, Austria)
      const response = await axios.get(this.baseUrl, {
        params: {
          latitude: 48.2082,
          longitude: 16.3738,
          hourly: 'temperature_2m',
          forecast_days: 1
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'MCP-OpenMeteo-Server/1.0.0'
        }
      });

      return {
        status: 'ok',
        service: 'Open-Meteo API',
        message: 'Open-Meteo weather service is accessible',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        testLocation: {
          latitude: 48.2082,
          longitude: 16.3738,
          name: 'Vienna, Austria'
        },
        apiVersion: response.data.generationtime_ms ? 'v1' : 'unknown'
      };

    } catch (error) {
      return {
        status: 'error',
        service: 'Open-Meteo API',
        message: `Open-Meteo health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const openMeteoTools = new OpenMeteoTools();