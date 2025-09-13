import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Zap, AlertCircle } from 'lucide-react';

export function MyGekkoDebugger() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Array<{endpoint: string, status: number, data: string}>>([]);
  const { toast } = useToast();

  const testEndpoints = async () => {
    setIsLoading(true);
    setResults([]);

    const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
    const baseParams = {
      username: 'mustermann@my-gekko.com',
      key: 'HjR9j4BrruA8wZiBeiWXnD',
      gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
    };

    // Test different endpoint structures for item15 (the active socket)
    const endpointsToTest = [
      // Based on user's light example: var/lights/item0/set
      'var/loads/item15/set',
      'var/loads/item15/scmd',
      
      // Alternative structures
      'var/item15/set',
      'var/item15/scmd',
      
      // Direct load control
      'loads/item15/set',
      'loads/item15/scmd',
      
      // Try with the actual MyGekko format from documentation
      'scmd', // with index=item15 parameter
      'var/scmd', // with index=item15 parameter
    ];

    const testResults = [];

    for (const endpoint of endpointsToTest) {
      try {
        let params = new URLSearchParams(baseParams);
        
        // Special handling for scmd endpoints that might need index parameter
        if (endpoint === 'scmd' || endpoint === 'var/scmd') {
          params.append('index', '100150'); // Converted item15 to index format
          params.append('value', '1');
        } else {
          params.append('value', '1');
        }

        console.log(`🔄 Testing: ${proxyUrl}?endpoint=${endpoint}&${params}`);

        const response = await fetch(`${proxyUrl}?endpoint=${endpoint}&${params}`);
        const responseText = await response.text();
        
        testResults.push({
          endpoint: endpoint + (endpoint.includes('scmd') && !endpoint.includes('/') ? ' (index=100150)' : ''),
          status: response.status,
          data: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
        });

        console.log(`📡 ${endpoint} → ${response.status}: ${responseText}`);

      } catch (error) {
        testResults.push({
          endpoint: endpoint,
          status: 0,
          data: error instanceof Error ? error.message : 'Network error'
        });
      }
    }

    setResults(testResults);
    setIsLoading(false);

    const successCount = testResults.filter(r => r.status === 200).length;
    toast({
      title: "Debug Test Complete",
      description: `${successCount}/${endpointsToTest.length} endpoints returned success`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          MyGekko API Endpoint Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={testEndpoints} 
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test All Socket Control Endpoints
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Test Results:</h3>
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded border ${
                    result.status === 200 ? 'bg-green-50 border-green-200' :
                    result.status >= 400 ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm font-mono">{result.endpoint}</code>
                    <Badge variant={
                      result.status === 200 ? 'default' :
                      result.status >= 400 ? 'destructive' : 
                      'secondary'
                    }>
                      {result.status || 'ERR'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {result.data}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded border border-blue-200 text-sm">
            <p className="font-medium text-blue-900 mb-1">🎯 Goal:</p>
            <p className="text-blue-800">Find the correct API endpoint to control item15 (garage socket) based on the MyGekko documentation format.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}