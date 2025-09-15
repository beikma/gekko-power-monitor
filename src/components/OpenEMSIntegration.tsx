import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Power, Zap, Database, Activity, Settings, Wifi, WifiOff } from 'lucide-react';
import { useOpenEMS } from '@/hooks/useOpenEMS';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const OpenEMSIntegration = () => {
  const {
    isLoading,
    edges,
    channels,
    historyData,
    getEdgesStatus,
    getChannelsValues,
    queryHistoricData,
    setChannelValue,
    testConnection,
    isSimulation
  } = useOpenEMS();

  const [customEndpoint, setCustomEndpoint] = useState('');
  const [selectedEdge, setSelectedEdge] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  // Test connection on component mount
  useEffect(() => {
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    const success = await testConnection(customEndpoint || undefined);
    setConnectionStatus(success ? 'connected' : 'failed');
    
    if (success) {
      // Load initial data
      await loadEdges();
    }
  };

  const loadEdges = async () => {
    const edgesList = await getEdgesStatus();
    if (edgesList.length > 0 && !selectedEdge) {
      setSelectedEdge(edgesList[0].id);
    }
  };

  const loadChannelData = async () => {
    if (!selectedEdge) return;
    
    // Load common energy channels
    const commonChannels = [
      '_sum/GridActivePower',
      '_sum/ProductionActivePower', 
      '_sum/ConsumptionActivePower',
      '_sum/EssActivePower'
    ];
    
    await getChannelsValues(selectedEdge, commonChannels);
  };

  const loadHistoryData = async () => {
    if (!selectedEdge) return;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    await queryHistoricData(
      selectedEdge,
      ['_sum/GridActivePower', '_sum/ProductionActivePower', '_sum/ConsumptionActivePower'],
      startDate,
      endDate,
      900 // 15 minutes resolution
    );
  };

  const formatChannelName = (address: string) => {
    return address.split('/').pop()?.replace(/([A-Z])/g, ' $1').trim() || address;
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} W`;
    }
    return String(value);
  };

  const chartData = historyData.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    grid: item.channels['_sum/GridActivePower'] || 0,
    production: item.channels['_sum/ProductionActivePower'] || 0,
    consumption: item.channels['_sum/ConsumptionActivePower'] || 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">OpenEMS Integration</h1>
        <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
          {connectionStatus === 'connected' && <Wifi className="h-3 w-3 mr-1" />}
          {connectionStatus === 'failed' && <WifiOff className="h-3 w-3 mr-1" />}
          {connectionStatus === 'unknown' ? 'Testing...' : 
           connectionStatus === 'connected' ? (isSimulation ? 'Demo Mode' : 'Connected') : 'Disconnected'}
        </Badge>
        {isSimulation && (
          <Badge variant="secondary">
            Simulation Data
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Setup
          </CardTitle>
          <CardDescription>
            Connect to OpenEMS Backend or use demo simulation
            {isSimulation && (
              <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                ⚡ Currently using simulated OpenEMS data for demonstration. 
                Enter a real OpenEMS endpoint above to connect to live data.
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="endpoint">OpenEMS Backend Endpoint (optional)</Label>
              <Input
                id="endpoint"
                placeholder="https://your-openems-backend.com/rest/jsonrpc"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty for demo simulation with realistic energy data
              </p>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleTestConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {connectionStatus === 'connected' && (
        <Tabs defaultValue="edges" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edges">Edge Devices</TabsTrigger>
            <TabsTrigger value="channels">Live Data</TabsTrigger>
            <TabsTrigger value="history">History Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="edges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Connected Edge Devices
                </CardTitle>
                <CardDescription>
                  OpenEMS Edge devices connected to the backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                {edges.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No edge devices found</p>
                    <Button onClick={loadEdges} className="mt-4">
                      Refresh Edges
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {edges.map((edge) => (
                      <Card 
                        key={edge.id} 
                        className={`cursor-pointer border-2 ${
                          selectedEdge === edge.id ? 'border-primary' : 'border-border'
                        }`}
                        onClick={() => setSelectedEdge(edge.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{edge.name}</h3>
                              <p className="text-sm text-muted-foreground">ID: {edge.id}</p>
                            </div>
                            <Badge variant={edge.online ? 'default' : 'secondary'}>
                              {edge.online ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Live Channel Data
                  {selectedEdge && (
                    <Badge variant="outline" className="ml-2">
                      {selectedEdge}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Real-time energy data from selected edge device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {channels.length} channels loaded
                  </p>
                  <Button 
                    onClick={loadChannelData} 
                    disabled={!selectedEdge || isLoading}
                    size="sm"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Refresh Data
                  </Button>
                </div>

                {channels.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {selectedEdge ? 'No channel data available' : 'Select an edge device first'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channels.map((channel, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <h4 className="font-medium text-sm mb-2">
                            {formatChannelName(channel.address)}
                          </h4>
                          <p className="text-2xl font-bold text-primary">
                            {formatValue(channel.value)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {channel.address}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  24-Hour Energy History
                  {selectedEdge && (
                    <Badge variant="outline" className="ml-2">
                      {selectedEdge}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Historical energy data visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {historyData.length} data points
                  </p>
                  <Button 
                    onClick={loadHistoryData} 
                    disabled={!selectedEdge || isLoading}
                    size="sm"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load History
                  </Button>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {selectedEdge ? 'No historical data available' : 'Select an edge device first'}
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="grid" 
                          stroke="hsl(var(--primary))" 
                          name="Grid Power" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="production" 
                          stroke="hsl(var(--chart-2))" 
                          name="Production" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="consumption" 
                          stroke="hsl(var(--chart-3))" 
                          name="Consumption" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};