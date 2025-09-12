import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EnergyReading {
  id: string;
  current_power: number;
  daily_energy: number;
  battery_level: number;
  pv_power: number;
  grid_power: number;
  temperature?: number;
  humidity?: number;
  weather_condition?: string;
  efficiency_score?: number;
  cost_estimate?: number;
  created_at: string;
}

interface InsightResult {
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  severity: string;
  category: string;
  metadata: any;
}

serve(async (req) => {
  console.log('Simple Energy AI Analysis function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { readings } = await req.json();
    
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      console.log('No readings provided for analysis');
      return new Response(
        JSON.stringify({ error: 'No energy readings provided' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analyzing ${readings.length} energy readings`);

    // Generate pattern-based insights
    const insights = generatePatternInsights(readings);
    console.log(`Generated ${insights.length} insights`);

    // Store insights in database
    const storedInsights = await storeInsights(insights);
    console.log('Insights stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights: storedInsights,
        message: `Generated ${insights.length} energy insights`
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in simple energy AI analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze energy data', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generatePatternInsights(readings: EnergyReading[]): InsightResult[] {
  const insights: InsightResult[] = [];
  
  // Use only last 10 readings for quick analysis
  const recentReadings = readings.slice(0, 10);
  
  if (recentReadings.length === 0) {
    return [{
      insight_type: 'general',
      title: 'No Data Available',
      description: 'No recent energy readings available for analysis.',
      confidence_score: 100,
      severity: 'low',
      category: 'energy',
      metadata: { timestamp: new Date().toISOString() }
    }];
  }

  // Calculate basic metrics
  const avgPower = recentReadings.reduce((sum, r) => sum + (r.current_power || 0), 0) / recentReadings.length;
  const avgPV = recentReadings.reduce((sum, r) => sum + (r.pv_power || 0), 0) / recentReadings.length;
  const avgBattery = recentReadings.reduce((sum, r) => sum + (r.battery_level || 0), 0) / recentReadings.length;
  const avgGrid = recentReadings.reduce((sum, r) => sum + (r.grid_power || 0), 0) / recentReadings.length;
  
  // Calculate self-consumption ratio
  const selfConsumptionRatio = avgPV > 0 ? ((avgPV - avgGrid) / avgPV) * 100 : 0;

  console.log('Analysis metrics:', { avgPower, avgPV, avgBattery, avgGrid, selfConsumptionRatio });

  // Generate insights based on patterns
  if (selfConsumptionRatio < 60) {
    insights.push({
      insight_type: 'efficiency',
      title: 'Improve Solar Self-Consumption',
      description: `Current self-consumption is ${selfConsumptionRatio.toFixed(1)}%. Shift energy-intensive tasks to daylight hours to reduce grid dependency.`,
      confidence_score: 85,
      severity: 'medium',
      category: 'efficiency',
      metadata: { current_ratio: selfConsumptionRatio, target_ratio: 75, avg_pv: avgPV, avg_grid: avgGrid }
    });
  }

  if (avgBattery < 30) {
    insights.push({
      insight_type: 'maintenance',
      title: 'Battery System Check Required',
      description: `Average battery level is ${avgBattery.toFixed(1)}%. Schedule maintenance to ensure optimal storage capacity.`,
      confidence_score: 90,
      severity: 'high',
      category: 'maintenance',
      metadata: { avg_battery_level: avgBattery }
    });
  }

  if (avgPower > 2.5) {
    insights.push({
      insight_type: 'cost_optimization',
      title: 'High Energy Consumption Detected',
      description: `Current average consumption is ${avgPower.toFixed(2)} kW. Consider load scheduling or efficiency improvements.`,
      confidence_score: 80,
      severity: 'medium',
      category: 'cost',
      metadata: { avg_power: avgPower, threshold: 2.5 }
    });
  }

  if (avgPV > 2.0) {
    insights.push({
      insight_type: 'sustainability',
      title: 'Strong Solar Generation',
      description: `Excellent solar generation averaging ${avgPV.toFixed(2)} kW. Consider expanding storage or adding electric vehicle charging.`,
      confidence_score: 75,
      severity: 'low',
      category: 'sustainability',
      metadata: { avg_pv_generation: avgPV }
    });
  }

  // Always include at least one insight
  if (insights.length === 0) {
    insights.push({
      insight_type: 'general',
      title: 'System Operating Normally',
      description: 'Energy patterns analyzed. System operating within normal parameters. Continue monitoring for optimization opportunities.',
      confidence_score: 70,
      severity: 'low',
      category: 'energy',
      metadata: { 
        avg_power: avgPower,
        avg_pv: avgPV,
        avg_battery: avgBattery,
        analysis_timestamp: new Date().toISOString() 
      }
    });
  }

  return insights;
}

async function storeInsights(insights: InsightResult[]) {
  try {
    // Clear old insights first
    await supabase
      .from('energy_insights')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Insert new insights
    const { data, error } = await supabase
      .from('energy_insights')
      .insert(
        insights.map(insight => ({
          ...insight,
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
      )
      .select();

    if (error) {
      console.error('Error storing insights:', error);
      throw error;
    }

    console.log('Stored insights:', data);
    return data;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}