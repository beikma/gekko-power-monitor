import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { WidgetProps } from "@/types/widget";

export function EnergyOverviewWidget({ data, status, isLoading, size = 'medium' }: WidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract energy data from status
  const powerConsumption = status?.power?.consumption || 0;
  const solarGeneration = status?.power?.solar || 0;
  const batteryLevel = status?.power?.battery || 0;
  const gridPower = powerConsumption - solarGeneration;
  
  const netFlow = solarGeneration - powerConsumption;
  const isProducing = netFlow > 0;
  const isConsuming = netFlow < 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-energy-primary" />
          Energy Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={isProducing ? "default" : isConsuming ? "secondary" : "outline"} className="text-xs">
            {isProducing && <TrendingUp className="h-3 w-3 mr-1" />}
            {isConsuming && <TrendingDown className="h-3 w-3 mr-1" />}
            {!isProducing && !isConsuming && <Minus className="h-3 w-3 mr-1" />}
            {isProducing ? 'Producing' : isConsuming ? 'Consuming' : 'Balanced'}
          </Badge>
          <span className="text-2xl font-bold text-energy-primary">
            {Math.abs(netFlow).toFixed(1)}kW
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Solar</p>
            <p className="font-semibold text-energy-success">{solarGeneration.toFixed(1)}kW</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Usage</p>
            <p className="font-semibold">{powerConsumption.toFixed(1)}kW</p>
          </div>
          {batteryLevel > 0 && (
            <>
              <div className="space-y-1">
                <p className="text-muted-foreground">Battery</p>
                <p className="font-semibold text-energy-warning">{batteryLevel}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Grid</p>
                <p className="font-semibold">{gridPower > 0 ? `+${gridPower.toFixed(1)}` : gridPower.toFixed(1)}kW</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}