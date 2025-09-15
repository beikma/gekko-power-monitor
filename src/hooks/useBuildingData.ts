import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ManualBuildingInfo {
  id?: string;
  building_name: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  total_area?: number;
  floors?: number;
  rooms?: number;
  year_built?: number;
  building_type?: string;
  usage_type?: string;
  occupancy?: number;
  energy_rating?: string;
  heating_system?: string;
  cooling_system?: string;
  renewable_energy?: boolean;
  solar_panels?: boolean;
  image_url?: string;
  notes?: string;
}

export function useBuildingData() {
  const [manualInfo, setManualInfo] = useState<ManualBuildingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchBuildingInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('building_info')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setManualInfo(data[0]);
      }
    } catch (error) {
      console.error('Error fetching building info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBuildingInfo = async (info: ManualBuildingInfo) => {
    setIsSaving(true);
    
    try {
      let result;
      
      if (manualInfo?.id) {
        // Update existing record
        result = await supabase
          .from('building_info')
          .update(info)
          .eq('id', manualInfo.id)
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('building_info')
          .insert([info])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setManualInfo(result.data);
      
      toast({
        title: "Building Information Saved",
        description: "Building data has been successfully updated.",
      });

      return result.data;
    } catch (error) {
      console.error('Error saving building info:', error);
      toast({
        title: "Save Error",
        description: "Failed to save building information. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBuildingInfo = async () => {
    if (!manualInfo?.id) return;

    try {
      const { error } = await supabase
        .from('building_info')
        .delete()
        .eq('id', manualInfo.id);

      if (error) {
        throw error;
      }

      setManualInfo(null);
      
      toast({
        title: "Building Information Deleted",
        description: "Building data has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting building info:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete building information. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBuildingInfo();
  }, [fetchBuildingInfo]);

  return {
    manualInfo,
    isLoading,
    isSaving,
    saveBuildingInfo,
    deleteBuildingInfo,
    refetch: fetchBuildingInfo,
  };
}