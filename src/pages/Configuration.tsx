import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Wifi, 
  Database, 
  Shield, 
  Bell,
  Palette,
  Save,
  TestTube
} from "lucide-react";
import { toast } from "sonner";
import { MCPTestPanel } from "@/components/MCPTestPanel";
import { DirectLightControl } from "@/components/DirectLightControl";
import { OpenMeteoTestCard } from "@/components/OpenMeteoTestCard";
import { BulkDataImport } from "@/components/BulkDataImport";
import { TeamsConfiguration } from "@/components/TeamsConfiguration";

export default function Configuration() {
  const [connectionConfig, setConnectionConfig] = useState({
    username: 'mustermann@my-gekko.com',
    apiKey: 'HjR9j4BrruA8wZiBeiWXnD',
    gekkoId: 'K999-7UOZ-8ZYZ-6TH3',
    refreshInterval: 30000
  });

  const [notifications, setNotifications] = useState({
    alarms: true,
    energyAlerts: true,
    securityEvents: true,
    maintenanceReminders: false
  });

  const handleSaveConnection = () => {
    // Save to localStorage or backend
    localStorage.setItem('gekko-config', JSON.stringify(connectionConfig));
    toast.success('Connection settings saved');
  };

  const handleTestConnection = async () => {
    try {
      // Test API connection
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionConfig)
      });
      
      if (response.ok) {
        toast.success('Connection test successful');
      } else {
        toast.error('Connection test failed');
      }
    } catch (error) {
      toast.error('Connection test failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground mt-2">
          System settings, connections, and advanced configuration
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="connection" className="gap-2">
            <Wifi className="h-4 w-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Database className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Database className="h-4 w-4" />
            Data Import
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Connection Settings */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                myGEKKO Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={connectionConfig.username}
                    onChange={(e) => setConnectionConfig(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gekkoId">GEKKO ID</Label>
                  <Input
                    id="gekkoId"
                    value={connectionConfig.gekkoId}
                    onChange={(e) => setConnectionConfig(prev => ({ ...prev, gekkoId: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={connectionConfig.apiKey}
                  onChange={(e) => setConnectionConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Refresh Interval (ms)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  value={connectionConfig.refreshInterval}
                  onChange={(e) => setConnectionConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveConnection} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
                <Button variant="outline" onClick={handleTestConnection} className="gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-base capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for {key.toLowerCase()}
                      </p>
                    </div>
                    <Badge variant={value ? "default" : "outline"}>
                      {value ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <TeamsConfiguration />
        </TabsContent>

        {/* Testing & Debugging */}
        <TabsContent value="testing" className="space-y-4">
          <div className="grid gap-6">
            <MCPTestPanel />
            <DirectLightControl />
            <OpenMeteoTestCard />
          </div>
        </TabsContent>

        {/* Data Import */}
        <TabsContent value="import" className="space-y-4">
          <BulkDataImport />
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Dashboard Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Appearance customization coming soon. Currently using the default energy-optimized theme.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}