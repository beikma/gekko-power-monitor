import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Unlock, AlertTriangle } from "lucide-react";
import { WidgetProps } from "@/types/widget";

export function SecurityStatusWidget({ data, status, isLoading, size = 'small' }: WidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-6 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Extract security data
  const securityStatus = status?.security?.status || data?.security || 'armed';
  const activeAlarms = status?.alarms?.active || 0;
  const doorsLocked = status?.security?.doors?.locked || 3;
  const totalDoors = status?.security?.doors?.total || 3;

  const getStatusIcon = () => {
    if (activeAlarms > 0) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (securityStatus === 'armed') return <Shield className="h-4 w-4 text-energy-success" />;
    if (securityStatus === 'disarmed') return <Shield className="h-4 w-4 text-energy-warning" />;
    return <Shield className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusVariant = () => {
    if (activeAlarms > 0) return 'destructive';
    if (securityStatus === 'armed') return 'default';
    if (securityStatus === 'disarmed') return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getStatusIcon()}
          Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={getStatusVariant()} className="text-xs">
            {activeAlarms > 0 ? `${activeAlarms} Alert${activeAlarms > 1 ? 's' : ''}` : 
             securityStatus.charAt(0).toUpperCase() + securityStatus.slice(1)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-energy-success" />
            <span className="text-muted-foreground text-sm">Doors</span>
          </div>
          <span className="font-semibold">{doorsLocked}/{totalDoors}</span>
        </div>
      </CardContent>
    </Card>
  );
}