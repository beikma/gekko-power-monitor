import { Shield, AlertTriangle, CheckCircle, Bell, Activity, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecuritySystemDashboardProps {
  data: any;
}

export default function SecuritySystemDashboard({ data }: SecuritySystemDashboardProps) {
  // Extract alarm system status
  const alarmSystem = data?.globals?.alarm?.sumstate?.value;
  const systemStatus = parseInt(alarmSystem) || 3; // 3 = Normal

  // Extract alarm logics (sensors and monitoring)
  const alarmLogics = data?.alarms_logics || {};
  const sensors = Object.entries(alarmLogics)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, sensor]: [string, any]) => {
      const values = sensor.sumstate?.value?.split(';') || [];
      return {
        id: key,
        name: `Sensor ${key.replace('item', '')}`,
        value1: parseFloat(values[0]) || 0,
        value2: parseFloat(values[1]) || 0,
        value3: parseFloat(values[2]) || 0,
        threshold1: parseFloat(values[6]) || 0,
        threshold2: parseFloat(values[21]) || 0,
        isActive: Math.abs(parseFloat(values[0]) || 0) > 0.1,
        isAlert: Math.abs(parseFloat(values[0]) || 0) > 100
      };
    })
    .filter(sensor => sensor.isActive);

  // Extract blinds/shutters status for security
  const blinds = data?.blinds || {};
  const shutterItems = Object.entries(blinds)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, blind]: [string, any]) => {
      const values = blind.sumstate?.value?.split(';') || [];
      return {
        id: key,
        name: `Shutter ${key.replace('item', '')}`,
        position: parseFloat(values[1]) || 0,
        isOpen: parseFloat(values[1]) > 50,
        isClosed: parseFloat(values[1]) < 10,
        angle: parseInt(values[4]) || 0
      };
    });

  const getSystemStatusInfo = (status: number) => {
    switch (status) {
      case 1: return { label: 'Armed', variant: 'destructive' as const, icon: Shield };
      case 2: return { label: 'Partial', variant: 'default' as const, icon: Eye };
      case 3: return { label: 'Disarmed', variant: 'secondary' as const, icon: CheckCircle };
      default: return { label: 'Unknown', variant: 'outline' as const, icon: AlertTriangle };
    }
  };

  const statusInfo = getSystemStatusInfo(systemStatus);
  const activeSensors = sensors.filter(s => s.isActive).length;
  const alertSensors = sensors.filter(s => s.isAlert).length;
  const openShutters = shutterItems.filter(s => s.isOpen).length;
  const closedShutters = shutterItems.filter(s => s.isClosed).length;

  const StatusIcon = statusInfo.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Security Status Overview */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5 text-energy-primary" />
            Security System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant={statusInfo.variant} className="text-lg px-4 py-2">
              {statusInfo.label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-energy-primary">{activeSensors}</div>
              <div className="text-xs text-muted-foreground">Active Sensors</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-energy-warning">{alertSensors}</div>
              <div className="text-xs text-muted-foreground">Alert Sensors</div>
            </div>
          </div>

          {alertSensors > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {alertSensors} sensor(s) showing alert conditions
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Perimeter Security */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-energy-primary" />
            Perimeter Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-energy-success">{closedShutters}</div>
              <div className="text-xs text-muted-foreground">Closed Shutters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-energy-warning">{openShutters}</div>
              <div className="text-xs text-muted-foreground">Open Shutters</div>
            </div>
          </div>

          <div className="space-y-2">
            {shutterItems.slice(0, 5).map((shutter) => (
              <div key={shutter.id} className="flex items-center justify-between p-2 border border-energy-border rounded">
                <span className="text-sm font-medium">{shutter.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{shutter.position.toFixed(0)}%</span>
                  <Badge variant={shutter.isClosed ? "default" : shutter.isOpen ? "secondary" : "outline"}>
                    {shutter.isClosed ? "Closed" : shutter.isOpen ? "Open" : "Partial"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Monitoring */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-energy-primary" />
            Sensor Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sensors.slice(0, 6).map((sensor) => (
              <div key={sensor.id} className="p-2 border border-energy-border rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{sensor.name}</span>
                  <Badge variant={sensor.isAlert ? "destructive" : sensor.isActive ? "default" : "secondary"}>
                    {sensor.isAlert ? "Alert" : sensor.isActive ? "Active" : "Idle"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Val: {sensor.value1.toFixed(1)}</div>
                  <div>Thr: {sensor.threshold1.toFixed(1)}</div>
                  <div>Ch2: {sensor.value2.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sensor Data */}
      <Card className="energy-card lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-energy-primary" />
            Detailed Sensor Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-energy-border">
                  <th className="text-left p-2">Sensor</th>
                  <th className="text-right p-2">Primary Value</th>
                  <th className="text-right p-2">Secondary Value</th>
                  <th className="text-right p-2">Tertiary Value</th>
                  <th className="text-right p-2">Threshold 1</th>
                  <th className="text-right p-2">Threshold 2</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => (
                  <tr key={sensor.id} className="border-b border-energy-border/50 hover:bg-energy-surface/30">
                    <td className="p-2 font-medium">{sensor.name}</td>
                    <td className="p-2 text-right font-mono">{sensor.value1.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{sensor.value2.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{sensor.value3.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{sensor.threshold1.toFixed(1)}</td>
                    <td className="p-2 text-right font-mono">{sensor.threshold2.toFixed(1)}</td>
                    <td className="p-2 text-center">
                      <Badge 
                        variant={sensor.isAlert ? "destructive" : sensor.isActive ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {sensor.isAlert ? "Alert" : sensor.isActive ? "Active" : "Normal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sensors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active sensors detected
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}