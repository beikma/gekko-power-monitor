import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Wifi, 
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Home
} from "lucide-react";
import { toast } from "sonner";

export function SimpleConfiguration() {
  const [connectionConfig, setConnectionConfig] = useState({
    username: 'mustermann@my-gekko.com',
    apiKey: 'HjR9j4BrruA8wZiBeiWXnD',
    gekkoId: 'K999-7UOZ-8ZYZ-6TH3',
    refreshInterval: 30000
  });

  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'success' | 'error'>('unknown');
  const [statusMessage, setStatusMessage] = useState('');

  // Load saved configuration
  useEffect(() => {
    const saved = localStorage.getItem('gekko-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConnectionConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load saved config:', error);
      }
    }
  }, []);

  const handleSaveConnection = () => {
    try {
      localStorage.setItem('gekko-config', JSON.stringify(connectionConfig));
      toast.success('Connection settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setStatusMessage('Testing connection...');
    
    try {
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const params = new URLSearchParams({
        endpoint: 'var/status',
        username: connectionConfig.username,
        key: connectionConfig.apiKey,
        gekkoid: connectionConfig.gekkoId,
      });

      const response = await fetch(`${proxyUrl}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('success');
        setStatusMessage('Connection successful! System is responding.');
        toast.success('Connection test successful');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Connection failed');
      toast.error('Connection test failed');
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <div className="h-4 w-4 border-2 border-primary border-r-transparent animate-spin rounded-full" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-energy-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'testing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Setup your myGEKKO connection and preferences</p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.href = '/'}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            myGEKKO Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username (Email)</Label>
              <Input
                id="username"
                type="email"
                placeholder="your-email@example.com"
                value={connectionConfig.username}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, username: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Your myGEKKO account email address
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gekkoId">GEKKO ID</Label>
              <Input
                id="gekkoId"
                placeholder="K999-XXXX-XXXX-XXXX"
                value={connectionConfig.gekkoId}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, gekkoId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Your unique GEKKO system ID
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={connectionConfig.apiKey}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Your myGEKKO API access key (found in your myGEKKO account settings)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
            <Input
              id="refreshInterval"
              type="number"
              min="5"
              max="300"
              value={connectionConfig.refreshInterval / 1000}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) * 1000 }))}
            />
            <p className="text-xs text-muted-foreground">
              How often to refresh data from your GEKKO system (5-300 seconds)
            </p>
          </div>

          <Separator />

          {/* Connection Status */}
          {connectionStatus !== 'unknown' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <Badge variant={getStatusVariant()}>
                  {connectionStatus === 'testing' && 'Testing...'}
                  {connectionStatus === 'success' && 'Connected'}
                  {connectionStatus === 'error' && 'Error'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSaveConnection} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection} 
              disabled={connectionStatus === 'testing'}
              className="gap-2"
            >
              <TestTube className="h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Get your myGEKKO credentials</p>
                <p className="text-sm text-muted-foreground">
                  Log into your myGEKKO account and find your GEKKO ID and API key in the settings
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Enter your connection details</p>
                <p className="text-sm text-muted-foreground">
                  Fill in your email, GEKKO ID, and API key in the form above
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Test and save</p>
                <p className="text-sm text-muted-foreground">
                  Use "Test Connection" to verify everything works, then save your settings
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Start using your dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Return to the dashboard to see your myGEKKO data and control your devices
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dashboard Version:</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">API Endpoint:</span>
            <span className="font-mono text-xs">live.my-gekko.com</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Config Save:</span>
            <span className="font-mono text-xs">
              {localStorage.getItem('gekko-config') ? 'Saved locally' : 'Not saved'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}