import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Lightbulb, 
  Thermometer, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowRight,
  MessageSquare,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGekkoApi } from "@/hooks/useGekkoApi";
import { useEnergyReadings } from "@/hooks/useEnergyReadings";
import { useRecentAlarms } from "@/hooks/useRecentAlarms";
import { getRoomName } from '@/utils/roomMapping';

export function DashboardOverview() {
  const navigate = useNavigate();
  const { data, status, isLoading, connectionStatus } = useGekkoApi({
    refreshInterval: 30000
  });
  const { latestReading } = useEnergyReadings();
  const { alarms, activeAlarms, criticalAlarms } = useRecentAlarms(3);

  // Calculate quick stats
  const lights = data?.lights || {};
  const activeLights = Object.values(lights).filter((light: any) => 
    light.sumstate?.value?.split(';')[0] === '1'
  ).length;
  const totalLights = Object.keys(lights).filter(key => key.startsWith('item')).length;

  // Get first available room temperature with proper German name
  const firstRoomData = status?.roomtemps?.item1;
  const firstRoomName = getRoomName('item1', firstRoomData?.name);
  const temperature = firstRoomData?.sumstate?.value?.split(';')[0];
  const targetTemp = firstRoomData?.sumstate?.value?.split(';')[1];

  const alarmStatus = status?.globals?.alarm?.sumstate?.value;
  const isAlarmActive = alarmStatus === '1' || alarmStatus === '3';

  const quickStats = [
    {
      title: "Energy Consumption",
      value: latestReading?.current_power ? `${latestReading.current_power.toFixed(1)} kW` : "0.0 kW",
      description: "Current power usage",
      trend: latestReading?.current_power > 2 ? "up" : "down",
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/energy"
    },
    {
      title: "Active Lights",
      value: `${activeLights}/${totalLights}`,
      description: "Lights currently on",
      trend: activeLights > totalLights / 2 ? "up" : "down",
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      href: "/lighting"
    },
    {
      title: "Temperature",
      value: temperature ? `${parseFloat(temperature).toFixed(1)}°C` : "N/A",
      description: targetTemp ? `Target: ${parseFloat(targetTemp).toFixed(1)}°C` : "Room temperature",
      trend: temperature && targetTemp ? (parseFloat(temperature) < parseFloat(targetTemp) ? "down" : "up") : "neutral",
      icon: Thermometer,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/climate"
    },
    {
      title: "Security Status",
      value: isAlarmActive ? "Alert" : "Secure",
      description: isAlarmActive ? "Attention required" : "All systems normal",
      trend: isAlarmActive ? "alert" : "secure",
      icon: Shield,
      color: isAlarmActive ? "text-red-600" : "text-green-600",
      bgColor: isAlarmActive ? "bg-red-50" : "bg-green-50",
      href: "/security"
    }
  ];

  const systemStatus = [
    {
      name: "myGEKKO Connection",
      status: connectionStatus === 'connected' ? 'online' : 'offline',
      description: connectionStatus === 'connected' ? 'Real-time data streaming' : 'Connection issues detected'
    },
    {
      name: "Energy Monitoring",
      status: latestReading ? 'active' : 'inactive',
      description: latestReading ? 'Data collection active' : 'No recent data'
    },
    {
      name: "Building Systems",
      status: !isLoading ? 'operational' : 'loading',
      description: !isLoading ? 'All systems responding' : 'Checking status...'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "alert": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "secure": return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      online: "default",
      active: "default", 
      operational: "default",
      offline: "destructive",
      inactive: "secondary",
      loading: "secondary"
    };
    
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(stat.href)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                {getTrendIcon(stat.trend)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Real-time status of all building management systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemStatus.map((system) => (
              <div key={system.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{system.name}</h3>
                  <p className="text-sm text-muted-foreground">{system.description}</p>
                </div>
                {getStatusBadge(system.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alarms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alarms
          </CardTitle>
          <CardDescription>
            Latest system alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alarms.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent alarms</p>
              <p className="text-xs">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alarms.map((alarm) => (
                <div key={alarm.id} className="flex items-center gap-3 p-3 border rounded-lg">
                   <div className="flex-shrink-0">
                     {!alarm.resolved ? (
                       <AlertTriangle className="h-4 w-4 text-red-500" />
                     ) : (
                       <CheckCircle className="h-4 w-4 text-green-500" />
                     )}
                   </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alarm.description}</p>
                     <div className="flex items-center gap-2 mt-1">
                       <Badge 
                         variant={
                           alarm.priority === 'critical' || alarm.priority === 'high' || alarm.priority === '1'
                             ? 'destructive' 
                             : alarm.priority === 'medium' || alarm.priority === '2'
                             ? 'default' 
                             : 'secondary'
                         } 
                         className="text-xs"
                       >
                         {alarm.priority}
                       </Badge>
                       <span className="text-xs text-muted-foreground">
                         {new Date(alarm.timestamp).toLocaleTimeString()}
                       </span>
                     </div>
                  </div>
                </div>
              ))}
              {activeAlarms.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Alarms:</span>
                    <Badge variant="destructive">{activeAlarms.length}</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and system controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/lighting')}>
              <Lightbulb className="h-6 w-6" />
              <span>Control Lighting</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/energy')}>
              <Zap className="h-6 w-6" />
              <span>Energy Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/climate')}>
              <Thermometer className="h-6 w-6" />
              <span>Climate Control</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/garage')}>
              <Home className="h-6 w-6" />
              <span>Garage Socket</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/teams')}>
                <MessageSquare className="h-6 w-6" />
                <span>Teams Integration</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}