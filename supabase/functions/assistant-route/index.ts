import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssistantRequest {
  intent: string;
  text: string;
  params?: Record<string, any>;
}

interface AssistantResponse {
  success: boolean;
  intent: string;
  tool?: string;
  data?: any;
  text: string;
  speechText: string;
  error?: string;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Maximum 20 requests per minute.',
          speechText: 'Sorry, you are sending requests too quickly. Please wait a moment.'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { intent, text, params = {} }: AssistantRequest = await req.json();
    
    console.log(`Processing intent: ${intent} with text: "${text}"`);

    let response: AssistantResponse;

    switch (intent) {
      case 'weather':
        response = await handleWeatherIntent(params);
        break;
      case 'health':
        response = await handleHealthIntent();
        break;
      case 'forecast':
        response = await handleForecastIntent(params);
        break;
      case 'lights':
        response = await handleLightsIntent(text);
        break;
      default:
        response = {
          success: false,
          intent,
          text: `I don't understand the intent "${intent}". Try asking about weather, health, forecast, or lights.`,
          speechText: `I don't understand that request. Try asking about weather, system health, energy forecast, or lights.`,
          error: 'Unknown intent'
        };
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Assistant route error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        speechText: 'Sorry, I encountered an error processing your request.',
        text: 'An internal error occurred.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleWeatherIntent(params: any): Promise<AssistantResponse> {
  try {
    const { lat = 46.7944, lon = 11.9464, hours = 24 } = params;
    
    // Call the Open-Meteo weather function
    const response = await fetch('https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/open-meteo-weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, hours })
    });

    if (!response.ok) {
      throw new Error('Weather service unavailable');
    }

    const weatherData = await response.json();
    
    if (!weatherData.success) {
      throw new Error(weatherData.error || 'Weather data unavailable');
    }

    // Extract current and upcoming weather
    const forecast = weatherData.data.forecast || [];
    const now = forecast[0];
    const next6h = forecast.slice(0, 6);
    
    if (!now) {
      throw new Error('No current weather data available');
    }

    const currentTemp = Math.round(now.temperature || 0);
    const minTemp = Math.round(Math.min(...next6h.map(f => f.temperature || 0)));
    const maxTemp = Math.round(Math.max(...next6h.map(f => f.temperature || 0)));
    const avgSolar = Math.round(next6h.reduce((sum, f) => sum + (f.solar_radiation || 0), 0) / next6h.length);

    const speechText = `Current temperature is ${currentTemp} degrees. Next 6 hours: ${minTemp} to ${maxTemp} degrees, with average solar radiation of ${avgSolar} watts per square meter.`;
    
    const text = `Weather forecast for Bruneck: Current ${currentTemp}°C, next 6h range ${minTemp}°C to ${maxTemp}°C, avg solar ${avgSolar} W/m²`;

    return {
      success: true,
      intent: 'weather',
      tool: 'open-meteo-weather',
      data: weatherData.data,
      text,
      speechText
    };

  } catch (error) {
    return {
      success: false,
      intent: 'weather',
      error: error.message,
      text: 'Weather data is currently unavailable.',
      speechText: 'Sorry, I cannot get weather information right now.'
    };
  }
}

async function handleHealthIntent(): Promise<AssistantResponse> {
  try {
    // Simple health check - could be expanded to check multiple services
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        assistant: 'operational',
        weather: 'operational',
        forecast: 'operational'
      }
    };

    const speechText = 'All systems are operational and healthy.';
    const text = 'System status: All services operational';

    return {
      success: true,
      intent: 'health',
      tool: 'system-health',
      data: healthData,
      text,
      speechText
    };

  } catch (error) {
    return {
      success: false,
      intent: 'health',
      error: error.message,
      text: 'Health check failed.',
      speechText: 'I cannot check system health right now.'
    };
  }
}

async function handleForecastIntent(params: any): Promise<AssistantResponse> {
  try {
    const { hours = 48 } = params;
    
    // Call the Prophet forecast function
    const response = await fetch('https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/prophet-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours })
    });

    if (!response.ok) {
      throw new Error('Forecast service unavailable');
    }

    const forecastData = await response.json();
    
    if (!forecastData.success) {
      throw new Error(forecastData.error || 'Forecast data unavailable');
    }

    // Analyze the forecast
    const forecast = forecastData.forecast || [];
    const next6h = forecast.slice(0, 6);
    const next24h = forecast.slice(0, 24);
    
    if (next6h.length === 0) {
      throw new Error('No forecast data available');
    }

    const currentPredicted = Math.round(next6h[0]?.predicted || 0);
    const peakNext6h = Math.round(Math.max(...next6h.map(f => f.predicted || 0)));
    const avgNext24h = Math.round(next24h.reduce((sum, f) => sum + (f.predicted || 0), 0) / next24h.length);
    const totalNext24h = Math.round(next24h.reduce((sum, f) => sum + (f.predicted || 0), 0));

    const speechText = `Current predicted consumption is ${currentPredicted} kilowatt hours. Peak in next 6 hours: ${peakNext6h}. Average for next 24 hours: ${avgNext24h}, with total consumption of ${totalNext24h} kilowatt hours.`;
    
    const text = `Energy forecast: Current ${currentPredicted} kWh, 6h peak ${peakNext6h} kWh, 24h avg ${avgNext24h} kWh (total ${totalNext24h} kWh)`;

    return {
      success: true,
      intent: 'forecast',
      tool: 'prophet-forecast',
      data: forecastData,
      text,
      speechText
    };

  } catch (error) {
    return {
      success: false,
      intent: 'forecast',
      error: error.message,
      text: 'Energy forecast is currently unavailable.',
      speechText: 'Sorry, I cannot get energy forecast information right now.'
    };
  }
}

async function handleLightsIntent(text: string): Promise<AssistantResponse> {
  try {
    // This would integrate with the GEKKO light control
    // For now, return a mock response
    const action = text.toLowerCase().includes('on') || text.toLowerCase().includes('turn on') ? 'on' : 
                   text.toLowerCase().includes('off') || text.toLowerCase().includes('turn off') ? 'off' : 'status';

    const speechText = action === 'on' ? 'I would turn the lights on, but light control is not yet connected to this assistant.' :
                       action === 'off' ? 'I would turn the lights off, but light control is not yet connected to this assistant.' :
                       'Light control is available but not yet integrated with the voice assistant.';
    
    const text = `Light control: ${action} command recognized (integration pending)`;

    return {
      success: true,
      intent: 'lights',
      tool: 'light-control',
      data: { action, status: 'mock' },
      text,
      speechText
    };

  } catch (error) {
    return {
      success: false,
      intent: 'lights',
      error: error.message,
      text: 'Light control is unavailable.',
      speechText: 'Sorry, I cannot control lights right now.'
    };
  }
}