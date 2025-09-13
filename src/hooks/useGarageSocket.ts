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
    
    try {
      const newState = !socket.isOn;
      
      // Send command to myGEKKO
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const baseParams = new URLSearchParams({
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3',
        value: newState ? '1' : '0'
      });

      const response = await fetch(`${proxyUrl}?endpoint=var/${socket.id}/scmd&${baseParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to toggle socket: ${response.status}`);
      }

      // Update local state
      setSocket(prev => prev ? { ...prev, isOn: newState } : null);
    } catch (err) {
      console.error('Error toggling socket:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle socket');
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
  // Look through different categories for garage devices
  const categories = ['devices', 'sockets', 'blinds', 'heating', 'lights'];
  
  for (const category of categories) {
    const categoryData = gekkoData[category];
    if (categoryData && typeof categoryData === 'object') {
      for (const [itemKey, itemData] of Object.entries(categoryData)) {
        const item = itemData as any;
        if (item.name && item.page) {
          const name = item.name.toLowerCase();
          const page = item.page.toLowerCase();
          
          // Look for garage-related items
          if (page.includes('garage') || name.includes('garage') || 
              name.includes('steckdose') || name.includes('socket')) {
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
  
  return null;
}

function getSocketStatus(statusData: any, socketId: string): boolean {
  // Look through status data to find the current state
  for (const category of Object.values(statusData)) {
    if (category && typeof category === 'object') {
      const categoryObj = category as any;
      if (categoryObj[socketId]) {
        const item = categoryObj[socketId];
        
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
  
  return false;
}