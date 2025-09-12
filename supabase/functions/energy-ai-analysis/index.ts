import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

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
  console.log('Energy AI Analysis function called');

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

    // Prepare data summary for AI analysis
    const dataSummary = prepareDataSummary(readings);
    console.log('Data summary prepared:', dataSummary);

    // Generate AI insights
    const insights = await generateAIInsights(dataSummary);
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
    console.error('Error in energy AI analysis:', error);
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

function prepareDataSummary(readings: EnergyReading[]) {
  // Use only last 20 readings for faster processing
  const recentReadings = readings.slice(0, 20);
  
  // Calculate averages and trends
  const avgPower = recentReadings.reduce((sum, r) => sum + (r.current_power || 0), 0) / recentReadings.length;
  const avgPV = recentReadings.reduce((sum, r) => sum + (r.pv_power || 0), 0) / recentReadings.length;
  const avgBattery = recentReadings.reduce((sum, r) => sum + (r.battery_level || 0), 0) / recentReadings.length;
  const avgGrid = recentReadings.reduce((sum, r) => sum + (r.grid_power || 0), 0) / recentReadings.length;
  const avgEfficiency = recentReadings.reduce((sum, r) => sum + (r.efficiency_score || 100), 0) / recentReadings.length;

  // Calculate daily totals
  const dailyEnergies = recentReadings.map(r => r.daily_energy || 0);
  const maxDailyEnergy = Math.max(...dailyEnergies);
  const minDailyEnergy = Math.min(...dailyEnergies);

  // Calculate trends (simplified - compare first half vs second half)
  const firstHalf = recentReadings.slice(0, Math.floor(recentReadings.length / 2));
  const secondHalf = recentReadings.slice(Math.floor(recentReadings.length / 2));
  
  const avgPowerFirst = firstHalf.reduce((sum, r) => sum + (r.current_power || 0), 0) / firstHalf.length;
  const avgPowerSecond = secondHalf.reduce((sum, r) => sum + (r.current_power || 0), 0) / secondHalf.length;
  const powerTrend = avgPowerSecond > avgPowerFirst ? 'increasing' : avgPowerSecond < avgPowerFirst ? 'decreasing' : 'stable';

  const avgPVFirst = firstHalf.reduce((sum, r) => sum + (r.pv_power || 0), 0) / firstHalf.length;
  const avgPVSecond = secondHalf.reduce((sum, r) => sum + (r.pv_power || 0), 0) / secondHalf.length;
  const pvTrend = avgPVSecond > avgPVFirst ? 'increasing' : avgPVSecond < avgPVFirst ? 'decreasing' : 'stable';

  // Calculate self-consumption ratio
  const selfConsumptionRatio = avgPV > 0 ? ((avgPV - avgGrid) / avgPV) * 100 : 0;

  // Identify peak usage times
  const hourlyUsage = new Map();
  recentReadings.forEach(reading => {
    const hour = new Date(reading.created_at).getHours();
    const current = hourlyUsage.get(hour) || { total: 0, count: 0 };
    hourlyUsage.set(hour, { 
      total: current.total + (reading.current_power || 0), 
      count: current.count + 1 
    });
  });

  const avgHourlyUsage = Array.from(hourlyUsage.entries()).map(([hour, data]) => ({
    hour,
    avgPower: data.total / data.count
  }));

  const peakHour = avgHourlyUsage.reduce((max, current) => 
    current.avgPower > max.avgPower ? current : max, 
    { hour: 0, avgPower: 0 }
  );

  return {
    summary: {
      totalReadings: readings.length,
      timespan: `${new Date(readings[readings.length - 1]?.created_at).toLocaleString()} to ${new Date(readings[0]?.created_at).toLocaleString()}`,
      averages: {
        power: parseFloat(avgPower.toFixed(2)),
        pvGeneration: parseFloat(avgPV.toFixed(2)),
        batteryLevel: parseFloat(avgBattery.toFixed(1)),
        gridImport: parseFloat(avgGrid.toFixed(2)),
        efficiency: parseFloat(avgEfficiency.toFixed(1))
      },
      trends: {
        powerConsumption: powerTrend,
        pvGeneration: pvTrend,
        selfConsumptionRatio: parseFloat(selfConsumptionRatio.toFixed(1))
      },
      energyRange: {
        maxDaily: parseFloat(maxDailyEnergy.toFixed(2)),
        minDaily: parseFloat(minDailyEnergy.toFixed(2))
      },
      peakUsage: {
        hour: peakHour.hour,
        avgPower: parseFloat(peakHour.avgPower.toFixed(2))
      }
    }
  };
}

async function generateAIInsights(dataSummary: any): Promise<InsightResult[]> {
  console.log('Generating pattern-based insights from energy data...');
  
  // For now, skip OpenAI and use only pattern-based insights for reliability
  return generateFallbackInsights(dataSummary);
}

function generateFallbackInsights(dataSummary: any): InsightResult[] {
  const fallbackInsights: InsightResult[] = [];
  
  if (dataSummary.summary.trends.selfConsumptionRatio < 60) {
    fallbackInsights.push({
      insight_type: 'efficiency',
      title: 'Improve Solar Self-Consumption',
      description: `Current self-consumption is ${dataSummary.summary.trends.selfConsumptionRatio}%. Shift loads to daylight hours to reduce grid dependency and costs.`,
      confidence_score: 80,
      severity: 'medium',
      category: 'efficiency',
      metadata: { current_ratio: dataSummary.summary.trends.selfConsumptionRatio, target_ratio: 75 }
    });
  }

  if (dataSummary.summary.averages.batteryLevel < 30) {
    fallbackInsights.push({
      insight_type: 'maintenance',  
      title: 'Battery System Check Required',
      description: `Average battery level is ${dataSummary.summary.averages.batteryLevel}%. Schedule maintenance to ensure optimal storage capacity.`,
      confidence_score: 90,
      severity: 'high',
      category: 'maintenance',
      metadata: { avg_battery_level: dataSummary.summary.averages.batteryLevel }
    });
  }

  if (dataSummary.summary.peakUsage.hour >= 18 && dataSummary.summary.peakUsage.hour <= 20) {
    fallbackInsights.push({
      insight_type: 'cost_optimization',
      title: 'Peak Load Shifting Opportunity',
      description: `Peak usage at ${dataSummary.summary.peakUsage.hour}:00. Pre-cool building during solar hours to reduce evening grid consumption.`,
      confidence_score: 75,
      severity: 'medium',
      category: 'cost',
      metadata: { peak_hour: dataSummary.summary.peakUsage.hour, peak_power: dataSummary.summary.peakUsage.avgPower }
    });
  }

  return fallbackInsights.length > 0 ? fallbackInsights : [{
    insight_type: 'general',
    title: 'Data Analysis Complete',
    description: 'Energy patterns analyzed. System operating within normal parameters. Continue monitoring for optimization opportunities.',
    confidence_score: 60,
    severity: 'low',
    category: 'energy',
    metadata: { analysis_timestamp: new Date().toISOString() }
  }];
}

async function storeInsights(insights: InsightResult[]) {
  // Clear old insights first (optional - or implement expiry logic)
  await supabase
    .from('energy_insights')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Delete insights older than 24h

  // Insert new insights
  const { data, error } = await supabase
    .from('energy_insights')
    .insert(
      insights.map(insight => ({
        ...insight,
        is_active: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire in 7 days
      }))
    )
    .select();

  if (error) {
    console.error('Error storing insights:', error);
    throw error;
  }

  console.log('Stored insights:', data);
  return data;
}