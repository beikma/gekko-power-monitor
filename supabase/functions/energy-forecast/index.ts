import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface ForecastPoint {
  timestamp: string;
  predicted: number;
  lower: number;
  upper: number;
}

interface HistoricalPoint {
  timestamp: string;
  actual: number;
}

interface ForecastResponse {
  success: boolean;
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  backtest?: BacktestResult;
  model_info: {
    training_samples: number;
    forecast_horizon_hours: number;
    generated_at: string;
    training_duration_ms: number;
    algorithm: string;
  };
  error?: string;
}

interface BacktestResult {
  backtest_date: string;
  forecast_points: ForecastPoint[];
  actual_points: HistoricalPoint[];
  accuracy_metrics: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    mae: number;  // Mean Absolute Error
    accuracy_score: number; // Overall accuracy percentage
  };
}

// Simple time series forecasting using trend analysis and seasonality
class SimpleForecast {
  private data: { timestamp: Date; value: number }[];
  
  constructor(data: { timestamp: Date; value: number }[]) {
    this.data = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  // Calculate linear trend
  private calculateTrend(): { slope: number; intercept: number } {
    const n = this.data.length;
    const x = this.data.map((_, i) => i);
    const y = this.data.map(d => d.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }
  
  // Calculate daily seasonal pattern (24-hour cycle)
  private calculateDailySeasonality(): number[] {
    const hourlyAverage = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    
    this.data.forEach(point => {
      const hour = point.timestamp.getHours();
      hourlyAverage[hour] += point.value;
      hourlyCounts[hour]++;
    });
    
    // Calculate average for each hour
    for (let i = 0; i < 24; i++) {
      if (hourlyCounts[i] > 0) {
        hourlyAverage[i] /= hourlyCounts[i];
      }
    }
    
    // Normalize around zero
    const overallAverage = hourlyAverage.reduce((a, b) => a + b, 0) / 24;
    return hourlyAverage.map(val => val - overallAverage);
  }
  
  // Calculate weekly seasonal pattern
  private calculateWeeklySeasonality(): number[] {
    const dailyAverage = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);
    
    this.data.forEach(point => {
      const dayOfWeek = point.timestamp.getDay();
      dailyAverage[dayOfWeek] += point.value;
      dailyCounts[dayOfWeek]++;
    });
    
    // Calculate average for each day
    for (let i = 0; i < 7; i++) {
      if (dailyCounts[i] > 0) {
        dailyAverage[i] /= dailyCounts[i];
      }
    }
    
    // Normalize around zero
    const overallAverage = dailyAverage.reduce((a, b) => a + b, 0) / 7;
    return dailyAverage.map(val => val - overallAverage);
  }
  
  // Generate forecast
  predict(hours: number): ForecastPoint[] {
    const trend = this.calculateTrend();
    const dailySeasonality = this.calculateDailySeasonality();
    const weeklySeasonality = this.calculateWeeklySeasonality();
    
    // Calculate residual standard deviation for confidence bands
    const predictions = this.data.map((point, i) => {
      const trendValue = trend.slope * i + trend.intercept;
      const hour = point.timestamp.getHours();
      const dayOfWeek = point.timestamp.getDay();
      return trendValue + dailySeasonality[hour] + weeklySeasonality[dayOfWeek];
    });
    
    const residuals = this.data.map((point, i) => point.value - predictions[i]);
    const residualStd = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    
    // Generate future predictions
    const lastTimestamp = this.data[this.data.length - 1].timestamp;
    const forecast: ForecastPoint[] = [];
    
    for (let i = 1; i <= hours; i++) {
      const futureTimestamp = new Date(lastTimestamp.getTime() + i * 60 * 60 * 1000); // Add hours
      const futureIndex = this.data.length + i;
      
      // Trend component
      const trendValue = trend.slope * futureIndex + trend.intercept;
      
      // Seasonal components
      const hour = futureTimestamp.getHours();
      const dayOfWeek = futureTimestamp.getDay();
      const dailySeasonal = dailySeasonality[hour] || 0;
      const weeklySeasonal = weeklySeasonality[dayOfWeek] || 0;
      
      // Combine components
      const predicted = Math.max(0, trendValue + dailySeasonal + weeklySeasonal);
      
      // Confidence intervals (assuming normal distribution)
      const confidenceMultiplier = 1.96; // 95% confidence interval
      const margin = confidenceMultiplier * residualStd;
      
      forecast.push({
        timestamp: futureTimestamp.toISOString(),
        predicted: Math.round(predicted * 100) / 100,
        lower: Math.max(0, Math.round((predicted - margin) * 100) / 100),
        upper: Math.round((predicted + margin) * 100) / 100
      });
    }
    
    return forecast;
  }
}

// Calculate accuracy metrics for backtesting
function calculateAccuracyMetrics(
  forecast: ForecastPoint[], 
  actual: HistoricalPoint[]
): { mape: number; rmse: number; mae: number; accuracy_score: number } {
  if (forecast.length === 0 || actual.length === 0) {
    return { mape: 100, rmse: 0, mae: 0, accuracy_score: 0 };
  }

  let totalAbsoluteError = 0;
  let totalSquaredError = 0;
  let totalPercentageError = 0;
  let validComparisons = 0;

  // Match forecast points with actual points by timestamp
  forecast.forEach(fPoint => {
    const matchingActual = actual.find(aPoint => 
      Math.abs(new Date(fPoint.timestamp).getTime() - new Date(aPoint.timestamp).getTime()) < 60 * 60 * 1000 // Within 1 hour
    );
    
    if (matchingActual && matchingActual.actual > 0) {
      const error = Math.abs(fPoint.predicted - matchingActual.actual);
      const percentError = (error / matchingActual.actual) * 100;
      
      totalAbsoluteError += error;
      totalSquaredError += error * error;
      totalPercentageError += percentError;
      validComparisons++;
    }
  });

  if (validComparisons === 0) {
    return { mape: 100, rmse: 0, mae: 0, accuracy_score: 0 };
  }

  const mape = totalPercentageError / validComparisons;
  const mae = totalAbsoluteError / validComparisons;
  const rmse = Math.sqrt(totalSquaredError / validComparisons);
  const accuracy_score = Math.max(0, 100 - mape);

  return {
    mape: Math.round(mape * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    mae: Math.round(mae * 100) / 100,
    accuracy_score: Math.round(accuracy_score * 100) / 100
  };
}
function generateSyntheticData(): { timestamp: Date; value: number }[] {
  const data: { timestamp: Date; value: number }[] = [];
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  
  for (let d = new Date(startDate); d <= endDate; d.setHours(d.getHours() + 1)) {
    const hour = d.getHours();
    const dayOfWeek = d.getDay();
    
    // Base consumption with realistic patterns
    let consumption = 40; // Base load
    
    // Daily pattern: higher during day (6 AM to 10 PM)
    if (hour >= 6 && hour <= 22) {
      consumption += 20 + 15 * Math.sin((hour - 6) * Math.PI / 16);
    }
    
    // Weekly pattern: higher on weekdays
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      consumption += 10;
    }
    
    // Add some trend over time
    const daysSinceStart = (d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    consumption += daysSinceStart * 0.1;
    
    // Add random noise
    consumption += (Math.random() - 0.5) * 10;
    
    // Ensure non-negative
    consumption = Math.max(5, consumption);
    
    data.push({
      timestamp: new Date(d),
      value: consumption
    });
  }
  
  return data;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
    // Parse query parameters
    const url = new URL(req.url);
    const useLiveData = url.searchParams.get('live') === 'true';
    const forecastHours = parseInt(url.searchParams.get('hours') || '48');
    const backtestMode = url.searchParams.get('backtest') === 'true';
    const backtestDaysAgo = parseInt(url.searchParams.get('backtest_days') || '3');
    
    console.log(`Generating forecast for ${forecastHours} hours (live: ${useLiveData}, backtest: ${backtestMode})`);

    let backtestResult: BacktestResult | undefined;
    let backtestDate: Date | undefined;
    
    if (backtestMode) {
      backtestDate = new Date();
      backtestDate.setDate(backtestDate.getDate() - backtestDaysAgo);
      backtestDate.setHours(backtestDate.getHours(), 0, 0, 0); // Round to hour
      console.log(`Backtesting from: ${backtestDate.toISOString()}`);
    }
    
    // Generate or fetch data
    let data: { timestamp: Date; value: number }[];
    
    if (useLiveData) {
      // Fetch real energy data from database
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
        const supabaseUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheXR0d21tZGN1YmZqcXJwenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzQ3MzcsImV4cCI6MjA3MzI1MDczN30.40c-xV4k_w8k5TX7xtWUBOn2MU1yif6FzfYDE5e3tNI';
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Fetch last 30 days of hourly energy data
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const { data: energyData, error } = await supabase
          .from('energy_readings')
          .select('recorded_at, current_power, daily_energy')
          .gte('recorded_at', thirtyDaysAgo.toISOString())
          .order('recorded_at', { ascending: true });
        
        if (error) {
          console.error('Database query error:', error);
          throw new Error(`Failed to fetch energy data: ${error.message}`);
        }
        
        if (!energyData || energyData.length === 0) {
          console.log('No recent energy data found, falling back to synthetic data');
          data = generateSyntheticData();
        } else {
          console.log(`Found ${energyData.length} real energy records`);
          data = energyData.map(record => ({
            timestamp: new Date(record.recorded_at),
            value: parseFloat(record.current_power) || 0
          }));
        }
      } catch (dbError) {
        console.error('Error fetching live data:', dbError);
        console.log('Falling back to synthetic data');
        data = generateSyntheticData();
      }
    } else {
      data = generateSyntheticData();
    }
    
    // Perform backtesting if requested
    if (backtestMode && backtestDate && useLiveData) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
        const supabaseUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheXR0d21tZGN1YmZqcXJwenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzQ3MzcsImV4cCI6MjA3MzI1MDczN30.40c-xV4k_w8k5TX7xtWUBOn2MU1yif6FzfYDE5e3tNI';
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get training data up to the backtest date
        const thirtyDaysBeforeBacktest = new Date(backtestDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const { data: trainingData, error: trainingError } = await supabase
          .from('energy_readings')
          .select('recorded_at, current_power')
          .gte('recorded_at', thirtyDaysBeforeBacktest.toISOString())
          .lt('recorded_at', backtestDate.toISOString())
          .order('recorded_at', { ascending: true });
        
        if (!trainingError && trainingData && trainingData.length > 0) {
          // Create model with historical data up to backtest date
          const backtestTrainingData = trainingData.map(record => ({
            timestamp: new Date(record.recorded_at),
            value: parseFloat(record.current_power) || 0
          }));
          
          const backtestForecaster = new SimpleForecast(backtestTrainingData);
          const backtestForecast = backtestForecaster.predict(forecastHours);
          
          // Get actual data for the forecast period to compare against
          const forecastEndDate = new Date(backtestDate.getTime() + forecastHours * 60 * 60 * 1000);
          
          const { data: actualData, error: actualError } = await supabase
            .from('energy_readings')
            .select('recorded_at, current_power')
            .gte('recorded_at', backtestDate.toISOString())
            .lte('recorded_at', forecastEndDate.toISOString())
            .order('recorded_at', { ascending: true });
          
          if (!actualError && actualData && actualData.length > 0) {
            const actualPoints: HistoricalPoint[] = actualData.map(record => ({
              timestamp: record.recorded_at,
              actual: parseFloat(record.current_power) || 0
            }));
            
            const accuracyMetrics = calculateAccuracyMetrics(backtestForecast, actualPoints);
            
            backtestResult = {
              backtest_date: backtestDate.toISOString(),
              forecast_points: backtestForecast,
              actual_points: actualPoints,
              accuracy_metrics: accuracyMetrics
            };
            
            console.log(`Backtest completed - MAPE: ${accuracyMetrics.mape}%, Accuracy: ${accuracyMetrics.accuracy_score}%`);
          }
        }
      } catch (backtestError) {
        console.error('Backtesting failed:', backtestError);
      }
    }
    
    // Create forecasting model
    const forecaster = new SimpleForecast(data);
    
    // Generate forecast
    const forecast = forecaster.predict(forecastHours);
    
    // Prepare historical data (last 72 hours for context)
    const historical: HistoricalPoint[] = data
      .slice(-72)
      .map(point => ({
        timestamp: point.timestamp.toISOString(),
        actual: Math.round(point.value * 100) / 100
      }));
    
    const endTime = Date.now();
    const trainingDuration = endTime - startTime;
    
    const response: ForecastResponse = {
      success: true,
      historical,
      forecast,
      backtest: backtestResult,
      model_info: {
        training_samples: data.length,
        forecast_horizon_hours: forecastHours,
        generated_at: new Date().toISOString(),
        training_duration_ms: trainingDuration,
        algorithm: useLiveData ? 'Simple Trend + Seasonality (using real energy data)' : 'Simple Trend + Seasonality (synthetic demo data)'
      }
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Forecast error:', error);
    
    const errorResponse: ForecastResponse = {
      success: false,
      historical: [],
      forecast: [],
      model_info: {
        training_samples: 0,
        forecast_horizon_hours: 0,
        generated_at: new Date().toISOString(),
        training_duration_ms: 0,
        algorithm: 'error'
      },
      error: error.message
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})