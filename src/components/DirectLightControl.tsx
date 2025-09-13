import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useDirectGekkoApi } from '@/hooks/useDirectGekkoApi';
import { Lightbulb, Palette, Gauge, Zap, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DirectLightControl() {
  const { toggleLight, setLightDim, setLightColor, testAllEndpoints, isLoading, error, credentials } = useDirectGekkoApi();
  
  const [selectedItem, setSelectedItem] = useState('item0');
  const [lightState, setLightState] = useState(false);
  const [dimLevel, setDimLevel] = useState([100]);
  const [colorValue, setColorValue] = useState('#ffffff');

  const commonLightItems = [
    { id: 'item0', name: 'Küche Spots', page: 'Küche' },
    { id: 'item1', name: 'Ambientebeleuchtung Essen', page: 'Esszimmer' },
    { id: 'item2', name: 'Esstisch', page: 'Esszimmer' },
    { id: 'item3', name: 'Wohnzimmer ind.', page: 'Wohnzimmer' },
    { id: 'item4', name: 'Eingangslicht', page: 'EG' },
    { id: 'item5', name: 'Treppenhaus', page: 'EG' },
    { id: 'item6', name: 'Aussenbeleuchtung Nord', page: 'Garten' },
    { id: 'item7', name: 'Balkon Schlafzimmer', page: 'Schlafzimmer' },
    { id: 'item8', name: 'Schlafzimmer', page: 'Schlafzimmer' },
    { id: 'item9', name: 'Kinderzimmer', page: 'Kinderzimmer' }
  ];

  const handleToggle = async (checked: boolean) => {
    setLightState(checked);
    const result = await toggleLight(selectedItem, checked);
    if (result.success) {
      console.log(`Light toggle successful via ${result.method}:`, result.response);
    }
  };

  const handleDimChange = async (value: number[]) => {
    const newLevel = value[0];
    setDimLevel([newLevel]);
    
    // Turn on the light first if dimming and it's off
    if (newLevel > 0 && !lightState) {
      setLightState(true);
      await toggleLight(selectedItem, true);
    }
    
    const result = await setLightDim(selectedItem, newLevel);
    if (result.success) {
      console.log(`Light dim successful via ${result.method}:`, result.response);
    }
  };

  const handleColorChange = async () => {
    const result = await setLightColor(selectedItem, colorValue);
    if (result.success) {
      console.log(`Light color successful via ${result.method}:`, result.response);
    }
  };

  const testApiEndpoints = async () => {
    const results = await testAllEndpoints(selectedItem);
    console.log('All endpoint test results:', results);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Direct MyGekko Light Control
        </CardTitle>
        <CardDescription>
          MyGekko light control via Supabase gekko-proxy (bypasses CORS)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Info */}
        <div className="p-3 bg-muted rounded-lg text-sm">
          <div className="font-semibold flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4" />
            API Configuration
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div>Username: {credentials.username}</div>
            <div>Gekko ID: {credentials.gekkoId}</div>
            <div>API Key: {credentials.apiKey.substring(0, 8)}...</div>
            <div className="text-xs text-green-600">✓ Using gekko-proxy (no CORS issues)</div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Light Selection */}
        <div className="space-y-2">
          <Label htmlFor="light-select">Select Light</Label>
          <select
            id="light-select"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            {commonLightItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.page})
              </option>
            ))}
          </select>
          
          <div className="text-xs text-muted-foreground">
            Currently selected: {selectedItem}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => testAllEndpoints(selectedItem)}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Test All Endpoints
          </Button>
          
          <Button
            onClick={() => handleToggle(!lightState)}
            variant={lightState ? "default" : "secondary"}
            disabled={isLoading}
            className="gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            {lightState ? 'Turn Off' : 'Turn On'}
          </Button>
        </div>

        {/* On/Off Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="font-medium">Light Power</span>
          </div>
          <Switch
            checked={lightState}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {/* Dimming Control */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <span className="font-medium">Brightness</span>
            </div>
            <span className="text-sm font-mono">{dimLevel[0]}%</span>
          </div>
          <Slider
            value={dimLevel}
            onValueChange={handleDimChange}
            max={100}
            step={1}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Color Control */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="font-medium">Color Control</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="color"
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value)}
              className="w-20 h-10 p-1 border rounded cursor-pointer"
              disabled={isLoading}
            />
            <Input
              type="text"
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleColorChange}
              disabled={isLoading}
              size="sm"
            >
              Set Color
            </Button>
          </div>
        </div>

        {/* API Test Commands */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Test Commands</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLight(selectedItem, true)}
              disabled={isLoading}
            >
              Test ON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLight(selectedItem, false)}
              disabled={isLoading}
            >
              Test OFF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLightDim(selectedItem, 50)}
              disabled={isLoading}
            >
              Test 50% Dim
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLightColor(selectedItem, '#ff0000')}
              disabled={isLoading}
            >
              Test Red Color
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="font-medium mb-1">API Commands via gekko-proxy:</div>
          <div className="space-y-1 font-mono text-xs">
            <div>• var/lights/ITEM/scmd?value=VALUE</div>
            <div>• var/lights/ITEM/set?value=VALUE</div>
            <div>• Bypasses CORS using Supabase edge function</div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2">Sending command...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}