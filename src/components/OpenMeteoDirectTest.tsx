import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Cloud, Sun, RefreshCw, MapPin, Clock, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WeatherData {
  timestamps: string[];
  temperature: number[];
  solar_radiation: number[];
}

export function OpenMeteoDirectTest() {
  const [lat, setLat] = useState<string>('46.7944'); // Bruneck/Innichen
  const [lon, setLon] = useState<string>('11.9464');
  const [hours, setHours] = useState<string>('48');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [lastFetch, setLastFetch] = useState<string>('');
  const [requestDuration, setRequestDuration] = useState<number>(0);
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const fetchForecast = async () => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const hoursNum = parseInt(hours);

    if (isNaN(latNum) || isNaN(lonNum) || isNaN(hoursNum)) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter valid numbers for latitude, longitude, and hours.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('open-meteo-weather', {
        body: {
          lat: latNum,
          lon: lonNum,
          hours: hoursNum
        }
      });

      const duration = Date.now() - startTime;
      setRequestDuration(duration);
      setLastFetch(new Date().toLocaleString());

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: 'API Error',
          description: error.message || 'Failed to call weather function',
          variant: 'destructive'
        });
        return;
      }

      if (data.success && data.data) {
        setWeatherData(data.data);
        setLocation(data.location);
        
        toast({
          title: 'Forecast Retrieved',
          description: `Got ${data.data.timestamps.length} hours of weather data via Supabase Edge Function`,
        });
      } else {
        toast({
          title: 'Fetch Failed',
          description: data.error || 'Failed to retrieve weather forecast',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Request error:', error);
      toast({
        title: 'Request Failed',
        description: 'Network error occurred while fetching weather data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = weatherData ? weatherData.timestamps.map((time, index) => ({
    time: new Date(time).toLocaleDateString('de-DE', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit' 
    }),
    temperature: weatherData.temperature[index],
    solar_radiation: weatherData.solar_radiation[index] / 10 // Scale down for better visualization
  })) : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Direct Weather API Test</CardTitle>
            <CardDescription>No local MCP server needed - Supabase Edge Function</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat-direct">Latitude</Label>
            <Input
              id="lat-direct"
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="46.7944"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lon-direct">Longitude</Label>
            <Input
              id="lon-direct"
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="11.9464"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours-direct">Hours</Label>
            <Input
              id="hours-direct"
              type="number"
              min="1"
              max="168"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="48"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={fetchForecast}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sun className="h-4 w-4 mr-2" />
              )}
              Fetch Direct
            </Button>
          </div>
        </div>

        {/* Status Info */}
        {lastFetch && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Last fetch: {lastFetch}</span>
            </div>
            <Badge variant="outline">
              {requestDuration}ms
            </Badge>
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              Edge Function
            </Badge>
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                {location.elevation && <span>({location.elevation}m)</span>}
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {weatherData && chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">48-Hour Weather Forecast</h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value, name) => [
                      `${value}${name === 'temperature' ? '°C' : ' W/m²'}`,
                      name === 'temperature' ? 'Temperature' : 'Solar Radiation'
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="solar_radiation"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    dot={false}
                    name="Solar Radiation (×10 W/m²)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Data Summary */}
        {weatherData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {weatherData.timestamps.length}
              </div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {weatherData.temperature.filter(t => t !== null).length > 0 
                  ? Math.round(weatherData.temperature.filter(t => t !== null).reduce((a, b) => a + b, 0) / weatherData.temperature.filter(t => t !== null).length)
                  : 'N/A'}°
              </div>
              <div className="text-xs text-muted-foreground">Avg Temp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {weatherData.solar_radiation.filter(s => s !== null).length > 0
                  ? Math.round(weatherData.solar_radiation.filter(s => s !== null).reduce((a, b) => Math.max(a, b), 0))
                  : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Peak Solar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                <Badge variant="outline" className="text-sm">
                  Direct ✓
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">API Status</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}