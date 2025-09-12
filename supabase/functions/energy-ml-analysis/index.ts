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

interface MLAnalysisRequest {
  analysis_type: 'seasonal' | 'weather_correlation' | 'predictive' | 'anomaly_detection' | 'optimization';
  date_range?: {
    start: string;
    end: string;
  };
  lookback_days?: number;
}

interface MLInsight {
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  severity: string;
  category: string;
  metadata: any;
}

serve(async (req) => {
  console.log('ML Energy Analysis function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MLAnalysisRequest = await req.json();
    const analysisType = body.analysis_type || 'seasonal';
    const lookbackDays = body.lookback_days || 30;

    console.log(`Running ML analysis: ${analysisType}, lookback: ${lookbackDays} days`);

    // Fetch historical data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - lookbackDays);

    const { data: historicalData, error } = await supabase
      .from('energy_readings')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!historicalData || historicalData.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient historical data for ML analysis',
          message: `Found only ${historicalData?.length || 0} records. Need at least 10 for meaningful analysis.`
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analyzing ${historicalData.length} historical records`);

    // Perform ML analysis based on type
    let insights: MLInsight[] = [];

    switch (analysisType) {
      case 'seasonal':
        insights = await performSeasonalAnalysis(historicalData);
        break;
      case 'weather_correlation':
        insights = await performWeatherCorrelation(historicalData);
        break;
      case 'predictive':
        insights = await performPredictiveAnalysis(historicalData);
        break;
      case 'anomaly_detection':
        insights = await performAnomalyDetection(historicalData);
        break;
      case 'optimization':
        insights = await performOptimizationAnalysis(historicalData);
        break;
      default:
        insights = await performSeasonalAnalysis(historicalData);
    }

    // Store insights
    const storedInsights = await storeMLInsights(insights);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis_type: analysisType,
        data_points_analyzed: historicalData.length,
        insights: storedInsights,
        message: `ML Analysis complete: ${insights.length} insights generated`
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ML energy analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform ML analysis', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function performSeasonalAnalysis(data: any[]): Promise<MLInsight[]> {
  const insights: MLInsight[] = [];
  
  // Group by hour of day to find patterns
  const hourlyPatterns = new Map();
  data.forEach(record => {
    const hour = new Date(record.recorded_at).getHours();
    if (!hourlyPatterns.has(hour)) {
      hourlyPatterns.set(hour, []);
    }
    hourlyPatterns.get(hour).push({
      power: record.current_power,
      pv: record.pv_power,
      battery: record.battery_level
    });
  });

  // Find peak consumption hours
  const hourlyAvgs = Array.from(hourlyPatterns.entries()).map(([hour, records]) => ({
    hour,
    avgPower: records.reduce((sum: number, r: any) => sum + r.power, 0) / records.length,
    avgPV: records.reduce((sum: number, r: any) => sum + r.pv, 0) / records.length,
  }));

  const peakHour = hourlyAvgs.reduce((max, current) => 
    current.avgPower > max.avgPower ? current : max
  );

  insights.push({
    insight_type: 'load_management',
    title: 'Peak Usage Pattern Identified',
    description: `Peak consumption consistently occurs at ${peakHour.hour}:00 with ${peakHour.avgPower.toFixed(2)}kW average. Consider load shifting.`,
    confidence_score: 85,
    severity: 'medium',
    category: 'optimization',
    metadata: {
      peak_hour: peakHour.hour,
      peak_power: peakHour.avgPower,
      analysis_type: 'seasonal_hourly'
    }
  });

  // Day vs Night efficiency
  const dayRecords = data.filter(r => {
    const hour = new Date(r.recorded_at).getHours();
    return hour >= 6 && hour <= 18;
  });
  
  const nightRecords = data.filter(r => {
    const hour = new Date(r.recorded_at).getHours();
    return hour < 6 || hour > 18;
  });

  if (dayRecords.length > 0 && nightRecords.length > 0) {
    const dayAvgPower = dayRecords.reduce((sum, r) => sum + r.current_power, 0) / dayRecords.length;
    const nightAvgPower = nightRecords.reduce((sum, r) => sum + r.current_power, 0) / nightRecords.length;
    
    const dayNightRatio = dayAvgPower / nightAvgPower;
    
    if (dayNightRatio > 1.5) {
      insights.push({
        insight_type: 'efficiency',
        title: 'High Daytime Energy Usage',
        description: `Daytime usage is ${dayNightRatio.toFixed(1)}x higher than nighttime. Optimize for solar self-consumption.`,
        confidence_score: 90,
        severity: 'medium',
        category: 'efficiency',
        metadata: {
          day_avg: dayAvgPower,
          night_avg: nightAvgPower,
          ratio: dayNightRatio
        }
      });
    }
  }

  return insights;
}

async function performWeatherCorrelation(data: any[]): Promise<MLInsight[]> {
  const insights: MLInsight[] = [];
  
  const tempRecords = data.filter(r => r.temperature !== null);
  if (tempRecords.length < 10) {
    return [{
      insight_type: 'general',
      title: 'Weather Data Insufficient',
      description: 'Not enough temperature data for weather correlation analysis. Consider adding weather sensors.',
      confidence_score: 100,
      severity: 'low',
      category: 'maintenance',
      metadata: { available_temp_records: tempRecords.length }
    }];
  }

  // Temperature vs consumption correlation
  const tempPowerPairs = tempRecords.map(r => ({
    temp: r.temperature,
    power: r.current_power,
    pv: r.pv_power
  }));

  // Simple correlation calculation
  const avgTemp = tempPowerPairs.reduce((sum, p) => sum + p.temp, 0) / tempPowerPairs.length;
  const avgPower = tempPowerPairs.reduce((sum, p) => sum + p.power, 0) / tempPowerPairs.length;

  const correlation = tempPowerPairs.reduce((sum, p) => 
    sum + (p.temp - avgTemp) * (p.power - avgPower), 0) / tempPowerPairs.length;

  if (Math.abs(correlation) > 0.5) {
    const direction = correlation > 0 ? 'increases' : 'decreases';
    insights.push({
      insight_type: 'sustainability',
      title: 'Temperature-Usage Correlation Found',
      description: `Energy consumption strongly ${direction} with temperature. Correlation: ${(correlation * 100).toFixed(0)}%.`,
      confidence_score: 80,
      severity: 'medium',
      category: 'efficiency',
      metadata: {
        correlation_coefficient: correlation,
        avg_temp: avgTemp,
        temp_range: {
          min: Math.min(...tempPowerPairs.map(p => p.temp)),
          max: Math.max(...tempPowerPairs.map(p => p.temp))
        }
      }
    });
  }

  return insights;
}

async function performPredictiveAnalysis(data: any[]): Promise<MLInsight[]> {
  const insights: MLInsight[] = [];
  
  // Trend analysis - linear regression on recent data
  const recentDays = 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - recentDays);
  
  const recentData = data.filter(r => new Date(r.recorded_at) >= cutoffDate);
  
  if (recentData.length < 10) {
    return [{
      insight_type: 'general',
      title: 'Insufficient Recent Data',
      description: 'Need more recent data for predictive analysis.',
      confidence_score: 100,
      severity: 'low',
      category: 'maintenance',
      metadata: { recent_records: recentData.length }
    }];
  }

  // Daily energy trend
  const dailyTotals = new Map();
  recentData.forEach(r => {
    const date = new Date(r.recorded_at).toDateString();
    if (!dailyTotals.has(date)) {
      dailyTotals.set(date, { total: 0, count: 0 });
    }
    const current = dailyTotals.get(date);
    dailyTotals.set(date, { 
      total: Math.max(current.total, r.daily_energy),
      count: current.count + 1 
    });
  });

  const dailyValues = Array.from(dailyTotals.values()).map(d => d.total);
  
  if (dailyValues.length >= 3) {
    const trend = (dailyValues[dailyValues.length - 1] - dailyValues[0]) / dailyValues.length;
    
    if (Math.abs(trend) > 0.5) {
      const direction = trend > 0 ? 'increasing' : 'decreasing';
      const predicted = dailyValues[dailyValues.length - 1] + trend;
      
      insights.push({
        insight_type: 'prediction',
        title: `Energy Usage Trending ${direction}`,
        description: `Daily energy ${direction} by ${Math.abs(trend).toFixed(1)}kWh/day. Tomorrow predicted: ${predicted.toFixed(1)}kWh.`,
        confidence_score: 75,
        severity: Math.abs(trend) > 2 ? 'high' : 'medium',
        category: 'optimization',
        metadata: {
          trend_kwh_per_day: trend,
          current_daily: dailyValues[dailyValues.length - 1],
          predicted_tomorrow: predicted,
          days_analyzed: dailyValues.length
        }
      });
    }
  }

  return insights;
}

async function performAnomalyDetection(data: any[]): Promise<MLInsight[]> {
  const insights: MLInsight[] = [];
  
  // Statistical anomaly detection using standard deviation
  const powers = data.map(r => r.current_power);
  const avgPower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
  const stdDev = Math.sqrt(powers.reduce((sum, p) => sum + Math.pow(p - avgPower, 2), 0) / powers.length);
  
  const anomalies = data.filter(r => Math.abs(r.current_power - avgPower) > 2 * stdDev);
  
  if (anomalies.length > 0) {
    const anomalyRate = (anomalies.length / data.length) * 100;
    
    insights.push({
      insight_type: 'maintenance',
      title: 'Power Consumption Anomalies Detected',
      description: `Found ${anomalies.length} anomalous readings (${anomalyRate.toFixed(1)}% of data). May indicate equipment issues.`,
      confidence_score: 85,
      severity: anomalyRate > 5 ? 'high' : 'medium',
      category: 'maintenance',
      metadata: {
        anomaly_count: anomalies.length,
        anomaly_rate: anomalyRate,
        avg_power: avgPower,
        std_deviation: stdDev,
        max_anomaly: Math.max(...anomalies.map(a => a.current_power))
      }
    });
  }

  return insights;
}

async function performOptimizationAnalysis(data: any[]): Promise<MLInsight[]> {
  const insights: MLInsight[] = [];
  
  // Self-consumption optimization
  const validRecords = data.filter(r => r.pv_power > 0 && r.grid_power >= 0);
  
  if (validRecords.length > 0) {
    const totalPV = validRecords.reduce((sum, r) => sum + r.pv_power, 0);
    const totalGrid = validRecords.reduce((sum, r) => sum + r.grid_power, 0);
    const selfConsumptionRatio = ((totalPV - totalGrid) / totalPV) * 100;
    
    if (selfConsumptionRatio < 70) {
      insights.push({
        insight_type: 'optimization',
        title: 'Self-Consumption Optimization Potential',
        description: `Current self-consumption: ${selfConsumptionRatio.toFixed(1)}%. Target 70%+ for optimal savings.`,
        confidence_score: 90,
        severity: 'medium',
        category: 'cost',
        metadata: {
          current_ratio: selfConsumptionRatio,
          target_ratio: 70,
          potential_savings_kwh: (totalGrid * 0.3).toFixed(1)
        }
      });
    }
  }

  // Battery utilization analysis
  const batteryData = data.filter(r => r.battery_level !== null);
  if (batteryData.length > 0) {
    const avgBattery = batteryData.reduce((sum, r) => sum + r.battery_level, 0) / batteryData.length;
    const batteryUsage = batteryData.filter(r => r.battery_level < 90).length / batteryData.length * 100;
    
    if (batteryUsage < 50) {
      insights.push({
        insight_type: 'optimization',
        title: 'Battery Underutilization',
        description: `Battery usage is only ${batteryUsage.toFixed(0)}%. Consider adjusting charging/discharging strategy.`,
        confidence_score: 80,
        severity: 'medium',
        category: 'optimization',
        metadata: {
          avg_battery_level: avgBattery,
          usage_percentage: batteryUsage,
          optimization_potential: 'increase_cycling'
        }
      });
    }
  }

  return insights;
}

async function storeMLInsights(insights: MLInsight[]) {
  // Clear old ML insights
  await supabase
    .from('energy_insights')
    .delete()
    .like('metadata->analysis_type', '%ml_%');

  // Insert new ML insights
  const { data, error } = await supabase
    .from('energy_insights')
    .insert(
      insights.map(insight => ({
        ...insight,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        metadata: {
          ...insight.metadata,
          analysis_type: `ml_${insight.insight_type}`,
          generated_at: new Date().toISOString()
        }
      }))
    )
    .select();

  if (error) {
    console.error('Error storing ML insights:', error);
    throw error;
  }

  return data;
}