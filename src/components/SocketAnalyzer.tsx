import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, ZapOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocketData {
  id: string;
  state: string;
  status: 'OFF' | 'ON' | 'FORCED_ON';
  rawValue: string;
}

export function SocketAnalyzer() {
  const [sockets, setSockets] = useState<SocketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSocketData = async () => {
    setIsLoading(true);
    try {
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const params = new URLSearchParams({
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
      });
      
      const response = await fetch(`${proxyUrl}?endpoint=var/status&${params}`);
      const data = await response.json();
      
      if (data.loads) {
        const socketList: SocketData[] = [];
        
        // Parse all load items (sockets)
        Object.entries(data.loads).forEach(([key, value]: [string, any]) => {
          if (key.startsWith('item') && value.sumstate?.value) {
            const rawValue = value.sumstate.value;
            const [stateCode] = rawValue.split(';');
            
            let status: 'OFF' | 'ON' | 'FORCED_ON' = 'OFF';
            if (stateCode === '1') status = 'ON';
            else if (stateCode === '2') status = 'FORCED_ON';
            
            socketList.push({
              id: key,
              state: stateCode,
              status,
              rawValue
            });
          }
        });
        
        // Sort by item number
        socketList.sort((a, b) => {
          const numA = parseInt(a.id.replace('item', ''));
          const numB = parseInt(b.id.replace('item', ''));
          return numA - numB;
        });
        
        setSockets(socketList);
        
        // Count active sockets
        const normallyOn = socketList.filter(s => s.status === 'ON').length;
        const forcedOn = socketList.filter(s => s.status === 'FORCED_ON').length;
        
        toast({
          title: "Socket Analysis Complete",
          description: `Found ${socketList.length} sockets: ${normallyOn} ON, ${forcedOn} FORCED ON${socketList.filter(s => s.status === 'ON').length === 1 ? ` - ${socketList.find(s => s.status === 'ON')?.id.toUpperCase()} appears to be your garage!` : ''}`,
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch socket data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch socket data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSocket = async (socketId: string, command: 'on' | 'off') => {
    try {
      const value = command === 'on' ? '2' : '0'; // 2 = OnPermanent, 0 = Off
      
      // Step 1: Get the index for this socket
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const infoParams = new URLSearchParams({
        endpoint: `var/${socketId}/scmd`,
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
      });

      console.log(`🔍 Getting command info for ${socketId}...`);
      const infoResponse = await fetch(`${proxyUrl}?${infoParams}`);
      const infoData = await infoResponse.json();
      
      if (!infoResponse.ok || !infoData.index) {
        throw new Error(`Failed to get command index for ${socketId}`);
      }

      // Step 2: Execute command using index
      const cmdParams = new URLSearchParams({
        endpoint: 'var/scmd',
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3',
        index: infoData.index,
        value: value
      });

      console.log(`🚀 Executing command: index=${infoData.index}, value=${value}`);
      const response = await fetch(`${proxyUrl}?${cmdParams}`);
      const responseText = await response.text();
      
      console.log(`📡 API Response → ${response.status}: ${responseText}`);
      
      if (response.ok) {
        toast({
          title: `${socketId.toUpperCase()} ${command.toUpperCase()}`,
          description: `Success! Socket ${command === 'on' ? 'turned on permanently' : 'turned off'}`,
        });
        
        // Refresh data after 2 seconds
        setTimeout(() => {
          fetchSocketData();
        }, 2000);
      } else {
        throw new Error(`HTTP ${response.status} - ${responseText}`);
      }
    } catch (error) {
      toast({
        title: "Command Failed",
        description: `Failed to ${command} ${socketId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      console.error(`❌ Socket command failed:`, error);
    }
  };

  useEffect(() => {
    fetchSocketData();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Socket Analyzer - All 18 Sockets</CardTitle>
          <Button 
            onClick={fetchSocketData} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{sockets.length}</div>
                <div className="text-sm text-muted-foreground">Total Sockets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sockets.filter(s => s.status === 'ON').length}
                </div>
                <div className="text-sm text-muted-foreground">Normal ON</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {sockets.filter(s => s.status === 'FORCED_ON').length}
                </div>
                <div className="text-sm text-muted-foreground">Forced ON</div>
              </div>
            </div>
          </div>

          {/* Socket List */}
          <div className="space-y-2">
            {sockets.map((socket) => (
              <div 
                key={socket.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  socket.status === 'ON' ? 'bg-green-50 border-green-200' :
                  socket.status === 'FORCED_ON' ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {socket.status === 'OFF' ? (
                      <ZapOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">{socket.id.toUpperCase()}</span>
                  </div>
                  
                  <Badge variant={
                    socket.status === 'ON' ? 'default' :
                    socket.status === 'FORCED_ON' ? 'secondary' : 
                    'outline'
                  }>
                    {socket.status}
                  </Badge>
                  
                  <span className="text-sm text-muted-foreground font-mono">
                    {socket.rawValue}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testSocket(socket.id, 'off')}
                    disabled={socket.status === 'OFF'}
                  >
                    OFF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testSocket(socket.id, 'on')}
                    disabled={socket.status !== 'OFF'}
                  >
                    ON
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">🔍 Identify Your Garage Socket:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Look for sockets with status "ON" (green background)</li>
              <li>2. Test each ON socket by clicking "OFF" to see which one controls your garage</li>
              <li>3. The garage socket should turn off when you click its OFF button</li>
              <li>4. Once identified, click "ON" again to turn it back on</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}