import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Zap, 
  Lightbulb, 
  Power,
  Settings,
  RefreshCw,
  Home
} from "lucide-react";
import { useGarageSocket } from "@/hooks/useGarageSocket";
import { useDirectGekkoApi } from "@/hooks/useDirectGekkoApi";
import { toast } from "sonner";

export function SimpleControlDashboard() {
  const { socket, isLoading: socketLoading, error: socketError, toggleSocket, refetch } = useGarageSocket();
  const { toggleLight, setLightDim, isLoading: lightLoading } = useDirectGekkoApi();
  const [refreshing, setRefreshing] = useState(false);
  const [dimLevel, setDimLevel] = useState([50]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleToggleSocket = async () => {
    try {
      await toggleSocket();
      toast.success(`Socket ${socket?.isOn ? 'turned off' : 'turned on'}`);
    } catch (error) {
      toast.error('Failed to toggle socket');
    }
  };

  const handleToggleLight = async (itemId: string, turnOn: boolean) => {
    try {
      await toggleLight(itemId, turnOn);
      toast.success(`Light ${turnOn ? 'turned on' : 'turned off'}`);
    } catch (error) {
      toast.error('Failed to toggle light');
    }
  };

  const handleDimLight = async (itemId: string, level: number) => {
    try {
      await setLightDim(itemId, level);
      toast.success(`Light dimmed to ${level}%`);
    } catch (error) {
      toast.error('Failed to dim light');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Device Control</h1>
          <p className="text-muted-foreground">Control your connected devices</p>
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
            onClick={() => window.location.href = '/configuration'}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Power Control Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-energy-primary" />
          Power Control
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Garage Socket */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Power className="h-4 w-4" />
                Garage Socket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socketLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ) : socketError ? (
                <div className="text-center py-4">
                  <p className="text-sm text-destructive mb-2">{socketError}</p>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={socket?.isOn ? "default" : "outline"}>
                      {socket?.isOn ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Power Control</span>
                    <Switch
                      checked={socket?.isOn || false}
                      onCheckedChange={handleToggleSocket}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>Location: {socket?.location || 'Garage'}</p>
                    <p>ID: {socket?.id || 'N/A'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Socket Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="h-4 w-4" />
                General Socket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">Available</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Power Control</span>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Location: Living Room</p>
                <p>Type: Standard Socket</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lighting Control Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-energy-warning" />
          Lighting Control
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Living Room Light */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4" />
                Living Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Power</span>
                <Switch 
                  defaultChecked={false}
                  onCheckedChange={(checked) => handleToggleLight('livingroom_light', checked)}
                  disabled={lightLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Brightness</span>
                  <span className="text-sm font-medium">{dimLevel[0]}%</span>
                </div>
                <Slider
                  value={dimLevel}
                  onValueChange={setDimLevel}
                  onValueCommit={(value) => handleDimLight('livingroom_light', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={lightLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Kitchen Light */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4" />
                Kitchen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Power</span>
                <Switch 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggleLight('kitchen_light', checked)}
                  disabled={lightLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Brightness</span>
                  <span className="text-sm font-medium">75%</span>
                </div>
                <Slider
                  value={[75]}
                  onValueCommit={(value) => handleDimLight('kitchen_light', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={lightLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bedroom Light */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4" />
                Bedroom
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Power</span>
                <Switch 
                  defaultChecked={false}
                  onCheckedChange={(checked) => handleToggleLight('bedroom_light', checked)}
                  disabled={lightLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Brightness</span>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <Slider
                  value={[30]}
                  onValueCommit={(value) => handleDimLight('bedroom_light', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={lightLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Lightbulb className="h-3 w-3" />
              All Lights On
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Lightbulb className="h-3 w-3" />
              All Lights Off
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Power className="h-3 w-3" />
              All Sockets On
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Power className="h-3 w-3" />
              All Sockets Off
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}