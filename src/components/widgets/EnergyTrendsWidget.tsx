import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap, Battery, Sun } from "lucide-react";
import { WidgetProps } from "@/types/widget";

export function EnergyTrendsWidget({ data, status, isLoading, size = 'large' }: WidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock trend data - in real implementation, this would come from time-series data
  const trends = {
    consumption: { value: 12.4, change: -5.2, trend: 'down' },
    generation: { value: 8.7, change: 12.1, trend: 'up' },
    efficiency: { value: 87, change: 2.3, trend: 'up' }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="h-3 w-3 text-energy-success" /> : 
      <TrendingDown className="h-3 w-3 text-energy-danger" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-energy-success' : 'text-energy-danger';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-energy-primary" />
          Energy Trends (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Sun className="h-4 w-4 text-energy-warning" />
              <span className="text-xs text-muted-foreground">Generation</span>
            </div>
            <div className="text-lg font-bold">{trends.generation.value}kWh</div>
            <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trends.generation.trend)}`}>
              {getTrendIcon(trends.generation.trend)}
              {Math.abs(trends.generation.change)}%
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Zap className="h-4 w-4 text-energy-primary" />
              <span className="text-xs text-muted-foreground">Usage</span>
            </div>
            <div className="text-lg font-bold">{trends.consumption.value}kWh</div>
            <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trends.consumption.trend)}`}>
              {getTrendIcon(trends.consumption.trend)}
              {Math.abs(trends.consumption.change)}%
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Battery className="h-4 w-4 text-energy-secondary" />
              <span className="text-xs text-muted-foreground">Efficiency</span>
            </div>
            <div className="text-lg font-bold">{trends.efficiency.value}%</div>
            <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trends.efficiency.trend)}`}>
              {getTrendIcon(trends.efficiency.trend)}
              {Math.abs(trends.efficiency.change)}%
            </div>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge variant={trends.efficiency.value > 85 ? "default" : "secondary"} className="text-xs">
            {trends.efficiency.value > 85 ? 'Excellent' : trends.efficiency.value > 70 ? 'Good' : 'Needs Improvement'} Performance
          </Badge>
        </div>

        {/* Simple trend visualization placeholder */}
        <div className="h-16 bg-gradient-to-r from-energy-primary/10 via-energy-secondary/10 to-energy-success/10 rounded-lg flex items-end justify-center p-2">
          <span className="text-xs text-muted-foreground">Trend visualization area</span>
        </div>
      </CardContent>
    </Card>
  );
}