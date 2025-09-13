import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplets, Wind } from "lucide-react";
import { WidgetProps } from "@/types/widget";

export function ClimateWidget({ data, status, isLoading, size = 'small' }: WidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Extract climate data
  const temperature = status?.climate?.temperature || data?.temperature || 21;
  const humidity = status?.climate?.humidity || data?.humidity || 45;
  const airQuality = status?.climate?.airQuality || 'Good';

  const getTemperatureColor = (temp: number) => {
    if (temp < 18) return 'text-blue-400';
    if (temp > 24) return 'text-red-400';
    return 'text-energy-success';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Thermometer className="h-4 w-4 text-energy-secondary" />
          Climate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Temperature</span>
          <span className={`text-xl font-bold ${getTemperatureColor(temperature)}`}>
            {temperature}°C
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-blue-400" />
            <span className="text-muted-foreground text-sm">Humidity</span>
          </div>
          <span className="font-semibold">{humidity}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Wind className="h-3 w-3 text-green-400" />
            <span className="text-muted-foreground text-sm">Air Quality</span>
          </div>
          <span className="font-semibold text-energy-success">{airQuality}</span>
        </div>
      </CardContent>
    </Card>
  );
}