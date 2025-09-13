import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Activity, 
  Zap, 
  RefreshCw, 
  AlertCircle,
  Brain
} from 'lucide-react';
import { useForecast } from '@/hooks/useForecast';
import { cn } from '@/lib/utils';

interface ForecastCardProps {
  className?: string;
}

export function ForecastCard({ className }: ForecastCardProps) {
  const { 
    data, 
    isLoading, 
    error, 
    lastRefresh, 
    runForecast, 
    hasData, 
    trainingDuration,
    forecastHours,
    algorithm 
  } = useForecast();

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!hasData) return [];
    
    // Combine historical and forecast data
    const historical = data.historical.map(point => ({
      timestamp: new Date(point.timestamp).getTime(),
      time: new Date(point.timestamp).toLocaleTimeString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit' 
      }),
      actual: point.actual,
      predicted: null,
      upper: null,
      lower: null,
      type: 'historical'
    }));
    
    const forecast = data.forecast.map(point => ({
      timestamp: new Date(point.timestamp).getTime(),
      time: new Date(point.timestamp).toLocaleTimeString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit' 
      }),
      actual: null,
      predicted: point.predicted,
      upper: point.upper,
      lower: point.lower,
      type: 'forecast'
    }));
    
    // Sort by timestamp
    return [...historical, ...forecast].sort((a, b) => a.timestamp - b.timestamp);
  }, [hasData, data]);

  const handleRunForecast = () => {
    runForecast({ forecastHours: 48 });
  };

  const handleRunLiveForecast = () => {
    runForecast({ useLiveData: true, forecastHours: 48 });
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!hasData) return null;
    
    const currentConsumption = data.historical[data.historical.length - 1]?.actual || 0;
    const avgForecast = data.forecast.reduce((sum, p) => sum + p.predicted, 0) / data.forecast.length;
    const maxForecast = Math.max(...data.forecast.map(p => p.predicted));
    const minForecast = Math.min(...data.forecast.map(p => p.predicted));
    
    return {
      currentConsumption: Math.round(currentConsumption * 100) / 100,
      avgForecast: Math.round(avgForecast * 100) / 100,
      maxForecast: Math.round(maxForecast * 100) / 100,
      minForecast: Math.round(minForecast * 100) / 100,
      trend: avgForecast > currentConsumption ? 'up' : 'down'
    };
  }, [hasData, data]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'actual' && entry.value && 
                `Actual: ${entry.value.toFixed(1)} kWh`
              }
              {entry.dataKey === 'predicted' && entry.value && 
                `Predicted: ${entry.value.toFixed(1)} kWh`
              }
              {entry.dataKey === 'upper' && entry.value && 
                `Upper bound: ${entry.value.toFixed(1)} kWh`
              }
              {entry.dataKey === 'lower' && entry.value && 
                `Lower bound: ${entry.value.toFixed(1)} kWh`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Energy Forecast
            </CardTitle>
            <CardDescription>
              AI-powered 48-hour energy consumption predictions
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleRunForecast}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Run Forecast
            </Button>
            
            <Button 
              onClick={handleRunLiveForecast}
              disabled={isLoading}
              size="sm"
              variant="default"
            >
              <Zap className="h-4 w-4 mr-2" />
              Live Data
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {lastRefresh && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last run: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          
          {trainingDuration > 0 && (
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Training: {trainingDuration}ms
            </div>
          )}
          
          {algorithm && (
            <Badge variant="secondary" className="text-xs">
              {algorithm}
            </Badge>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Forecast failed: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        )}

        {/* Stats Cards */}
        {hasData && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold">{stats.currentConsumption}</div>
              <div className="text-xs text-muted-foreground">Current (kWh)</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold flex items-center justify-center gap-1">
                {stats.avgForecast}
                {stats.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">Avg Forecast (kWh)</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold">{stats.maxForecast}</div>
              <div className="text-xs text-muted-foreground">Peak (kWh)</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold">{forecastHours}h</div>
              <div className="text-xs text-muted-foreground">Horizon</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {hasData && chartData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend fontSize={10} />
                
                {/* Confidence band */}
                <Area
                  dataKey="upper"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  connectNulls={false}
                />
                <Area
                  dataKey="lower"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                  connectNulls={false}
                />
                
                {/* Historical data */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  name="Historical"
                />
                
                {/* Forecast */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                  name="Forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasData && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No forecast data</p>
            <p className="text-sm mb-4">Click "Run Forecast" to generate energy predictions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}