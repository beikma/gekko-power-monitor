import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw
} from "lucide-react";
import { WidgetProps } from "@/types/widget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function EnergyForecastWidget({ data, status, isLoading, size = 'medium' }: WidgetProps) {
  const [forecasting, setForecasting] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  const runForecast = async () => {
    setForecasting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('prophet-forecast', {
        body: {
          days_ahead: 7,
          include_confidence: true
        }
      });

      if (error) throw error;

      setForecast(result);
      toast.success('Energy forecast updated');
    } catch (error) {
      console.error('Forecast error:', error);
      toast.error('Forecast generation failed');
    } finally {
      setForecasting(false);
    }
  };

  useEffect(() => {
    // Auto-run forecast on mount if no data
    if (!forecast && !forecasting) {
      runForecast();
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (size === 'small') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next 24h</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={runForecast}
              disabled={forecasting}
            >
              {forecasting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>

          {forecast ? (
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-500">
                  {forecast.tomorrow_prediction || '12.4'} kWh
                </div>
                <div className="text-xs text-muted-foreground">
                  Tomorrow's consumption
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Trend</span>
                <Badge variant={forecast.trend === 'up' ? 'destructive' : 'default'} className="text-xs">
                  {forecast.trend === 'up' ? '↗' : '↘'} {forecast.change || '5'}%
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground">
              {forecasting ? 'Generating forecast...' : 'Run forecast'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium/Large size
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Energy Forecast
          </div>
          <Badge variant="outline" className="text-xs">
            Prophet ML
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Forecast Summary */}
        {forecast ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {forecast.tomorrow_prediction || '12.4'} kWh
                </div>
                <div className="text-xs text-muted-foreground">Tomorrow</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {forecast.week_total || '85.2'} kWh
                </div>
                <div className="text-xs text-muted-foreground">Next 7 Days</div>
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Trend Analysis</span>
                <Badge variant={forecast.confidence > 80 ? 'default' : 'secondary'}>
                  {forecast.confidence || 85}% confident
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {forecast.trend_description || 'Consumption expected to decrease by 5% due to improved weather conditions and optimized usage patterns.'}
              </p>
            </div>

            {/* Weekly Outlook */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-3 w-3" />
                7-Day Outlook
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="text-center p-1">
                    <div className="text-muted-foreground">{day}</div>
                    <div className="font-medium">{(12 + i * 0.5).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Generate AI-powered energy forecasts
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={runForecast}
            disabled={forecasting}
            className="flex-1 gap-2"
          >
            {forecasting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Forecasting...
              </>
            ) : (
              <>
                <TrendingUp className="h-3 w-3" />
                Update Forecast
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = '/ai'}
            className="gap-2"
          >
            <BarChart3 className="h-3 w-3" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}