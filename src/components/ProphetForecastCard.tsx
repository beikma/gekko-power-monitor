import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, RefreshCw, Clock, Activity, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface HistoricalPoint {
  timestamp: string;
  actual: number;
}

interface ForecastPoint {
  timestamp: string;
  predicted: number;
  lower: number;
  upper: number;
}

interface ModelInfo {
  training_samples: number;
  forecast_horizon_hours: number;
  training_duration_ms: number;
  generated_at: string;
}

interface ServerInfo {
  total_duration_ms: number;
  server_timestamp: string;
  live_data: boolean;
}

interface ForecastData {
  success: boolean;
  historical?: HistoricalPoint[];
  forecast?: ForecastPoint[];
  model_info?: ModelInfo;
  server_info?: ServerInfo;
  error?: string;
}

export function ProphetForecastCard() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const { toast } = useToast();

  const runForecast = async (useLiveData = false) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('prophet-forecast', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: 'Forecast Error',
          description: error.message || 'Failed to run forecast',
          variant: 'destructive'
        });
        return;
      }

      if (data.success) {
        setForecastData(data);
        setLastRefresh(new Date().toLocaleString());
        
        toast({
          title: 'Forecast Complete',
          description: `Generated ${data.forecast?.length || 0} hour forecast in ${data.server_info?.total_duration_ms || 0}ms`,
        });
      } else {
        toast({
          title: 'Forecast Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Request error:', error);
      toast({
        title: 'Request Failed',
        description: 'Network error occurred while running forecast',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = [];
  
  if (forecastData?.historical) {
    forecastData.historical.forEach(point => {
      chartData.push({
        time: new Date(point.timestamp).toLocaleDateString('de-DE', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit' 
        }),
        actual: point.actual,
        type: 'historical'
      });
    });
  }

  if (forecastData?.forecast) {
    forecastData.forecast.forEach(point => {
      chartData.push({
        time: new Date(point.timestamp).toLocaleDateString('de-DE', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit' 
        }),
        predicted: point.predicted,
        lower: point.lower,
        upper: point.upper,
        type: 'forecast'
      });
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Prophet Forecast</CardTitle>
            <CardDescription>
              AI-powered energy consumption forecasting
              {/* TODO: Replace synthetic data with real GEKKO + MCP weather data */}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => runForecast(false)}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Run Forecast
          </Button>
          <Button 
            onClick={() => runForecast(true)}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            Live Data (TODO)
          </Button>
        </div>

        {/* Status Badges */}
        {forecastData && (
          <div className="flex flex-wrap gap-2 text-sm">
            {forecastData.model_info && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Training: {forecastData.model_info.training_duration_ms}ms
              </Badge>
            )}
            {lastRefresh && (
              <Badge variant="secondary">
                Last: {lastRefresh}
              </Badge>
            )}
            {forecastData.server_info && (
              <Badge variant="outline">
                Total: {forecastData.server_info.total_duration_ms}ms
              </Badge>
            )}
            {forecastData.model_info && (
              <Badge variant="outline">
                {forecastData.model_info.training_samples} samples
              </Badge>
            )}
          </div>
        )}

        {/* Error State */}
        {forecastData && !forecastData.success && (
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">Forecast Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{forecastData.error}</p>
          </div>
        )}

        {/* Chart */}
        {forecastData && forecastData.success && chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Energy Consumption Forecast</h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value, name) => [
                      `${value} kWh`,
                      name === 'actual' ? 'Historical' : 
                      name === 'predicted' ? 'Forecast' :
                      name === 'upper' ? 'Upper Bound' : 'Lower Bound'
                    ]}
                  />
                  <Legend />
                  
                  {/* Confidence Band */}
                  <Area
                    dataKey="upper"
                    stroke="none"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    stackId="confidence"
                  />
                  <Area
                    dataKey="lower"
                    stroke="none"
                    fill="hsl(var(--background))"
                    fillOpacity={1}
                    stackId="confidence"
                  />
                  
                  {/* Historical Data */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={false}
                    name="Historical"
                    connectNulls={false}
                  />
                  
                  {/* Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    name="Forecast"
                    strokeDasharray="5 5"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Model Info */}
        {forecastData && forecastData.success && forecastData.model_info && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {forecastData.model_info.forecast_horizon_hours}h
              </div>
              <div className="text-xs text-muted-foreground">Forecast</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {forecastData.model_info.training_samples}
              </div>
              <div className="text-xs text-muted-foreground">Samples</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {forecastData.model_info.training_duration_ms}ms
              </div>
              <div className="text-xs text-muted-foreground">Training</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                <Badge variant="outline" className="text-sm">
                  Prophet ✓
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">Algorithm</div>
            </div>
          </div>
        )}

        {/* Getting Started Hint */}
        {!forecastData && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Click "Run Forecast" to generate AI-powered energy predictions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}