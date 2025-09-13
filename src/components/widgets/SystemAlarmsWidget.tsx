import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { WidgetProps } from "@/types/widget";
import { useRecentAlarms } from "@/hooks/useRecentAlarms";

export function SystemAlarmsWidget({ size = 'medium' }: WidgetProps) {
  const { alarms, isLoading } = useRecentAlarms();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAlarms = alarms.filter(alarm => alarm.status === 'active');
  const hasActiveAlarms = activeAlarms.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {hasActiveAlarms ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-energy-success" />
          )}
          System Alarms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasActiveAlarms ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Alerts</span>
              <Badge variant="destructive" className="text-xs">
                {activeAlarms.length}
              </Badge>
            </div>
            {size !== 'small' && (
              <div className="space-y-1">
                {activeAlarms.slice(0, 3).map((alarm, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Bell className="h-3 w-3 text-destructive flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {alarm.description || `Alarm ${alarm.id}`}
                    </span>
                  </div>
                ))}
                {activeAlarms.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{activeAlarms.length - 3} more alerts
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-energy-success font-medium">All systems normal</p>
            <p className="text-xs text-muted-foreground">No active alarms</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}