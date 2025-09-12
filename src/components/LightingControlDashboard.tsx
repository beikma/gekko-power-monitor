import { Lightbulb, Palette, Power, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface LightingControlDashboardProps {
  data: any;  // Schema data with names
  status: any;  // Status data with current values
}

export default function LightingControlDashboard({ data, status }: LightingControlDashboardProps) {
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  
  // Extract lighting data - names from data, states from status
  const lightSchema = data?.lights || {};
  const lightStatus = status?.lights || {};
  const lightItems = Object.entries(lightStatus)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, light]: [string, any]) => {
      const values = light.sumstate?.value?.split(';') || [];
      const isOn = parseInt(values[0]) === 1;
      const brightness = parseFloat(values[1]) || 0;
      const colorValue = parseInt(values[2]) || 0;
      
      // Convert color value to RGB
      const r = (colorValue >> 16) & 0xFF;
      const g = (colorValue >> 8) & 0xFF;
      const b = colorValue & 0xFF;
      
      // Get the real name from the schema data
      const schemaData = lightSchema[key];
      const realName = schemaData?.name || `Light ${key.replace('item', '')}`;
      
      return {
        id: key,
        name: realName,
        isOn,
        brightness,
        color: colorValue > 0 ? { r, g, b } : null,
        hasColor: colorValue > 0,
        isDimmable: brightness > 0 && brightness < 100
      };
    })
    .filter(light => light.isOn || light.brightness > 0); // Only show active or recently used lights

  // Extract lighting groups
  const groups = Object.entries(lightStatus)
    .filter(([key]) => key.startsWith('group'))
    .map(([key, group]: [string, any]) => {
      // Groups don't have names in the API, so we'll use generic names
      const realName = `Zone ${key.replace('group', '')}`;
      return {
        id: key,
        name: realName,
        isOn: parseInt(group.sumstate?.value) === 1
      };
    });

  const activeLights = lightItems.filter(light => light.isOn).length;
  const totalLights = lightItems.length;
  const colorLights = lightItems.filter(light => light.hasColor).length;
  const dimmableLights = lightItems.filter(light => light.isDimmable).length;

  // Master toggle state - true if more than half the lights are on
  const allLightsOn = activeLights > totalLights / 2;

  const handleMasterToggle = async (checked: boolean) => {
    if (isToggling) return;
    
    console.log('Master toggle clicked:', checked, 'Current state:', allLightsOn);
    setIsToggling(true);
    
    try {
      toast({
        title: "Controlling Lights",
        description: `${checked ? 'Turning all lights on' : 'Turning all lights off'}...`,
      });

      console.log('Calling gekko-light-control function...');
      const { data: result, error } = await supabase.functions.invoke('gekko-light-control', {
        body: {
          action: 'toggle_all'
        }
      });

      console.log('Function response:', { result, error });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `All lights ${result.result.action === 'all_on' ? 'turned on' : 'turned off'}. ${result.result.lightsAffected} lights affected.`,
      });

      console.log('Light control result:', result);
      
    } catch (error) {
      console.error('Error controlling lights:', error);
      toast({
        title: "Error",
        description: "Failed to control lights. Please check the connection to your GEKKO system.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleLightToggle = async (lightId: string, currentState: boolean) => {
    console.log('Individual light toggle clicked:', lightId, 'Current state:', currentState);
    
    try {
      toast({
        title: "Controlling Light",
        description: `${currentState ? 'Turning off' : 'Turning on'} light...`,
      });

      console.log('Calling gekko-light-control function for individual light...');
      const { data: result, error } = await supabase.functions.invoke('gekko-light-control', {
        body: {
          action: 'toggle_light',
          lightId: lightId,
          value: currentState ? '1' : '0' // Send current state, function will toggle it
        }
      });

      console.log('Individual light response:', { result, error });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Light ${lightId} ${result.result.newState === '1' ? 'turned on' : 'turned off'}`,
      });

      console.log('Single light control result:', result);
      
    } catch (error) {
      console.error('Error controlling light:', error);
      toast({
        title: "Error",
        description: `Failed to control light ${lightId}. Please check the connection.`,
        variant: "destructive",
      });
    }
  };

  const getColorStyle = (color: {r: number, g: number, b: number} | null) => {
    if (!color) return {};
    return {
      backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      display: 'inline-block'
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Lighting Overview */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-energy-primary" />
            Lighting Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3 bg-energy-surface/50 rounded-lg border border-energy-border">
            <div className="flex items-center space-x-2">
              <Power className="h-4 w-4 text-energy-primary" />
              <Label htmlFor="master-toggle" className="font-medium">
                All Lights
              </Label>
            </div>
            <Switch
              id="master-toggle"
              checked={allLightsOn}
              onCheckedChange={handleMasterToggle}
              disabled={isToggling}
            />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-energy-text">{activeLights}</div>
            <div className="text-sm text-muted-foreground">Active Lights</div>
          </div>
          <Progress value={(activeLights / totalLights) * 100} className="h-2" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{totalLights}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active:</span>
              <span className="font-medium text-energy-success">{activeLights}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Color:</span>
              <span className="font-medium">{colorLights}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dimmable:</span>
              <span className="font-medium">{dimmableLights}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Control */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-energy-primary" />
            Zone Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-2 border border-energy-border rounded">
              <span className="font-medium">{group.name}</span>
              <Badge variant={group.isOn ? "default" : "secondary"}>
                {group.isOn ? "On" : "Off"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Color Lights */}
      {colorLights > 0 && (
        <Card className="energy-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-energy-primary" />
              Color Lights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lightItems
                .filter(light => light.hasColor && light.isOn)
                .slice(0, 5)
                .map((light) => (
                <div key={light.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={getColorStyle(light.color)}></div>
                    <span className="text-sm font-medium">{light.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{light.brightness.toFixed(0)}%</span>
                    <Badge variant="outline" className="text-xs">RGB</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Light Control */}
      <Card className="energy-card lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5 text-energy-primary" />
            Individual Light Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lightItems.map((light) => (
              <div key={light.id} className="p-3 border border-energy-border rounded-lg bg-energy-surface/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{light.name}</span>
                  <div className="flex items-center gap-2">
                    {light.hasColor && <div style={getColorStyle(light.color)}></div>}
                    <Badge variant={light.isOn ? "default" : "secondary"} className="text-xs">
                      {light.isOn ? "On" : "Off"}
                    </Badge>
                  </div>
                </div>
                
                {light.isOn && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Brightness:</span>
                      <span className="text-sm font-medium">{light.brightness.toFixed(0)}%</span>
                    </div>
                    <Progress value={light.brightness} className="h-1" />
                    
                    {light.hasColor && light.color && (
                      <div className="text-xs text-muted-foreground">
                        RGB: {light.color.r}, {light.color.g}, {light.color.b}
                      </div>
                    )}
                  </div>
                )}

                 <div className="flex gap-1 mt-2 justify-between">
                   <div className="flex gap-1">
                     {light.hasColor && <Badge variant="outline" className="text-xs">Color</Badge>}
                     {light.isDimmable && <Badge variant="outline" className="text-xs">Dim</Badge>}
                   </div>
                   <Switch
                     checked={light.isOn}
                     onCheckedChange={() => handleLightToggle(light.id, light.isOn)}
                     disabled={isToggling}
                   />
                 </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}