import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Thermometer, 
  Shield, 
  AlertTriangle, 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw,
  Building,
  MapPin,
  Wifi
} from "lucide-react";
import { useGekkoApi } from "@/hooks/useGekkoApi";

export function SimpleWidgetDashboard() {
  const { data, status, isLoading, error, connectionStatus, refetch } = useGekkoApi({ refreshInterval: 30000 });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleOpenConfiguration = () => {
    window.location.href = '/configuration';
  };

  // Extract real data from myGEKKO API
  const powerData = {
    consumption: data?.power?.consumption || 0,
    solar: data?.power?.solar || 0,
    battery: data?.power?.battery || 0,
    grid: (data?.power?.consumption || 0) - (data?.power?.solar || 0)
  };

  const climateData = {
    temperature: status?.temperature || 21,
    humidity: status?.humidity || 45
  };

  const securityData = {
    status: status?.security?.status || 'armed',
    alarms: status?.alarms?.length || 0
  };

  const lightingData = {
    active: status?.lighting?.active || 3,
    total: status?.lighting?.total || 12
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Smart Home Dashboard</h1>
            <Badge variant="destructive" className="text-xs mt-1">Connection Error</Badge>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleOpenConfiguration} variant="outline">
            Check Configuration
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Home Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>
            {data && (
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenConfiguration}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Energy Overview Widget */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-energy-primary" />
              Energy Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-muted rounded"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant={powerData.solar > powerData.consumption ? "default" : "secondary"} className="text-xs">
                    {powerData.solar > powerData.consumption ? (
                      <>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Producing
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Consuming
                      </>
                    )}
                  </Badge>
                  <span className="text-2xl font-bold text-energy-primary">
                    {Math.abs(powerData.solar - powerData.consumption).toFixed(1)}kW
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Solar Generation</p>
                    <p className="font-semibold text-energy-success">{powerData.solar.toFixed(1)}kW</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Consumption</p>
                    <p className="font-semibold">{powerData.consumption.toFixed(1)}kW</p>
                  </div>
                  {powerData.battery > 0 && (
                    <>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Battery</p>
                        <p className="font-semibold text-energy-warning">{powerData.battery}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Grid</p>
                        <p className="font-semibold">{powerData.grid > 0 ? `+${powerData.grid.toFixed(1)}` : powerData.grid.toFixed(1)}kW</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Climate Widget */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Thermometer className="h-4 w-4 text-energy-secondary" />
              Climate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className="text-xl font-bold text-energy-success">
                    {climateData.temperature}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Humidity</span>
                  <span className="font-semibold">{climateData.humidity}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Widget */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-energy-success" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={securityData.alarms > 0 ? "destructive" : "default"} className="text-xs">
                    {securityData.alarms > 0 ? `${securityData.alarms} Alert${securityData.alarms > 1 ? 's' : ''}` : 'Armed'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Doors Locked</span>
                  <span className="font-semibold">3/3</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Lighting Widget */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-energy-warning" />
              Lighting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Lights</span>
                  <span className="text-xl font-bold text-energy-warning">
                    {lightingData.active}/{lightingData.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Auto Mode</span>
                  <Badge variant="outline" className="text-xs">
                    Disabled
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Building Info Widget - Small */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4 text-energy-secondary" />
              Building Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ) : (
              <>
                <div className="h-16 bg-gradient-to-br from-energy-primary/20 to-energy-secondary/20 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-energy-primary" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">Smart Home</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Energy Class</span>
                    <Badge className="text-xs text-white bg-green-500">
                      A+
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
                      <Wifi className="h-2 w-2 mr-1" />
                      {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = '/energy'}>
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-energy-primary" />
            <div>
              <h3 className="font-semibold">Energy Details</h3>
              <p className="text-sm text-muted-foreground">View detailed energy analytics</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = '/control'}>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-energy-secondary" />
            <div>
              <h3 className="font-semibold">Device Control</h3>
              <p className="text-sm text-muted-foreground">Control connected devices</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={handleOpenConfiguration}>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-energy-success" />
            <div>
              <h3 className="font-semibold">Configuration</h3>
              <p className="text-sm text-muted-foreground">Setup and preferences</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}