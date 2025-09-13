import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  Sun, 
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Thermometer
} from "lucide-react";
import { WidgetProps } from "@/types/widget";

export function WeatherWidget({ data, status, isLoading, size = 'small' }: WidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock weather data - in real implementation, this would come from weather API
  const weatherData = {
    temperature: status?.weather?.temperature || 22,
    condition: status?.weather?.condition || 'partly-cloudy',
    humidity: status?.weather?.humidity || 65,
    windSpeed: status?.weather?.windSpeed || 12,
    visibility: status?.weather?.visibility || 10,
    pressure: status?.weather?.pressure || 1013,
    uvIndex: status?.weather?.uvIndex || 5,
    location: status?.weather?.location || 'Current Location'
  };

  const getWeatherIcon = (condition: string) => {
    const icons = {
      'sunny': Sun,
      'partly-cloudy': Cloud,
      'cloudy': Cloud,
      'rainy': CloudRain,
      'windy': Wind
    };
    const IconComponent = icons[condition as keyof typeof icons] || Cloud;
    return <IconComponent className="h-6 w-6 text-energy-warning" />;
  };

  const getConditionText = (condition: string) => {
    const conditions = {
      'sunny': 'Sunny',
      'partly-cloudy': 'Partly Cloudy',
      'cloudy': 'Cloudy',
      'rainy': 'Rainy',
      'windy': 'Windy'
    };
    return conditions[condition as keyof typeof conditions] || 'Unknown';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return 'text-blue-400';
    if (temp > 25) return 'text-red-400';
    return 'text-energy-success';
  };

  if (size === 'small') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {getWeatherIcon(weatherData.condition)}
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Temperature</span>
            <span className={`text-xl font-bold ${getTemperatureColor(weatherData.temperature)}`}>
              {weatherData.temperature}°C
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Condition</span>
            <span className="font-medium text-sm">{getConditionText(weatherData.condition)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" />
              <span className="text-muted-foreground text-sm">Humidity</span>
            </div>
            <span className="font-semibold text-sm">{weatherData.humidity}%</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Medium/Large size
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getWeatherIcon(weatherData.condition)}
          Weather Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Temperature Display */}
        <div className="text-center space-y-2">
          <div className={`text-4xl font-bold ${getTemperatureColor(weatherData.temperature)}`}>
            {weatherData.temperature}°C
          </div>
          <div className="text-sm text-muted-foreground">
            {getConditionText(weatherData.condition)} in {weatherData.location}
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-muted-foreground">Humidity</p>
              <p className="font-semibold">{weatherData.humidity}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-muted-foreground">Wind</p>
              <p className="font-semibold">{weatherData.windSpeed} km/h</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-muted-foreground">Visibility</p>
              <p className="font-semibold">{weatherData.visibility} km</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-energy-primary" />
            <div>
              <p className="text-muted-foreground">Pressure</p>
              <p className="font-semibold">{weatherData.pressure} hPa</p>
            </div>
          </div>
        </div>

        {/* UV Index */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">UV Index</span>
          <Badge variant={weatherData.uvIndex > 7 ? "destructive" : weatherData.uvIndex > 4 ? "secondary" : "default"}>
            {weatherData.uvIndex} {weatherData.uvIndex > 7 ? 'High' : weatherData.uvIndex > 4 ? 'Moderate' : 'Low'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}