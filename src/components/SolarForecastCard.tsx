import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSolarForecast } from '@/hooks/useSolarForecast';
import { Sun, Zap, Calendar, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export function SolarForecastCard() {
  const { data, isLoading, error, fetchSolarForecast, hasData, dailyOutput, peakOutput, systemCapacity } = useSolarForecast();
  
  const [location, setLocation] = useState({ lat: 46.4983, lng: 11.3548 }); // Bolzano default
  const [systemConfig, setSystemConfig] = useState({
    capacity: 10,
    tilt: 30,
    azimuth: 180
  });
  const [showConfig, setShowConfig] = useState(false);

  const handleFetchSolar = () => {
    fetchSolarForecast({
      latitude: location.lat,
      longitude: location.lng,
      capacity_kw: systemConfig.capacity,
      tilt: systemConfig.tilt,
      azimuth: systemConfig.azimuth
    });
  };

  const formatChartData = () => {
    if (!data?.forecast) return [];
    
    return data.forecast.slice(0, 24).map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' }),
      output: Number(point.pv_output_kwh.toFixed(2)),
      irradiance: Math.round(point.solar_irradiance)
    }));
  };

  const getDailyTotals = () => {
    if (!data?.forecast) return [];
    
    const dailyData: { [key: string]: number } = {};
    
    data.forecast.forEach(point => {
      const date = new Date(point.timestamp).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + point.pv_output_kwh;
    });
    
    return Object.entries(dailyData).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      total: Number(total.toFixed(1))
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Solar PV Forecast
        </CardTitle>
        <CardDescription>
          Solar energy generation prediction using NREL PVWatts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleFetchSolar} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Calculating...' : 'Generate Solar Forecast'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configure System
          </Button>
        </div>

        {showConfig && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="0.0001"
                value={location.lat}
                onChange={(e) => setLocation(prev => ({ ...prev, lat: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="0.0001"
                value={location.lng}
                onChange={(e) => setLocation(prev => ({ ...prev, lng: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (kW)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="1000"
                value={systemConfig.capacity}
                onChange={(e) => setSystemConfig(prev => ({ ...prev, capacity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="tilt">Tilt (degrees)</Label>
              <Input
                id="tilt"
                type="number"
                min="0"
                max="90"
                value={systemConfig.tilt}
                onChange={(e) => setSystemConfig(prev => ({ ...prev, tilt: Number(e.target.value) }))}
              />
            </div>
          </div>
        )}

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
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Zap className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-sm text-muted-foreground">System Capacity</div>
                  <div className="font-bold text-xl">{systemCapacity} <span className="text-sm font-normal">kW</span></div>
                  <div className="text-xs text-muted-foreground">
                    {data.system_info.tilt}° tilt, {data.system_info.azimuth}° azimuth
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Today's Output</div>
                  <div className="font-bold text-xl">{dailyOutput.toFixed(1)} <span className="text-sm font-normal">kWh</span></div>
                  <div className="text-xs text-muted-foreground">
                    Est. €{(dailyOutput * 0.25).toFixed(2)} savings
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Sun className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Peak Output</div>
                  <div className="font-bold text-xl">{peakOutput.toFixed(1)} <span className="text-sm font-normal">kW</span></div>
                  <Badge variant="outline">
                    {((peakOutput / systemCapacity) * 100).toFixed(0)}% capacity
                  </Badge>
                </div>
              </div>
            </div>

            {/* 24-Hour Generation Forecast */}
            <div className="space-y-2">
              <h4 className="font-semibold">Today's Solar Generation Profile</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} ${name === 'output' ? 'kWh' : 'W/m²'}`,
                      name === 'output' ? 'PV Output' : 'Solar Irradiance'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="output" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Outlook */}
            <div className="space-y-2">
              <h4 className="font-semibold">7-Day Generation Forecast</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={getDailyTotals()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kWh`, 'Daily Output']} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Generation Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-semibold text-sm">Weekly Total</div>
                <div className="text-yellow-700">
                  {getDailyTotals().reduce((sum, day) => sum + day.total, 0).toFixed(1)} kWh
                </div>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <div className="font-semibold text-sm">CO₂ Avoided</div>
                <div className="text-green-700">
                  {(dailyOutput * 0.4).toFixed(1)} kg
                </div>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="font-semibold text-sm">Efficiency</div>
                <div className="text-blue-700">
                  {((dailyOutput / systemCapacity) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                <div className="font-semibold text-sm">Peak Time</div>
                <div className="text-purple-700">
                  {formatChartData().reduce((max, point) => 
                    point.output > max.output ? point : max, 
                    { output: 0, time: 'N/A' }
                  ).time}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(data.updated_at).toLocaleString()}
              <br />
              Location: {data.system_info.latitude.toFixed(4)}, {data.system_info.longitude.toFixed(4)}
              <br />
              Data source: NREL PVWatts API & Open-Meteo
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}