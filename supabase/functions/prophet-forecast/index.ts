import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ForecastResponse {
  success: boolean;
  historical?: Array<{
    timestamp: string;
    actual: number;
  }>;
  forecast?: Array<{
    timestamp: string;
    predicted: number;
    lower: number;
    upper: number;
  }>;
  model_info?: {
    training_samples: number;
    forecast_horizon_hours: number;
    training_duration_ms: number;
    generated_at: string;
  };
  server_info?: {
    total_duration_ms: number;
    server_timestamp: string;
    live_data: boolean;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const useLiveData = url.searchParams.get('live') === 'true';
    
    const startTime = Date.now();
    console.log(`Calling Prophet forecast service (live: ${useLiveData})...`);

    // For demo purposes, we'll generate synthetic data directly in the edge function
    // In production, this would call your Prophet service or run the algorithm here
    const mockForecastResponse: ForecastResponse = await generateMockForecast(useLiveData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Prophet forecast completed in ${duration}ms`);
    
    // Add server timing information
    if (mockForecastResponse.success) {
      mockForecastResponse.server_info = {
        total_duration_ms: duration,
        server_timestamp: new Date().toISOString(),
        live_data: useLiveData
      };
    }

    return new Response(
      JSON.stringify(mockForecastResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Prophet forecast error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        server_info: {
          total_duration_ms: Date.now() - Date.now(),
          server_timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateMockForecast(useLiveData: boolean): Promise<ForecastResponse> {
  const trainingStart = Date.now();
  
  // Generate synthetic historical data (last 30 days, hourly)
  const now = new Date();
  const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const historical = [];
  const currentTime = new Date(startDate);
  
  while (currentTime < now) {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    
    // Daily pattern: higher consumption during day, lower at night
    const dailyPattern = 50 + 30 * Math.sin((hour - 6) * Math.PI / 12);
    
    // Weekly pattern: higher on weekdays
    const weeklyPattern = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 10 : -5;
    
    // Random noise
    const noise = (Math.random() - 0.5) * 10;
    
    // Combine all components
    const consumption = Math.max(0, dailyPattern + weeklyPattern + noise);
    
    historical.push({
      timestamp: currentTime.toISOString(),
      actual: Math.round(consumption * 100) / 100
    });
    
    currentTime.setHours(currentTime.getHours() + 1);
  }

  // Generate forecast for next 48 hours
  const forecast = [];
  const forecastStart = new Date(now);
  
  for (let i = 0; i < 48; i++) {
    const forecastTime = new Date(forecastStart.getTime() + (i * 60 * 60 * 1000));
    const hour = forecastTime.getHours();
    const dayOfWeek = forecastTime.getDay();
    
    // Base prediction using same patterns
    const dailyPattern = 50 + 30 * Math.sin((hour - 6) * Math.PI / 12);
    const weeklyPattern = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 10 : -5;
    
    // Add some trend
    const trend = i * 0.1;
    
    const predicted = Math.max(0, dailyPattern + weeklyPattern + trend);
    const confidence = 15; // ±15 kWh confidence interval
    
    forecast.push({
      timestamp: forecastTime.toISOString(),
      predicted: Math.round(predicted * 100) / 100,
      lower: Math.round((predicted - confidence) * 100) / 100,
      upper: Math.round((predicted + confidence) * 100) / 100
    });
  }

  const trainingEnd = Date.now();
  const trainingDuration = trainingEnd - trainingStart;

  return {
    success: true,
    historical: historical.slice(-72), // Last 3 days for chart
    forecast,
    model_info: {
      training_samples: historical.length,
      forecast_horizon_hours: 48,
      training_duration_ms: trainingDuration,
      generated_at: new Date().toISOString()
    }
  };
}