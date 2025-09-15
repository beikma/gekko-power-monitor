import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, 
  Thermometer, 
  Lightbulb, 
  Zap, 
  Shield, 
  BarChart3,
  Settings
} from "lucide-react";
import ClimateControlDashboard from "./ClimateControlDashboard";
import LightingControlDashboard from "./LightingControlDashboard";
import EnergyDetailsDashboard from "./EnergyDetailsDashboard";
import SecuritySystemDashboard from "./SecuritySystemDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoomName } from '@/utils/roomMapping';

interface SmartHomeDashboardProps {
  data: any;
  status: any;
  isLoading: boolean;
  error: string | null;
  refetch?: () => void;
}

export default function SmartHomeDashboard({ 
  data, 
  status, 
  isLoading, 
  error,
  refetch
}: SmartHomeDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Quick stats for overview
  const getQuickStats = () => {
    if (!data || !status) return null;

    // Lights
    const lights = status?.lights || {};
    const activeLights = Object.entries(lights)
      .filter(([key, light]: [string, any]) => 
        key.startsWith('item') && parseInt(light.sumstate?.value?.split(';')[0]) === 1
      ).length;

    // Room temperatures with proper German names
    const roomTemps = status?.roomtemps || {};
    const rooms = Object.entries(roomTemps)
      .filter(([key]) => key.startsWith('item'))
      .map(([key, room]: [string, any]) => {
        const values = room.sumstate?.value?.split(';') || [];
        const temp = parseFloat(values[0]) || 0;
        const roomName = getRoomName(key, room.name);
        return { name: roomName, temp };
      })
      .filter(room => room.temp > 0);
    
    const avgTemp = rooms.length > 0 ? 
      rooms.reduce((sum, room) => sum + room.temp, 0) / rooms.length : 0;

    // Energy meters
    const energyCosts = status?.energycosts || {};
    const totalPower = Object.entries(energyCosts)
      .filter(([key]) => key.startsWith('item'))
      .reduce((sum, [, meter]: [string, any]) => {
        const values = meter.sumstate?.value?.split(';') || [];
        return sum + (parseFloat(values[0]) || 0);
      }, 0);

    // Security status
    const securityStatus = parseInt(status?.globals?.alarm?.sumstate?.value) || 3;

    return {
      activeLights,
      avgTemp,
      totalPower,
      securityStatus,
      totalRooms: rooms.length
    };
  };

  const stats = getQuickStats();

  const getSecurityBadge = (status: number) => {
    switch (status) {
      case 1: return <Badge variant="destructive">Armed</Badge>;
      case 2: return <Badge variant="default">Partial</Badge>;
      case 3: return <Badge variant="secondary">Disarmed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="energy-card">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted/20 rounded animate-pulse" />
                <div className="h-8 bg-muted/20 rounded animate-pulse" />
                <div className="h-3 bg-muted/20 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="climate" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <span className="hidden sm:inline">Climate</span>
          </TabsTrigger>
          <TabsTrigger value="lighting" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Lighting</span>
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Energy</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 hidden lg:flex">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="energy-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lighting</p>
                    <p className="text-2xl font-bold">{stats?.activeLights || 0}</p>
                    <p className="text-xs text-muted-foreground">lights active</p>
                  </div>
                  <Lightbulb className="h-8 w-8 text-energy-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="energy-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="text-2xl font-bold">{stats?.avgTemp?.toFixed(1) || 'N/A'}°C</p>
                    <p className="text-xs text-muted-foreground">{stats?.totalRooms || 0} rooms avg</p>
                  </div>
                  <Thermometer className="h-8 w-8 text-energy-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="energy-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="text-2xl font-bold">{stats?.totalPower?.toFixed(1) || '0'}</p>
                    <p className="text-xs text-muted-foreground">kW total</p>
                  </div>
                  <Zap className="h-8 w-8 text-energy-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="energy-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Security</p>
                    <div className="mt-1">
                      {stats && getSecurityBadge(stats.securityStatus)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">system status</p>
                  </div>
                  <Shield className="h-8 w-8 text-energy-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="energy-card cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("climate")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-energy-primary" />
                  Climate Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor and control heating, ventilation, and room temperatures across your building.
                </p>
              </CardContent>
            </Card>

            <Card className="energy-card cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("lighting")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-energy-primary" />
                  Lighting Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Control lights, brightness, colors, and lighting zones throughout your property.
                </p>
              </CardContent>
            </Card>

            <Card className="energy-card cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("energy")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-energy-primary" />
                  Energy Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed energy consumption, costs, and load management across all meters.
                </p>
              </CardContent>
            </Card>

            <Card className="energy-card cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("security")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-energy-primary" />
                  Security System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor alarms, sensors, shutters, and overall building security status.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="climate" className="mt-6">
          <ClimateControlDashboard data={status} refetch={refetch} />
        </TabsContent>

        <TabsContent value="lighting" className="mt-6">
          <LightingControlDashboard data={data} status={status} refetch={refetch} />
        </TabsContent>

        <TabsContent value="energy" className="mt-6">
          <EnergyDetailsDashboard data={status} refetch={refetch} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySystemDashboard data={status} refetch={refetch} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-energy-primary" />
                    ML Analysis Dashboard
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Advanced machine learning analysis of your energy consumption patterns.
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-energy-primary" />
                    AI Energy Insights
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-powered recommendations for energy optimization and cost savings.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-energy-primary" />
                    Predictive Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Forecast future energy consumption and predict maintenance needs.
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-energy-primary" />
                    Solar & Weather Forecasts
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Advanced forecasting for solar generation and weather impact analysis.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Switch to main dashboard to access full AI/ML functionality panels
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}