import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";

interface PowerCardProps {
  title: string;
  value: number | string;
  unit: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  isLoading?: boolean;
  className?: string;
}

export function PowerCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  isLoading = false,
  className,
}: PowerCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-energy-danger";
      case "down":
        return "text-energy-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-card shadow-card-custom transition-all duration-300 hover:shadow-energy hover:scale-105",
      className
    )}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 bg-muted/20 rounded animate-pulse" />
            <div className="h-4 bg-muted/20 rounded animate-pulse w-24" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {value}
              </span>
              <span className="text-sm text-muted-foreground mb-1">{unit}</span>
            </div>
            
            {trend && trendValue && (
              <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
                {getTrendIcon()}
                <span>{trendValue}</span>
              </div>
            )}
          </>
        )}
        
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-primary opacity-60" />
      </div>
    </Card>
  );
}