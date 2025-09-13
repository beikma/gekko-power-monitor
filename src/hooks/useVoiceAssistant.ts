import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface VoiceResponse {
  success: boolean;
  intent: string;
  confidence: number;
  message: string;
  speechText: string;
  data?: any;
  responseTime: number;
}

export function useVoiceAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const { toast } = useToast();

  const processCommand = useCallback(async (text: string): Promise<VoiceResponse> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: {
          text,
          userId: 'demo-user',
          clientIp: 'unknown'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const response: VoiceResponse = {
        success: data.success || false,
        intent: data.intent || 'unknown',
        confidence: data.confidence || 0,
        message: data.message || 'No response',
        speechText: data.speechText || data.message || 'No response',
        data: data.data,
        responseTime: data.responseTime || 0
      };

      setLastResponse(response);

      return response;
    } catch (error) {
      const errorResponse: VoiceResponse = {
        success: false,
        intent: 'error',
        confidence: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        speechText: 'Sorry, I encountered an error processing your request.',
        responseTime: 0
      };
      
      setLastResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    return await processCommand('system health');
  }, [processCommand]);

  return {
    isLoading,
    lastResponse,
    processCommand,
    testConnection
  };
}