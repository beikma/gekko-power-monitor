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
  const recentReadings = readings.slice(0, 50); // Last 50 readings
  
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
  const prompt = `
You are an expert energy management AI analyzing building energy consumption data. Based on the following energy data, generate actionable insights for a facility manager.

Data Summary:
${JSON.stringify(dataSummary.summary, null, 2)}

Generate 3-5 specific, actionable insights focusing on:
1. Energy efficiency improvements
2. Cost savings opportunities  
3. Predictive maintenance needs
4. CO2 reduction strategies
5. Load optimization recommendations

For each insight, provide:
- insight_type: one of "efficiency", "cost_optimization", "maintenance", "sustainability", "load_management"
- title: Short, specific title (max 60 chars)
- description: Detailed recommendation with specific actions (max 200 chars)
- confidence_score: 0-100 based on data quality and pattern strength
- severity: "low", "medium", "high" based on impact potential
- category: "energy", "cost", "maintenance", "sustainability", or "optimization"
- metadata: relevant numbers, thresholds, or technical details

Respond only with valid JSON array format:
[{"insight_type": "...", "title": "...", "description": "...", "confidence_score": 85, "severity": "medium", "category": "energy", "metadata": {...}}]
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert energy management consultant specializing in building automation and efficiency optimization. Provide practical, data-driven recommendations.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', content);
    
    // Clean and parse the response
    const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const insights = JSON.parse(cleanContent);
    
    if (!Array.isArray(insights)) {
      throw new Error('OpenAI response is not an array');
    }

    return insights.map(insight => ({
      insight_type: insight.insight_type || 'general',
      title: insight.title?.substring(0, 60) || 'Energy Insight',
      description: insight.description?.substring(0, 200) || 'AI-generated recommendation',
      confidence_score: Math.min(Math.max(insight.confidence_score || 70, 0), 100),
      severity: ['low', 'medium', 'high'].includes(insight.severity) ? insight.severity : 'medium',
      category: ['energy', 'cost', 'maintenance', 'sustainability', 'optimization'].includes(insight.category) ? insight.category : 'energy',
      metadata: insight.metadata || {}
    }));

  } catch (error) {
    console.error('Error generating AI insights:', error);
    
    // Fallback insights based on data patterns
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