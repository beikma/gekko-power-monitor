import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OpenEMSEdge {
  id: string;
  name: string;
  online: boolean;
  lastMessage?: string;
}

export interface OpenEMSChannelValue {
  address: string;
  value: number | string | boolean;
  timestamp: string;
}

export interface OpenEMSHistoryData {
  timestamp: string;
  channels: Record<string, number>;
}

export const useOpenEMS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [edges, setEdges] = useState<OpenEMSEdge[]>([]);
  const [channels, setChannels] = useState<OpenEMSChannelValue[]>([]);
  const [historyData, setHistoryData] = useState<OpenEMSHistoryData[]>([]);
  const [isSimulation, setIsSimulation] = useState(true); // Default to simulation mode
  const { toast } = useToast();

  const callOpenEMS = async (method: string, params: any = {}, endpoint?: string) => {
    try {
      setIsLoading(true);
      
      // Update simulation status based on endpoint
      setIsSimulation(!endpoint);
      
      console.log(`🔌 Calling OpenEMS method: ${method}`, params);
      
      const { data, error } = await supabase.functions.invoke('openems-bridge', {
        body: { 
          method, 
          params,
          endpoint,
          // Add demo auth for Gitpod (usually demo/demo or admin/admin)
          auth: {
            username: 'admin',
            password: 'admin'
          }
        }
      });

      if (error) {
        console.error('OpenEMS Bridge Error:', error);
        toast({
          title: "OpenEMS Connection Error",
          description: error.message || 'Failed to connect to OpenEMS',
          variant: "destructive"
        });
        return null;
      }

      console.log('📥 OpenEMS Response:', data);

      if (!data.success) {
        console.error('OpenEMS API Error:', data.error);
        toast({
          title: "OpenEMS API Error", 
          description: data.error || 'OpenEMS request failed',
          variant: "destructive"
        });
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('OpenEMS Hook Error:', error);
      toast({
        title: "OpenEMS Error",
        description: 'Failed to communicate with OpenEMS',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get list of connected Edge devices
  const getEdgesStatus = async (edgeIds?: string[]) => {
    const result = await callOpenEMS('getEdgesStatus', {
      edgeIds: edgeIds || []
    });
    
    if (result?.result) {
      const edgesList = Object.entries(result.result).map(([id, status]: [string, any]) => ({
        id,
        name: id,
        online: status.online || false,
        lastMessage: status.lastMessage
      }));
      setEdges(edgesList);
      return edgesList;
    }
    return [];
  };

  // Get current channel values
  const getChannelsValues = async (edgeId: string, channelIds: string[]) => {
    const result = await callOpenEMS('getEdgesChannelsValues', {
      edgeIds: [edgeId],
      channels: channelIds
    });

    if (result?.result?.[edgeId]) {
      const channelValues = Object.entries(result.result[edgeId]).map(([address, value]: [string, any]) => ({
        address,
        value: value.value,
        timestamp: new Date().toISOString()
      }));
      setChannels(channelValues);
      return channelValues;
    }
    return [];
  };

  // Query historical timeseries data
  const queryHistoricData = async (
    edgeId: string, 
    channels: string[], 
    fromDate: Date, 
    toDate: Date,
    resolution?: number
  ) => {
    const result = await callOpenEMS('queryHistoricTimeseriesData', {
      edgeId,
      channels,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      resolution: resolution || 300 // 5 minutes default
    });

    if (result?.result?.timestamps && result?.result?.data) {
      const timestamps = result.result.timestamps;
      const dataPoints = result.result.data;
      
      const historyPoints = timestamps.map((timestamp: string, index: number) => ({
        timestamp,
        channels: Object.fromEntries(
          channels.map(channel => [
            channel,
            dataPoints[channel]?.[index] || 0
          ])
        )
      }));
      
      setHistoryData(historyPoints);
      return historyPoints;
    }
    return [];
  };

  // Set channel value (control device)
  const setChannelValue = async (edgeId: string, channelAddress: string, value: any) => {
    return await callOpenEMS('setChannelsValue', {
      edgeId,
      channels: {
        [channelAddress]: value
      }
    });
  };

  // Test connection to OpenEMS
  const testConnection = async (customEndpoint?: string) => {
    const result = await callOpenEMS('getEdgesStatus', {}, customEndpoint);
    return !!result;
  };

  return {
    isLoading,
    edges,
    channels,
    historyData,
    callOpenEMS,
    getEdgesStatus,
    getChannelsValues,
    queryHistoricData,
    setChannelValue,
    testConnection,
    isSimulation
  };
};