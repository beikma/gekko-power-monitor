import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  MapPin, 
  Users, 
  Calendar,
  Thermometer,
  Zap,
  Wifi,
  Settings
} from "lucide-react";
import { WidgetProps } from "@/types/widget";

export function BuildingInfoWidget({ data, status, isLoading, size = 'small' }: WidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded"></div>
            {size !== 'small' && (
              <>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock building data - in real implementation, this would come from myGEKKO building profile
  const buildingData = {
    name: status?.building?.name || "Smart Home",
    address: status?.building?.address || "123 Smart Street, Tech City",
    type: status?.building?.type || "Residential",
    yearBuilt: status?.building?.yearBuilt || 2020,
    area: status?.building?.area || 180,
    rooms: status?.building?.rooms || 6,
    floors: status?.building?.floors || 2,
    energyClass: status?.building?.energyClass || "A+",
    lastMaintenance: status?.building?.lastMaintenance || "2024-01-15",
    gekkoId: status?.gekkoId || "K999-7UOZ-8ZYZ-6TH3",
    connectionStatus: status?.connection?.status || "online"
  };

  const getEnergyClassColor = (energyClass: string) => {
    const classColors = {
      'A+': 'bg-green-500',
      'A': 'bg-green-400',
      'B': 'bg-yellow-400',
      'C': 'bg-orange-400',
      'D': 'bg-red-400'
    };
    return classColors[energyClass as keyof typeof classColors] || 'bg-gray-400';
  };

  if (size === 'small') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-energy-secondary" />
            Building Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Building Image Placeholder */}
          <div className="h-20 bg-gradient-to-br from-energy-primary/20 to-energy-secondary/20 rounded-lg flex items-center justify-center">
            <Building className="h-8 w-8 text-energy-primary" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{buildingData.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Energy Class</span>
              <Badge className={`text-xs text-white ${getEnergyClassColor(buildingData.energyClass)}`}>
                {buildingData.energyClass}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge variant={buildingData.connectionStatus === 'online' ? 'default' : 'destructive'} className="text-xs">
                <Wifi className="h-2 w-2 mr-1" />
                {buildingData.connectionStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Medium/Large size
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-energy-secondary" />
            Building Profile
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/building'}>
            <Settings className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Building Image */}
        <div className="h-32 bg-gradient-to-br from-energy-primary/20 to-energy-secondary/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          <Building className="h-12 w-12 text-energy-primary" />
          <div className="absolute bottom-2 right-2">
            <Badge className={`text-xs text-white ${getEnergyClassColor(buildingData.energyClass)}`}>
              {buildingData.energyClass}
            </Badge>
          </div>
        </div>

        {/* Building Details */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{buildingData.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{buildingData.address}</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Type</p>
              <p className="font-semibold">{buildingData.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Built</p>
              <p className="font-semibold">{buildingData.yearBuilt}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Area</p>
              <p className="font-semibold">{buildingData.area}m²</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Rooms</p>
              <p className="font-semibold">{buildingData.rooms}</p>
            </div>
          </div>

          {/* System Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GEKKO ID</span>
              <span className="font-mono text-xs">{buildingData.gekkoId}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Connection</span>
              <Badge variant={buildingData.connectionStatus === 'online' ? 'default' : 'destructive'} className="text-xs">
                <Wifi className="h-2 w-2 mr-1" />
                {buildingData.connectionStatus}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => window.location.href = '/building'}
            >
              <Settings className="h-3 w-3" />
              Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => window.location.href = '/configuration'}
            >
              <Zap className="h-3 w-3" />
              Setup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}