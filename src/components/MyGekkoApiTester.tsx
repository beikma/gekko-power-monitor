import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MyGekkoApiTester() {
  const [endpoint, setEndpoint] = useState('var');
  const [itemId, setItemId] = useState('item6');
  const [command, setCommand] = useState('');
  const [value, setValue] = useState('1');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const credentials = {
    username: 'mustermann@my-gekko.com',
    key: 'HjR9j4BrruA8wZiBeiWXnD',
    gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
  };

  const buildUrl = () => {
    const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
    const params = new URLSearchParams(credentials);
    
    if (command === 'scmd' && value) {
      params.set('value', value);
    }
    
    let fullEndpoint = endpoint;
    if (itemId && (command || endpoint.includes('status'))) {
      if (command) {
        fullEndpoint = `var/${itemId}/${command}`;
      } else if (endpoint === 'var/status') {
        fullEndpoint = 'var/status';
      }
    }
    
    return `${proxyUrl}?endpoint=${fullEndpoint}&${params}`;
  };

  const sendRequest = async () => {
    setIsLoading(true);
    setResponse('');
    
    const startTime = Date.now();
    const url = buildUrl();
    
    try {
      console.log('🚀 Sending API request:', url);
      
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      const responseText = await response.text();
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        response: responseText
      };
      
      setResponse(JSON.stringify(result, null, 2));
      
      if (response.ok) {
        toast({
          title: "Request Successful",
          description: `Status: ${response.status} (${duration}ms)`,
        });
      } else {
        toast({
          title: "Request Failed",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`
      };
      
      setResponse(JSON.stringify(errorResult, null, 2));
      
      toast({
        title: "Request Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      toast({
        title: "Copied to clipboard",
        description: "URL copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const quickTests = [
    {
      name: 'Get All Variables',
      endpoint: 'var',
      itemId: '',
      command: '',
      value: ''
    },
    {
      name: 'Get Status',
      endpoint: 'var/status',
      itemId: '',
      command: '',
      value: ''
    },
    {
      name: 'Turn On Socket item6',
      endpoint: 'var',
      itemId: 'item6',
      command: 'scmd',
      value: '1'
    },
    {
      name: 'Turn Off Socket item6',
      endpoint: 'var',
      itemId: 'item6',
      command: 'scmd',
      value: '0'
    },
    {
      name: 'Turn On Socket item9',
      endpoint: 'var',
      itemId: 'item9',
      command: 'scmd',
      value: '1'
    },
    {
      name: 'Turn On Socket item15',
      endpoint: 'var',
      itemId: 'item15',
      command: 'scmd',
      value: '1'
    }
  ];

  const runQuickTest = (test: typeof quickTests[0]) => {
    setEndpoint(test.endpoint);
    setItemId(test.itemId);
    setCommand(test.command);
    setValue(test.value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>myGEKKO API Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Tests */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Tests</Label>
          <div className="flex flex-wrap gap-2">
            {quickTests.map((test, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => runQuickTest(test)}
              >
                {test.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endpoint">Endpoint</Label>
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="var">var (Get Variables)</SelectItem>
                <SelectItem value="var/status">var/status (Get Status)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="itemId">Item ID</Label>
            <Input
              id="itemId"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              placeholder="e.g., item6, item9, item15"
            />
          </div>
          
          <div>
            <Label htmlFor="command">Command</Label>
            <Select value={command} onValueChange={setCommand}>
              <SelectTrigger>
                <SelectValue placeholder="Select command" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="scmd">scmd (Set Command)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 0, 1"
              disabled={command !== 'scmd'}
            />
          </div>
        </div>

        {/* URL Preview */}
        <div>
          <Label>Generated URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={buildUrl()}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button 
          onClick={sendRequest} 
          disabled={isLoading}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {isLoading ? 'Sending Request...' : 'Send Request'}
        </Button>

        {/* Response */}
        {response && (
          <div>
            <Label>Response</Label>
            <Textarea
              value={response}
              readOnly
              className="font-mono text-xs mt-1 min-h-40"
            />
          </div>
        )}

        {/* Credentials Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-2">Current Credentials:</div>
          <div className="space-y-1 text-xs font-mono">
            <div>Username: {credentials.username}</div>
            <div>Key: {credentials.key.substring(0, 10)}...</div>
            <div>GEKKO ID: {credentials.gekkoid}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}