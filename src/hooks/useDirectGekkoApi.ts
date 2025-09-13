import { useState, useCallback } from 'react';
import { toast } from 'sonner';

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

  const toggleLight = useCallback(async (itemId: string, turnOn: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Toggling light ${itemId} to ${turnOn ? 'ON' : 'OFF'} using direct MyGekko API`);
      
      // Try the direct MyGekko API format suggested
      const apiUrl = `https://live.my-gekko.com/api/v1/var/lights/${itemId}/set?value=${turnOn ? '1' : '0'}&apikey=${credentials.apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MyGekko-Web-Client'
        }
      });

      console.log(`API Response Status: ${response.status}`);
      
      if (!response.ok) {
        // If direct API fails, try alternative formats
        console.log('Direct API failed, trying alternative format...');
        
        // Try with gekkoId in URL
        const altUrl1 = `https://live.my-gekko.com/api/v1/${credentials.gekkoId}/var/lights/${itemId}/set?value=${turnOn ? '1' : '0'}&apikey=${credentials.apiKey}`;
        
        const altResponse1 = await fetch(altUrl1, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!altResponse1.ok) {
          // Try POST method with body
          console.log('Trying POST method...');
          
          const postResponse = await fetch(`https://live.my-gekko.com/api/v1/var/lights/${itemId}/set`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`
            },
            body: JSON.stringify({
              value: turnOn ? '1' : '0',
              gekkoid: credentials.gekkoId,
              username: credentials.username
            })
          });

          if (!postResponse.ok) {
            // Try with scmd (set command) format from the API data
            console.log('Trying scmd format...');
            
            const scmdUrl = `https://live.my-gekko.com/api/v1/var/lights/${itemId}/scmd?value=${turnOn ? '1' : '0'}&apikey=${credentials.apiKey}`;
            
            const scmdResponse = await fetch(scmdUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });

            if (!scmdResponse.ok) {
              throw new Error(`All API methods failed. Last status: ${scmdResponse.status}`);
            }
            
            const scmdResult = await scmdResponse.text();
            console.log('SCMD API Response:', scmdResult);
            
            toast.success(`Light ${itemId} ${turnOn ? 'turned on' : 'turned off'} (via scmd)`);
            return { success: true, method: 'scmd', response: scmdResult };
          }
          
          const postResult = await postResponse.text();
          console.log('POST API Response:', postResult);
          
          toast.success(`Light ${itemId} ${turnOn ? 'turned on' : 'turned off'} (via POST)`);
          return { success: true, method: 'post', response: postResult };
        }

        const altResult1 = await altResponse1.text();
        console.log('Alternative API Response:', altResult1);
        
        toast.success(`Light ${itemId} ${turnOn ? 'turned on' : 'turned off'} (alt format)`);
        return { success: true, method: 'alternative', response: altResult1 };
      }

      const result = await response.text();
      console.log('Direct API Response:', result);
      
      toast.success(`Light ${itemId} ${turnOn ? 'turned on' : 'turned off'}`);
      return { success: true, method: 'direct', response: result };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle light';
      console.error('Light toggle error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to toggle light: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  const setLightDim = useCallback(async (itemId: string, dimLevel: number) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Setting light ${itemId} dim to ${dimLevel}%`);
      
      // Try dim command with D prefix (from API docs format)
      const dimUrl = `https://live.my-gekko.com/api/v1/var/lights/${itemId}/set?value=D${dimLevel}&apikey=${credentials.apiKey}`;
      
      const response = await fetch(dimUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Try scmd format for dimming
        const scmdUrl = `https://live.my-gekko.com/api/v1/var/lights/${itemId}/scmd?value=D${dimLevel}&apikey=${credentials.apiKey}`;
        
        const scmdResponse = await fetch(scmdUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!scmdResponse.ok) {
          throw new Error(`Dim command failed. Status: ${scmdResponse.status}`);
        }

        const scmdResult = await scmdResponse.text();
        console.log('Dim SCMD Response:', scmdResult);
        
        toast.success(`Light ${itemId} dimmed to ${dimLevel}% (via scmd)`);
        return { success: true, method: 'scmd', response: scmdResult };
      }

      const result = await response.text();
      console.log('Dim API Response:', result);
      
      toast.success(`Light ${itemId} dimmed to ${dimLevel}%`);
      return { success: true, method: 'direct', response: result };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dim light';
      console.error('Light dim error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to dim light: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  const setLightColor = useCallback(async (itemId: string, rgbHex: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert hex to RGB integer (24-bit)
      const rgb = parseInt(rgbHex.replace('#', ''), 16);
      console.log(`Setting light ${itemId} color to RGB: ${rgb} (${rgbHex})`);
      
      // Try color command with C prefix
      const colorUrl = `https://live.my-gekko.com/api/v1/var/lights/${itemId}/set?value=C${rgb}&apikey=${credentials.apiKey}`;
      
      const response = await fetch(colorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Try scmd format for color
        const scmdUrl = `https://live.my-gekko.com/api/v1/var/lights/${itemId}/scmd?value=C${rgb}&apikey=${credentials.apiKey}`;
        
        const scmdResponse = await fetch(scmdUrl, {
          method: 'GET'
        });

        if (!scmdResponse.ok) {
          throw new Error(`Color command failed. Status: ${scmdResponse.status}`);
        }

        const scmdResult = await scmdResponse.text();
        console.log('Color SCMD Response:', scmdResult);
        
        toast.success(`Light ${itemId} color changed (via scmd)`);
        return { success: true, method: 'scmd', response: scmdResult };
      }

      const result = await response.text();
      console.log('Color API Response:', result);
      
      toast.success(`Light ${itemId} color changed to ${rgbHex}`);
      return { success: true, method: 'direct', response: result };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change light color';
      console.error('Light color error:', errorMessage);
      setError(errorMessage);
      toast.error(`Failed to change light color: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  return {
    toggleLight,
    setLightDim,
    setLightColor,
    isLoading,
    error,
    credentials
  };
}