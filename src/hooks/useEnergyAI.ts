import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnergyReading {
  currentPower: number;
  dailyEnergy: number;
  batteryLevel: number;
  pvPower: number;
  gridPower: number;
  temperature?: number;
  humidity?: number;
  weather?: string;
  efficiencyScore?: number;
  costEstimate?: number;
}

interface EnergyInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  severity: string;
  category: string;
  metadata: any;
  created_at: string;
}

export function useEnergyAI() {
  const [insights, setInsights] = useState<EnergyInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const storeEnergyReading = async (reading: EnergyReading) => {
    try {
      const { error } = await supabase
        .from('energy_readings')
        .insert([{
          current_power: reading.currentPower,
          daily_energy: reading.dailyEnergy,
          battery_level: reading.batteryLevel,
          pv_power: reading.pvPower,
          grid_power: reading.gridPower,
          temperature: reading.temperature,
          humidity: reading.humidity,
          weather_condition: reading.weather,
          efficiency_score: reading.efficiencyScore,
          cost_estimate: reading.costEstimate,
        }]);

      if (error) {
        console.error('Error storing energy reading:', error);
      }
    } catch (error) {
      console.error('Error storing energy reading:', error);
    }
  };

  const triggerAIAnalysis = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      // Get recent energy readings
      const { data: readings, error: readingsError } = await supabase
        .from('energy_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (readingsError) {
        throw readingsError;
      }

      if (!readings || readings.length === 0) {
        console.log('No energy readings available for analysis');
        return;
      }

      // Call AI analysis function
      const { data, error } = await supabase.functions.invoke('energy-ai-analysis', {
        body: { readings }
      });

      if (error) {
        throw error;
      }

      if (data?.insights) {
        await fetchInsights();
        toast({
          title: "AI Analysis Complete",
          description: `Generated ${data.insights.length} new insights`,
        });
      }
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze energy data",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('energy_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return {
    insights,
    isAnalyzing,
    storeEnergyReading,
    triggerAIAnalysis,
    fetchInsights,
  };
}