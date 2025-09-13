import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMCP } from '@/hooks/useMCP';
import { Activity, Server, Zap, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function MCPTestPanel() {
  const [serverUrl, setServerUrl] = useState('http://localhost:8787/mcp/tools');
  const [token, setToken] = useState('default-token-change-me');
  const [testPoint, setTestPoint] = useState('meteo.temperature');
  const [controlPoint, setControlPoint] = useState('lights.item0');
  const [controlValue, setControlValue] = useState('1');
  
  const mcp = useMCP({ serverUrl, token });

  const handleTestConnection = async () => {
    const response = await mcp.testConnection();
    if (response.success) {
      toast.success('MCP Server is healthy and connected!');
    }
  };

  const handleListPoints = async () => {
    const response = await mcp.listPoints();
    if (response.success && response.data?.data?.totalPoints) {
      toast.success(`Found ${response.data.data.totalPoints} data points`);
    }
  };

  const handleReadPoint = async () => {
    if (!testPoint.trim()) {
      toast.error('Please enter a point to read');
      return;
    }
    
    const response = await mcp.readPoint(testPoint);
    if (response.success) {
      toast.success(`Read ${testPoint}: ${JSON.stringify(response.data?.data?.value)}`);
    }
  };

  const handleSetPoint = async () => {
    if (!controlPoint.trim() || !controlValue.trim()) {
      toast.error('Please enter both point and value');
      return;
    }
    
    const response = await mcp.setPoint(controlPoint, controlValue);
    if (response.success) {
      toast.success(`Set ${controlPoint} to ${controlValue}`);
    }
  };

  const getStatusBadge = () => {
    if (mcp.isLoading) {
      return <Badge variant="secondary">Testing...</Badge>;
    }
    
    if (!mcp.lastResponse) {
      return <Badge variant="outline">Not tested</Badge>;
    }
    
    return mcp.lastResponse.success ? 
      <Badge variant="default">Connected</Badge> : 
      <Badge variant="destructive">Error</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle>MCP Server Test Panel</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Test the Model Context Protocol server connection and tools
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Server Configuration */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Server Configuration</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="serverUrl" className="text-xs">Server URL</Label>
              <Input
                id="serverUrl"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8787/mcp/tools"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="token" className="text-xs">Bearer Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="your-bearer-token"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={mcp.isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Health Check
          </Button>
          
          <Button
            onClick={handleListPoints}
            disabled={mcp.isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            List Points
          </Button>
          
          <Button
            onClick={handleReadPoint}
            disabled={mcp.isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Read Point
          </Button>
          
          <Button
            onClick={handleSetPoint}
            disabled={mcp.isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Set Point
          </Button>
        </div>

        {/* Point Testing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="testPoint" className="text-sm font-medium">Read Point Test</Label>
            <Input
              id="testPoint"
              value={testPoint}
              onChange={(e) => setTestPoint(e.target.value)}
              placeholder="meteo.temperature"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Examples: meteo.temperature, lights.item0, roomtemps.item1
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Control Point Test</Label>
            <div className="flex gap-2">
              <Input
                value={controlPoint}
                onChange={(e) => setControlPoint(e.target.value)}
                placeholder="lights.item0"
                className="text-sm flex-1"
              />
              <Input
                value={controlValue}
                onChange={(e) => setControlValue(e.target.value)}
                placeholder="1"
                className="text-sm w-20"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Values: 1=on, 0=off, D50=50% brightness
            </p>
          </div>
        </div>

        {/* Response Display */}
        {mcp.lastResponse && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Last Response</Label>
            <Textarea
              value={JSON.stringify(mcp.lastResponse, null, 2)}
              readOnly
              className="text-xs font-mono h-32 resize-none"
            />
          </div>
        )}
        
        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Setup:</strong> Run <code>npm run dev:mcp</code> in the mcp-server directory</p>
          <p><strong>Default:</strong> Server runs on port 8787 with token "default-token-change-me"</p>
          <p><strong>External AI:</strong> Use POST /mcp/tools with Bearer authentication</p>
        </div>
      </CardContent>
    </Card>
  );
}