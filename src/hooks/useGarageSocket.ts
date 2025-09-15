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
      // Use correct myGEKKO API format: /var/lights/itemX/scmd/set
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const value = newState ? '1' : '0';
      const baseParams = new URLSearchParams({
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
      });

      // Use correct myGEKKO API format: /var/lights/itemX/scmd/set
      const cmdParams = new URLSearchParams({
        endpoint: `var/lights/${socket.id}/scmd/set`,
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3',
        value: value
      });

      console.log(`🚀 Command API call: var/lights/${socket.id}/scmd/set with value=${value}`);
      const response = await fetch(`${proxyUrl}?${cmdParams}`);
      const responseText = await response.text();
      const duration = Date.now() - startTime;
      
      console.log(`📡 API Response → ${response.status}: ${responseText}`);
      
      // Log response
      apiLogger?.addLog({
        type: response.ok ? 'response' : 'error',
        method: 'POST',
        url: `MyGekko API - var/lights/${socket.id}/scmd/set`,
        status: response.status,
        data: responseText,
        duration
      });
      
      if (response.ok) {
        setSocket(prev => prev ? { ...prev, isOn: newState } : null);
        console.log(`✅ Socket toggle successful`);
        
        // Refresh data after successful command with a small delay
        setTimeout(() => {
          fetchSocketData();
        }, 1500); // Wait 1.5 seconds for myGEKKO to process the command
        
        return;
      } else {
        throw new Error(`HTTP ${response.status} - ${responseText}`);
      }
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
  console.log('🔍 Searching for controllable garage socket in myGEKKO data:', gekkoData);
  
  // First priority: Look in lights section for controllable items
  if (gekkoData.lights && typeof gekkoData.lights === 'object') {
    for (const [itemKey, itemData] of Object.entries(gekkoData.lights)) {
      const item = itemData as any;
      console.log(`🔍 Checking lights/${itemKey}:`, item);
      
      // Look for items that could be sockets/outlets
      if (item.name && item.page && item.scmd?.index) {
        const name = item.name.toLowerCase();
        const page = item.page.toLowerCase();
        
        // Look for garage-related items, parking spots (Stellplatz), or generic outlets
        if (page.includes('garage') || name.includes('garage') || 
            name.includes('stellplatz') || name.includes('parking') ||
            name.includes('steckdose') || name.includes('socket') ||
            name.includes('outlet') || name.includes('power') ||
            itemKey === 'item24') { // Based on user's screenshot showing item24 as garage
          console.log(`✅ Found controllable garage device: ${itemKey} - ${item.name} (index: ${item.scmd.index})`);
          return {
            id: itemKey,
            name: item.name,
            location: item.page
          };
        }
      }
    }
  }
  
  // Fallback: Look for any controllable light item (some might actually be sockets)
  if (gekkoData.lights && typeof gekkoData.lights === 'object') {
    for (const [itemKey, itemData] of Object.entries(gekkoData.lights)) {
      const item = itemData as any;
      if (item.scmd?.index) {
        console.log(`✅ Found controllable item as fallback: ${itemKey} - ${item.name || 'Unknown'} (index: ${item.scmd.index})`);
        return {
          id: itemKey,
          name: item.name || `Controllable Device ${itemKey.replace('item', '')}`,
          location: item.page || 'Unknown'
        };
      }
    }
  }
  
  console.log('❌ No controllable garage socket found');
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