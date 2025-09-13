import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Point {
  id: string;
  point_id: string;
  name: string;
  room: string | null;
  type: string;
  unit: string | null;
  is_controllable: boolean;
  min_value: number | null;
  max_value: number | null;
  current_value: string | null;
  last_updated: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function usePoints() {
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .order('room', { ascending: true });

      if (error) {
        throw error;
      }

      setPoints(data || []);
    } catch (err) {
      console.error('Error fetching points:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch points');
    } finally {
      setIsLoading(false);
    }
  };

  const getControllablePoints = () => {
    return points.filter(point => point.is_controllable);
  };

  const getSensorPoints = () => {
    return points.filter(point => !point.is_controllable);
  };

  const getPointsByRoom = (room: string) => {
    return points.filter(point => 
      point.room?.toLowerCase().includes(room.toLowerCase())
    );
  };

  const getPointsByType = (type: string) => {
    return points.filter(point => point.type === type);
  };

  return {
    points,
    isLoading,
    error,
    refetch: fetchPoints,
    getControllablePoints,
    getSensorPoints,
    getPointsByRoom,
    getPointsByType
  };
}