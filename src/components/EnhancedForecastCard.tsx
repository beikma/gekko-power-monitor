import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, RefreshCw, Cloud, Zap, Thermometer, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEnergyReadings } from '@/hooks/useEnergyReadings';

interface EnhancedForecastData {
  timestamp: string;
  energy_consumption: number;
  pv_generation: number;
  weather_temp: number;
  weather_condition: string;
  cost_per_kwh: number;
  grid_co2_intensity: number;
  building_efficiency: number;
}

interface MarketData {
  current_price: number;
  peak_hours: string[];
  off_peak_hours: string[];
  co2_intensity: number;
}

export function EnhancedForecastCard() {
  const [forecastData, setForecastData] = useState<EnhancedForecastData[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { toast } = useToast();
  const { readings, latestReading } = useEnergyReadings();

  const generateEnhancedForecast = async () => {
    setIsLoading(true);
    
    try {
      // Get building info for location context
      const { data: buildingInfo } = await supabase
        .from('building_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!buildingInfo) {
        toast({
          title: "Setup Required",
          description: "Please configure building information first",
          variant: "destructive"
        });
        return;
      }

      // Get 7-day weather forecast
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${buildingInfo.latitude}&longitude=${buildingInfo.longitude}&hourly=temperature_2m,relative_humidity_2m,weather_code,shortwave_radiation&timezone=auto&forecast_days=7`
      );
      const weatherData = await weatherResponse.json();

      // Get energy market prices (mock data - could use real energy market API)
      const currentHour = new Date().getHours();
      const peakHours = ['17', '18', '19', '20']; // Evening peak
      const currentPrice = peakHours.includes(currentHour.toString()) ? 0.35 : 0.25; // EUR per kWh
      
      const mockMarketData: MarketData = {
        current_price: currentPrice,
        peak_hours: ['17:00', '18:00', '19:00', '20:00'],
        off_peak_hours: ['01:00', '02:00', '03:00', '13:00', '14:00'],
        co2_intensity: 250 // gCO2/kWh grid average
      };

      // Analyze historical patterns from database
      const hourlyPatterns = new Array(24).fill({ consumption: 3.5, pv: 0 });
      if (readings && readings.length > 0) {
        const patterns = new Array(24).fill(0).map(() => ({ consumption: [], pv: [] }));
        
        readings.forEach(reading => {
          const hour = new Date(reading.created_at).getHours();
          patterns[hour].consumption.push(reading.current_power / 1000);
          patterns[hour].pv.push(reading.pv_power / 1000);
        });

        // Calculate hourly averages
        hourlyPatterns.forEach((_, hour) => {
          const consumptionAvg = patterns[hour].consumption.length > 0 
            ? patterns[hour].consumption.reduce((a, b) => a + b, 0) / patterns[hour].consumption.length
            : 3.5;
          const pvAvg = patterns[hour].pv.length > 0
            ? patterns[hour].pv.reduce((a, b) => a + b, 0) / patterns[hour].pv.length
            : 0;
          
          hourlyPatterns[hour] = { consumption: consumptionAvg, pv: pvAvg };
        });
      }

      // Generate enhanced 168-hour (7-day) forecast
      const forecast: EnhancedForecastData[] = [];
      for (let i = 0; i < 168; i++) {
        const forecastTime = new Date();
        forecastTime.setHours(forecastTime.getHours() + i);
        
        const hour = forecastTime.getHours();
        const dayOfWeek = forecastTime.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Weather impact
        const temp = weatherData.hourly?.temperature_2m?.[i] || 20;
        const solarIrradiance = weatherData.hourly?.shortwave_radiation?.[i] || 0;
        const weatherCode = weatherData.hourly?.weather_code?.[i] || 0;
        
        // Base consumption with weather adjustment
        let consumption = hourlyPatterns[hour].consumption;
        
        // Temperature impact (heating/cooling)
        if (temp < 15) consumption *= 1.3; // Heating demand
        if (temp > 25) consumption *= 1.2; // Cooling demand
        
        // Weekend reduction
        if (isWeekend) consumption *= 0.8;
        
        // PV generation based on solar irradiance
        const pvCapacity = buildingInfo.solar_panels ? (buildingInfo.total_area || 200) * 0.2 / 1000 : 0; // Estimate 0.2kW per m²
        let pvGeneration = hourlyPatterns[hour].pv;
        if (pvCapacity > 0 && solarIrradiance > 0) {
          pvGeneration = (solarIrradiance / 1000) * pvCapacity * 0.85; // 85% efficiency
        }
        
        // Dynamic pricing based on time and demand
        const isPeak = peakHours.includes(hour.toString());
        const costPerKwh = isPeak ? 0.35 : (hour >= 1 && hour <= 5) ? 0.18 : 0.25;
        
        // Building efficiency based on building info
        const buildingEfficiency = calculateBuildingEfficiency(buildingInfo);
        consumption *= (2 - buildingEfficiency); // More efficient = less consumption
        
        forecast.push({
          timestamp: forecastTime.toISOString(),
          energy_consumption: parseFloat(consumption.toFixed(2)),
          pv_generation: parseFloat(pvGeneration.toFixed(2)),
          weather_temp: temp,
          weather_condition: getWeatherCondition(weatherCode),
          cost_per_kwh: costPerKwh,
          grid_co2_intensity: mockMarketData.co2_intensity,
          building_efficiency: buildingEfficiency
        });
      }

      setForecastData(forecast);
      setMarketData(mockMarketData);
      setLastUpdate(new Date().toLocaleString());
      
      toast({
        title: "Enhanced Forecast Generated",
        description: `7-day forecast with weather, market data and building context`,
      });

    } catch (error) {
      console.error('Enhanced forecast error:', error);
      toast({
        title: "Forecast Error",
        description: "Failed to generate enhanced forecast",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBuildingEfficiency = (buildingInfo: any): number => {
    let efficiency = 0.5; // Base efficiency
    
    if (buildingInfo.energy_rating) {
      const ratingMap: { [key: string]: number } = {
        'A+++': 0.95, 'A++': 0.90, 'A+': 0.85, 'A': 0.80,
        'B': 0.70, 'C': 0.60, 'D': 0.50, 'E': 0.40, 'F': 0.30, 'G': 0.20
      };
      efficiency = ratingMap[buildingInfo.energy_rating] || 0.5;
    }
    
    if (buildingInfo.year_built > 2010) efficiency += 0.1;
    if (buildingInfo.renewable_energy) efficiency += 0.15;
    if (buildingInfo.solar_panels) efficiency += 0.1;
    
    return Math.min(efficiency, 1.0);
  };

  const getWeatherCondition = (code: number): string => {
    const conditions: { [key: number]: string } = {
      0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog', 51: 'Light Drizzle', 53: 'Moderate Drizzle',
      61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain', 71: 'Slight Snow',
      80: 'Rain Showers', 95: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
  };

  // Prepare chart data (next 48 hours)
  const chartData = forecastData.slice(0, 48).map((point, index) => ({
    hour: new Date(point.timestamp).toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: '2-digit' 
    }),
    consumption: point.energy_consumption,
    pv: point.pv_generation,
    cost: point.cost_per_kwh,
    temp: point.weather_temp,
    efficiency: point.building_efficiency * 10, // Scale for chart
    isPeak: marketData?.peak_hours.includes(new Date(point.timestamp).getHours() + ':00')
  }));

  const todayTotal = forecastData.slice(0, 24).reduce((sum, p) => sum + p.energy_consumption, 0);
  const weekTotal = forecastData.reduce((sum, p) => sum + p.energy_consumption, 0);
  const weekPVTotal = forecastData.reduce((sum, p) => sum + p.pv_generation, 0);
  const weekCost = forecastData.reduce((sum, p) => sum + (p.energy_consumption * p.cost_per_kwh), 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Enhanced Energy Forecast</CardTitle>
            <CardDescription>
              AI predictions combining real data, weather, market prices & building efficiency
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={generateEnhancedForecast}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            Generate Enhanced Forecast
          </Button>
        </div>

        {/* Status Badges */}
        {forecastData.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              7-Day Forecast
            </Badge>
            <Badge variant="secondary">
              Weather: {forecastData[0]?.weather_condition}
            </Badge>
            <Badge variant="outline">
              <Thermometer className="h-3 w-3 mr-1" />
              {forecastData[0]?.weather_temp.toFixed(1)}°C
            </Badge>
            <Badge variant="outline">
              Market: €{marketData?.current_price}/kWh
            </Badge>
            <Badge variant="outline">
              Building: {(forecastData[0]?.building_efficiency * 100).toFixed(0)}% efficient
            </Badge>
          </div>
        )}

        {/* Summary Cards */}
        {forecastData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{todayTotal.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Today kWh</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{weekPVTotal.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Week PV kWh</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">€{weekCost.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Week Cost</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{((weekPVTotal / weekTotal) * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Self-Consumption</div>
              </div>
            </Card>
          </div>
        )}

        {/* Enhanced Chart */}
        {chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">48-Hour Enhanced Forecast</h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  
                  {/* Consumption Area */}
                  <Area
                    dataKey="consumption"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                    name="Consumption (kWh)"
                  />
                  
                  {/* PV Generation */}
                  <Area
                    dataKey="pv"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary) / 0.3)"
                    strokeWidth={2}
                    name="PV Generation (kWh)"
                  />
                  
                  {/* Temperature Line */}
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={1}
                    dot={false}
                    name="Temperature (°C)"
                    strokeDasharray="2 2"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Market Insights */}
        {marketData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Market & Optimization Insights
            </h4>
            <div className="text-sm space-y-1">
              <p><strong>Current Price:</strong> €{marketData.current_price}/kWh</p>
              <p><strong>Peak Hours:</strong> {marketData.peak_hours.join(', ')} (avoid high consumption)</p>
              <p><strong>Optimal Hours:</strong> {marketData.off_peak_hours.join(', ')} (schedule energy-intensive tasks)</p>
              <p><strong>Grid CO₂:</strong> {marketData.co2_intensity}g/kWh (use PV when possible)</p>
            </div>
          </div>
        )}

        {/* Getting Started */}
        {forecastData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Generate enhanced forecasts combining multiple data sources</p>
            <p className="text-xs mt-2">Requires building configuration for accurate predictions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}