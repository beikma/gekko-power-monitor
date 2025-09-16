import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer,
  Eye,
  Compass
} from 'lucide-react';

interface WeatherWidgetProps {
  data: any;
  location?: string;
  carbonIntensity?: any;
}

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    feelsLike: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    condition: string;
    icon: string;
    precipitation: number;
  }>;
}

export function WeatherWidget({ data, location = 'Building Location', carbonIntensity }: WeatherWidgetProps) {
  // Use real weather data if available, otherwise fallback to mock data
  const weatherData: WeatherData = data ? {
    location: location,
    current: {
      temperature: Math.round(data.current?.temperature || 18),
      feelsLike: Math.round((data.current?.temperature || 18) - 2),
      condition: getWeatherCondition(data.current?.wind_speed, data.current?.precipitation),
      icon: 'partly-cloudy',
      humidity: Math.round(data.current?.humidity || 65),
      windSpeed: Math.round(data.current?.wind_speed || 12),
      windDirection: 220,
      pressure: 1013,
      visibility: 10,
      uvIndex: 3
    },
    hourly: data.hourly?.slice(0, 6).map((hour: any, index: number) => {
      const time = new Date(hour.timestamp);
      return {
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        temperature: Math.round(hour.temperature),
        condition: getWeatherCondition(hour.wind_speed, hour.precipitation),
        icon: getWeatherIconType(hour.wind_speed, hour.precipitation),
        precipitation: Math.round(hour.precipitation * 100) // Convert to percentage
      };
    }) || [
      { time: '14:00', temperature: 18, condition: 'Partly Cloudy', icon: 'partly-cloudy', precipitation: 0 },
      { time: '15:00', temperature: 19, condition: 'Sunny', icon: 'sunny', precipitation: 0 },
      { time: '16:00', temperature: 20, condition: 'Sunny', icon: 'sunny', precipitation: 0 },
      { time: '17:00', temperature: 19, condition: 'Cloudy', icon: 'cloudy', precipitation: 10 },
      { time: '18:00', temperature: 17, condition: 'Light Rain', icon: 'rain', precipitation: 60 },
      { time: '19:00', temperature: 16, condition: 'Light Rain', icon: 'rain', precipitation: 40 }
    ]
  } : {
    location: location,
    current: {
      temperature: 18,
      feelsLike: 16,
      condition: 'Partly Cloudy',
      icon: 'partly-cloudy',
      humidity: 65,
      windSpeed: 12,
      windDirection: 220,
      pressure: 1013,
      visibility: 10,
      uvIndex: 3
    },
    hourly: [
      { time: '14:00', temperature: 18, condition: 'Partly Cloudy', icon: 'partly-cloudy', precipitation: 0 },
      { time: '15:00', temperature: 19, condition: 'Sunny', icon: 'sunny', precipitation: 0 },
      { time: '16:00', temperature: 20, condition: 'Sunny', icon: 'sunny', precipitation: 0 },
      { time: '17:00', temperature: 19, condition: 'Cloudy', icon: 'cloudy', precipitation: 10 },
      { time: '18:00', temperature: 17, condition: 'Light Rain', icon: 'rain', precipitation: 60 },
      { time: '19:00', temperature: 16, condition: 'Light Rain', icon: 'rain', precipitation: 40 }
    ]
  };

  function getWeatherCondition(windSpeed?: number, precipitation?: number): string {
    if (!windSpeed && !precipitation) return 'Partly Cloudy';
    if (precipitation && precipitation > 0.5) return 'Light Rain';
    if (windSpeed && windSpeed > 15) return 'Windy';
    if (windSpeed && windSpeed < 5) return 'Sunny';
    return 'Partly Cloudy';
  }

  function getWeatherIconType(windSpeed?: number, precipitation?: number): string {
    if (precipitation && precipitation > 0.5) return 'rain';
    if (windSpeed && windSpeed < 5) return 'sunny';
    return 'partly-cloudy';
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-8 h-8 text-amber-500" />;
      case 'partly-cloudy':
      case 'partly cloudy':
        return <Cloud className="w-8 h-8 text-blue-400" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rain':
      case 'light rain':
        return <CloudRain className="w-8 h-8 text-blue-600" />;
      default:
        return <Sun className="w-8 h-8 text-amber-500" />;
    }
  };

  const getSmallWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'partly-cloudy':
      case 'partly cloudy':
        return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rain':
      case 'light rain':
        return <CloudRain className="w-4 h-4 text-blue-600" />;
      default:
        return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Weather</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {weatherData.location}
        </Badge>
      </div>

      {/* Current Weather */}
      <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold">
              {weatherData.current.temperature}°C
            </div>
            <div className="text-sm text-muted-foreground">
              Feels like {weatherData.current.feelsLike}°C
            </div>
          </div>
          <div className="text-center">
            {getWeatherIcon(weatherData.current.condition)}
            <div className="text-sm font-medium mt-1">
              {weatherData.current.condition}
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">Humidity:</span>
            <span className="font-medium">{weatherData.current.humidity}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-gray-500" />
            <span className="text-muted-foreground">Wind:</span>
            <span className="font-medium">
              {weatherData.current.windSpeed} km/h {getWindDirection(weatherData.current.windDirection)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-purple-500" />
            <span className="text-muted-foreground">Pressure:</span>
            <span className="font-medium">{weatherData.current.pressure} hPa</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Visibility:</span>
            <span className="font-medium">{weatherData.current.visibility} km</span>
          </div>
        </div>
      </Card>

      {/* Hourly Forecast */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Hourly Forecast
        </h4>
        <div className="space-y-2">
          {weatherData.hourly.map((hour, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium w-12">{hour.time}</span>
                {getSmallWeatherIcon(hour.condition)}
                <span className="text-sm text-muted-foreground">{hour.condition}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {hour.precipitation > 0 && (
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-500">{hour.precipitation}%</span>
                  </div>
                )}
                <span className="font-medium text-sm">{hour.temperature}°C</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Intensity */}
      {carbonIntensity?.data && (
        <Card className="p-3 bg-gradient-to-r from-green-500/5 to-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Carbon Intensity</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm">{carbonIntensity.data.current.intensity} gCO₂/kWh</div>
              <div className={`text-xs ${carbonIntensity.isGreenTime ? 'text-green-500' : 'text-amber-500'}`}>
                {carbonIntensity.data.current.index}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Updated: {data?.updated_at ? new Date(data.updated_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}


function Leaf({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C8 2 4.5 4.5 4.5 8s1.5 6 3.5 8 4 3 4 3 2-1 4-3 3.5-4.5 3.5-8S16 2 12 2z"/>
      <path d="M8 8c0-1.5.5-3 1.5-4S12 2.5 12 2.5"/>
    </svg>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}