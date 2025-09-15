import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GekkoCredentials {
  username: string;
  apiKey: string;
  gekkoId: string;
}

interface LightState {
  id: string;
  name: string;
  state: boolean;
  dimLevel?: number;
  rgbColor?: string;
  page: string;
}

export function useDirectGekkoApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default credentials from network logs
  const credentials: GekkoCredentials = {
    username: 'mustermann@my-gekko.com',
    apiKey: 'HjR9j4BrruA8wZiBeiWXnD',
    gekkoId: 'K999-7UOZ-8ZYZ-6TH3'
  };

  const callGekkoProxy = useCallback(async (endpoint: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gekko-proxy', {
        body: { 
          endpoint,
          username: credentials.username,
          key: credentials.apiKey,
          gekkoid: credentials.gekkoId
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Proxy call failed');
    }
  }, [credentials]);

  const toggleLight = useCallback(async (itemId: string, turnOn: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Toggling light ${itemId} to ${turnOn ? 'ON' : 'OFF'} via gekko-proxy`);
      
      // Try correct myGEKKO API format from documentation
      const commands = [
        `var/lights/${itemId}/scmd/set?value=${turnOn ? '1' : '0'}`,
      ];

      let lastError: any;
      for (const command of commands) {
        try {
          const result = await callGekkoProxy(command);
          console.log(`Light toggle successful with command: ${command}`, result);
          toast.success(`Light ${itemId} ${turnOn ? 'turned on' : 'turned off'}`);
          return { success: true, method: command, response: result };
        } catch (err) {
          lastError = err;
          console.log(`Command ${command} failed, trying next...`);
        }
      }

      throw lastError;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle light';
      console.error('Light toggle error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to toggle light: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [callGekkoProxy]);

  const setLightDim = useCallback(async (itemId: string, dimLevel: number) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Setting light ${itemId} dim to ${dimLevel}% via gekko-proxy`);
      
      // Try correct myGEKKO API format from documentation
      const commands = [
        `var/lights/${itemId}/scmd/set?value=D${dimLevel}`,
      ];

      let lastError: any;
      for (const command of commands) {
        try {
          const result = await callGekkoProxy(command);
          console.log(`Light dim successful with command: ${command}`, result);
          toast.success(`Light ${itemId} dimmed to ${dimLevel}%`);
          return { success: true, method: command, response: result };
        } catch (err) {
          lastError = err;
          console.log(`Dim command ${command} failed, trying next...`);
        }
      }

      throw lastError;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dim light';
      console.error('Light dim error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to dim light: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [callGekkoProxy]);

  const setLightColor = useCallback(async (itemId: string, rgbHex: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert hex to RGB integer (24-bit)
      const rgb = parseInt(rgbHex.replace('#', ''), 16);
      console.log(`Setting light ${itemId} color to RGB: ${rgb} (${rgbHex}) via gekko-proxy`);
      
      // Try correct myGEKKO API format from documentation
      const commands = [
        `var/lights/${itemId}/scmd/set?value=C${rgb}`,
      ];

      let lastError: any;
      for (const command of commands) {
        try {
          const result = await callGekkoProxy(command);
          console.log(`Light color successful with command: ${command}`, result);
          toast.success(`Light ${itemId} color changed to ${rgbHex}`);
          return { success: true, method: command, response: result };
        } catch (err) {
          lastError = err;
          console.log(`Color command ${command} failed, trying next...`);
        }
      }

      throw lastError;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change light color';
      console.error('Light color error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to change light color: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [callGekkoProxy]);

  const testAllEndpoints = useCallback(async (itemId: string) => {
    setIsLoading(true);
    console.log('Testing all light control endpoints via gekko-proxy...');
    
    const testCommands = [
      `var/lights/${itemId}`,
      `var/lights/${itemId}/status`,
      `var/lights/${itemId}/scmd?value=1`,
      `var/lights/${itemId}/set?value=1`,
      `var/lights/${itemId}?scmd=1`
    ];

    const results: any[] = [];
    for (const command of testCommands) {
      try {
        console.log(`Testing: ${command}`);
        const result = await callGekkoProxy(command);
        results.push({ command, success: true, result });
        console.log(`✓ ${command} - SUCCESS`, result);
      } catch (err) {
        results.push({ command, success: false, error: err });
        console.log(`✗ ${command} - FAILED`, err);
      }
    }

    setIsLoading(false);
    return results;
  }, [callGekkoProxy]);

  return {
    toggleLight,
    setLightDim,
    setLightColor,
    testAllEndpoints,
    isLoading,
    error,
    credentials
  };
}