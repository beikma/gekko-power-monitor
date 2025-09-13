import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Wifi, WifiOff } from 'lucide-react';

interface ApiLog {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  status?: number;
  data?: any;
  duration?: number;
}

export function ApiCommunicationTracker() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const addLog = (log: Omit<ApiLog, 'id' | 'timestamp'>) => {
    const newLog: ApiLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = async () => {
    const startTime = Date.now();
    addLog({
      type: 'request',
      method: 'GET',
      url: '/gekko-proxy - Connection Test'
    });

    try {
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const baseParams = new URLSearchParams({
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3',
      });

      const response = await fetch(`${proxyUrl}?endpoint=var&${baseParams}`);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        addLog({
          type: 'response',
          method: 'GET',
          url: '/gekko-proxy - Connection Test',
          status: response.status,
          data: `Success - Found ${Object.keys(data).length} categories`,
          duration
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setIsConnected(false);
      addLog({
        type: 'error',
        method: 'GET',
        url: '/gekko-proxy - Connection Test',
        data: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  const sendTestCommand = async () => {
    const startTime = Date.now();
    addLog({
      type: 'request',
      method: 'POST',
      url: '/gekko-proxy - Test Command item6'
    });

    try {
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const baseParams = new URLSearchParams({
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3',
        value: '1'
      });

      const response = await fetch(`${proxyUrl}?endpoint=var/item6/scmd&${baseParams}`);
      const responseText = await response.text();
      const duration = Date.now() - startTime;

      addLog({
        type: 'response',
        method: 'POST',
        url: '/gekko-proxy - Test Command item6',
        status: response.status,
        data: responseText,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      addLog({
        type: 'error',
        method: 'POST',
        url: '/gekko-proxy - Test Command item6',
        data: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  // Expose logging function globally for use by other components
  useEffect(() => {
    (window as any).apiLogger = { addLog };
    return () => {
      delete (window as any).apiLogger;
    };
  }, []);

  useEffect(() => {
    testConnection();
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const getStatusColor = (type: string, status?: number) => {
    if (type === 'error') return 'destructive';
    if (type === 'request') return 'secondary';
    if (status && status >= 200 && status < 300) return 'default';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">API Communication Tracker</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isConnected === true ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : isConnected === false ? (
                <WifiOff className="w-4 h-4 text-destructive" />
              ) : (
                <div className="w-4 h-4 animate-pulse bg-muted rounded" />
              )}
              <span className="text-sm text-muted-foreground">
                {isConnected === true ? 'Connected' : isConnected === false ? 'Disconnected' : 'Testing...'}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={testConnection}>
              Test Connection
            </Button>
            <Button size="sm" variant="outline" onClick={sendTestCommand}>
              Test Command
            </Button>
            <Button size="sm" variant="ghost" onClick={clearLogs}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No API calls logged yet
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                  <Badge variant={getStatusColor(log.type, log.status)} className="mt-0.5">
                    {log.type.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{log.method}</span>
                      <span className="text-muted-foreground truncate">{log.url}</span>
                      {log.status && (
                        <Badge variant="outline" className="text-xs">
                          {log.status}
                        </Badge>
                      )}
                      {log.duration && (
                        <Badge variant="outline" className="text-xs">
                          {log.duration}ms
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(log.timestamp)}
                    </div>
                    {log.data && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-1 rounded">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}