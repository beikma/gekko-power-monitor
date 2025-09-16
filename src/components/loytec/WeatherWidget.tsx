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

export function WeatherWidget({ data }: WeatherWidgetProps) {
  // Mock weather data - in real implementation this would come from Open-Meteo API
  const weatherData: WeatherData = {
    location: 'Vienna, Austria',
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

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
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