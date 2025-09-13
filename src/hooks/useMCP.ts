import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MCPResponse {
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

interface MCPConfig {
  serverUrl?: string;
  token?: string;
}

export function useMCP(config: MCPConfig = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<MCPResponse | null>(null);

  const callMCP = useCallback(async (tool: string, args: any = {}): Promise<MCPResponse> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('mcp-proxy', {
        body: {
          tool,
          args,
          mcpUrl: config.serverUrl || 'http://localhost:8787/mcp/tools',
          token: config.token || 'default-token-change-me'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const response: MCPResponse = data;
      setLastResponse(response);

      if (!response.success) {
        toast.error(`MCP Error: ${response.error}`);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown MCP error';
      const response: MCPResponse = {
        success: false,
        error: errorMessage
      };
      
      setLastResponse(response);
      toast.error(`MCP Connection Error: ${errorMessage}`);
      
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [config.serverUrl, config.token]);

  const testConnection = useCallback(async () => {
    return await callMCP('health');
  }, [callMCP]);

  const listPoints = useCallback(async () => {
    return await callMCP('list_points');
  }, [callMCP]);

  const readPoint = useCallback(async (point: string) => {
    return await callMCP('read_point', { point });
  }, [callMCP]);

  const setPoint = useCallback(async (point: string, value: string) => {
    return await callMCP('set_point', { point, value });
  }, [callMCP]);

  return {
    isLoading,
    lastResponse,
    callMCP,
    testConnection,
    listPoints,
    readPoint,
    setPoint
  };
}