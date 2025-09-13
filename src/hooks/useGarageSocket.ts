import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocketSchedule {
  id?: string;
  day: number; // 0-6 (Sunday-Saturday)
  onTime: string; // HH:MM format
  offTime: string; // HH:MM format
  enabled: boolean;
}

export interface GarageSocket {
  id: string;
  name: string;
  isOn: boolean;
  location: string;
  schedule: SocketSchedule[];
}

export function useGarageSocket() {
  const [socket, setSocket] = useState<GarageSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSocketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get all available myGEKKO devices
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const baseParams = new URLSearchParams({
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3',
      });

      const gekkoResponse = await fetch(`${proxyUrl}?endpoint=var&${baseParams}`);
      
      if (!gekkoResponse.ok) {
        throw new Error(`API Error: ${gekkoResponse.status}`);
      }

      const gekkoData = await gekkoResponse.json();

      // Look for power sockets/devices in garage
      const garageSocket = findGarageSocket(gekkoData);
      
      if (garageSocket) {
        // Get current status
        const statusResponse = await fetch(`${proxyUrl}?endpoint=var/status&${baseParams}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const socketStatus = getSocketStatus(statusData, garageSocket.id);
          
          setSocket({
            ...garageSocket,
            isOn: socketStatus,
            schedule: [] // TODO: Load from local storage or database
          });
        } else {
          setSocket({
            ...garageSocket,
            isOn: false,
            schedule: []
          });
        }
      } else {
        // Create mock garage socket for development
        setSocket({
          id: 'garage_socket_1',
          name: 'Garage Steckdose',
          isOn: false,
          location: 'Garage',
          schedule: []
        });
      }
    } catch (err) {
      console.error('Error fetching garage socket data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch socket data');
      
      // Fallback to mock data
      setSocket({
        id: 'garage_socket_1',
        name: 'Garage Steckdose',
        isOn: false,
        location: 'Garage',
        schedule: []
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSocket = useCallback(async () => {
    if (!socket) return;
    
    const startTime = Date.now();
    const newState = !socket.isOn;
    
    // Log to API tracker if available
    const apiLogger = (window as any).apiLogger;
    apiLogger?.addLog({
      type: 'request',
      method: 'POST',
      url: `gekko-proxy - Toggle ${socket.id} to ${newState ? 'ON' : 'OFF'}`
    });
    
    try {
      // Send command to myGEKKO
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const baseParams = {
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
      };

      console.log(`🚀 Sending command to ${socket.id}: ${newState ? 'ON' : 'OFF'}`);
      
      const commandValue = newState ? '1' : '0';
      
      // Try multiple endpoint variations for loads/sockets  
      const endpointVariations = [
        `var/loads/${socket.id}/set`,
        `var/loads/${socket.id}/scmd`,
        `var/${socket.id}/set`, 
        `var/${socket.id}/scmd`
      ];
      
      let lastError: any;
      
      for (const endpoint of endpointVariations) {
        try {
          const params = new URLSearchParams({
            ...baseParams,
            value: commandValue
          });
          
          console.log(`🔄 Trying: ${proxyUrl}?endpoint=${endpoint}&${params}`);
          
          const response = await fetch(`${proxyUrl}?endpoint=${endpoint}&${params}`);
          const responseText = await response.text();
          const duration = Date.now() - startTime;
          
          console.log(`📡 ${endpoint} → ${response.status}: ${responseText}`);
          
          // Log response
          apiLogger?.addLog({
            type: response.ok ? 'response' : 'error',
            method: 'POST',
            url: `gekko-proxy - ${endpoint}`,
            status: response.status,
            data: responseText,
            duration
          });
          
          if (response.ok) {
            setSocket(prev => prev ? { ...prev, isOn: newState } : null);
            console.log(`✅ Socket toggle successful via ${endpoint}`);
            return;
          } else {
            lastError = new Error(`${endpoint}: HTTP ${response.status} - ${responseText}`);
          }
          
        } catch (error) {
          lastError = error;
          console.log(`❌ ${endpoint} failed:`, error);
          
          apiLogger?.addLog({
            type: 'error',
            method: 'POST',
            url: `gekko-proxy - ${endpoint}`,
            status: 0,
            data: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
          });
        }
      }
      
      // If all methods failed
      console.error('All socket toggle methods failed:', lastError);
      throw lastError;
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle socket';
      
      console.error('Error toggling socket:', err);
      setError(errorMessage);
      
      // Log error
      apiLogger?.addLog({
        type: 'error',
        method: 'POST',
        url: `gekko-proxy - Toggle ${socket.id}`,
        data: errorMessage,
        duration
      });
    }
  }, [socket]);

  const updateSchedule = useCallback((newSchedule: SocketSchedule[]) => {
    if (!socket) return;
    
    const updatedSocket = { ...socket, schedule: newSchedule };
    setSocket(updatedSocket);
    
    // Save to localStorage
    localStorage.setItem('garageSocketSchedule', JSON.stringify(newSchedule));
  }, [socket]);

  useEffect(() => {
    fetchSocketData();
    
    // Load schedule from localStorage
    const savedSchedule = localStorage.getItem('garageSocketSchedule');
    if (savedSchedule) {
      try {
        const schedule = JSON.parse(savedSchedule);
        setSocket(prev => prev ? { ...prev, schedule } : null);
      } catch (err) {
        console.warn('Failed to load saved schedule:', err);
      }
    }
  }, [fetchSocketData]);

  return {
    socket,
    isLoading,
    error,
    toggleSocket,
    updateSchedule,
    refetch: fetchSocketData
  };
}

function findGarageSocket(gekkoData: any): { id: string; name: string; location: string } | null {
  console.log('🔍 Searching for garage socket in myGEKKO data:', gekkoData);
  
  // Look through different categories for garage devices - including loads which are power sockets
  const categories = ['loads', 'devices', 'sockets', 'blinds', 'heating', 'lights'];
  
  for (const category of categories) {
    const categoryData = gekkoData[category];
    console.log(`🔍 Checking category: ${category}`, categoryData);
    
    if (categoryData && typeof categoryData === 'object') {
      for (const [itemKey, itemData] of Object.entries(categoryData)) {
        const item = itemData as any;
        console.log(`🔍 Checking item ${itemKey}:`, item);
        
        // For loads category, items don't have names/pages, so we'll use specific items
        if (category === 'loads') {
          // Look for active load items (value "1;0;" or "2;0;" indicates active loads)
          if (item.sumstate?.value && (item.sumstate.value.startsWith('1;') || item.sumstate.value.startsWith('2;'))) {
            // Try item6, item9, item15 as they show as active in the data
            if (itemKey === 'item6' || itemKey === 'item9' || itemKey === 'item15') {
              console.log(`✅ Found active load: ${itemKey}`);
              return {
                id: itemKey,
                name: `Power Socket ${itemKey.replace('item', '')}`,
                location: 'Garage/Utility'
              };
            }
          }
        } else if (item.name && item.page) {
          const name = item.name.toLowerCase();
          const page = item.page.toLowerCase();
          
          // Look for garage-related items
          if (page.includes('garage') || name.includes('garage') || 
              name.includes('steckdose') || name.includes('socket')) {
            console.log(`✅ Found garage device: ${itemKey} - ${item.name}`);
            return {
              id: itemKey,
              name: item.name,
              location: item.page
            };
          }
        }
      }
    }
  }
  
  console.log('❌ No garage socket found');
  return null;
}

function getSocketStatus(statusData: any, socketId: string): boolean {
  console.log(`🔍 Getting status for socket ${socketId}:`, statusData);
  
  // Look through status data to find the current state
  for (const [categoryName, category] of Object.entries(statusData)) {
    if (category && typeof category === 'object') {
      const categoryObj = category as any;
      if (categoryObj[socketId]) {
        const item = categoryObj[socketId];
        console.log(`✅ Found socket ${socketId} in ${categoryName}:`, item);
        
        // For loads category, check the sumstate value format
        if (categoryName === 'loads' && item.sumstate?.value) {
          const value = item.sumstate.value;
          console.log(`🔍 Load value: ${value}`);
          // Format is "state;power;" where state 0=off, 1=on, 2=forced on
          const isOn = value.startsWith('1') || value.startsWith('2');
          console.log(`✅ Socket ${socketId} is ${isOn ? 'ON' : 'OFF'}`);
          return isOn;
        }
        
        // Different devices might have different status formats
        if (item.sumstate?.value) {
          return item.sumstate.value.startsWith('1');
        }
        if (item.value !== undefined) {
          return item.value === '1' || item.value === 1;
        }
        if (item.state !== undefined) {
          return item.state === 'on' || item.state === '1';
        }
      }
    }
  }
  
  console.log(`❌ Socket ${socketId} not found in status data`);
  return false;
}