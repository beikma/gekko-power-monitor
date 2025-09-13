import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { Cloud, Sun, Wind, Droplets, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function WeatherForecastCard() {
  const { data, isLoading, error, fetchWeatherForLocation, hasData } = useWeatherForecast();
  const [selectedLocation, setSelectedLocation] = useState<'bruneck' | 'london' | 'berlin'>('bruneck');

  const handleFetchWeather = () => {
    fetchWeatherForLocation(selectedLocation);
  };

  const formatChartData = () => {
    if (!data?.hourly) return [];
    
    return data.hourly.slice(0, 24).map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' }),
      temperature: Math.round(point.temperature),
      solar: Math.round(point.solar_radiation),
      wind: Math.round(point.wind_speed)
    }));
  };

  const getWeatherIcon = (temp: number, solar: number) => {
    if (solar > 600) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (temp < 10) return <Cloud className="h-5 w-5 text-blue-500" />;
    return <Cloud className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Weather Forecast
        </CardTitle>
        <CardDescription>
          Weather data for energy demand prediction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <select 
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value as any)}
            className="px-3 py-1 border rounded-md"
          >
            <option value="bruneck">Bruneck, Italy</option>
            <option value="london">London, UK</option>
            <option value="berlin">Berlin, Germany</option>
          </select>
          
          <Button 
            onClick={handleFetchWeather} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Get Weather'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {hasData && data && (
          <>
            {/* Current Weather */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getWeatherIcon(data.current.temperature, 0)}
                <div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                  <div className="font-semibold">{Math.round(data.current.temperature)}°C</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                  <div className="font-semibold">{data.current.humidity}%</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Wind Speed</div>
                  <div className="font-semibold">{Math.round(data.current.wind_speed)} km/h</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Solar Potential</div>
                  <Badge variant="outline">
                    {Math.round((data.hourly?.reduce((sum, h) => sum + h.solar_radiation, 0) || 0) / 1000)} kWh
                  </Badge>
                </div>
              </div>
            </div>

            {/* 24-Hour Forecast Chart */}
            <div className="space-y-2">
              <h4 className="font-semibold">24-Hour Forecast</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="temp" />
                  <YAxis yAxisId="solar" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="temp"
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="hsl(var(--primary))" 
                    name="Temperature (°C)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="solar"
                    type="monotone" 
                    dataKey="solar" 
                    stroke="hsl(var(--secondary))" 
                    name="Solar Radiation (W/m²)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="temp"
                    type="monotone" 
                    dataKey="wind" 
                    stroke="hsl(var(--muted-foreground))" 
                    name="Wind Speed (km/h)"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(data.updated_at).toLocaleString()}
              <br />
              Location: {data.location.latitude.toFixed(2)}, {data.location.longitude.toFixed(2)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}