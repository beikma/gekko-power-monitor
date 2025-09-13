import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherRequest {
  lat: number;
  lon: number;
  hours?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lat, lon, hours = 48 }: WeatherRequest = await req.json();
    
    // Validate inputs
    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (lat < -90 || lat > 90) {
      return new Response(
        JSON.stringify({ error: 'Latitude must be between -90 and 90' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({ error: 'Longitude must be between -180 and 180' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (hours < 1 || hours > 168) {
      return new Response(
        JSON.stringify({ error: 'Hours must be between 1 and 168' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const startTime = Date.now();
    console.log(`Fetching weather for ${lat}, ${lon} for ${hours} hours`);

    // Call Open-Meteo API with minimal, guaranteed parameters
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: 'temperature_2m,shortwave_radiation',
      timezone: 'auto'
    });

    const apiUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    console.log(`Calling Open-Meteo API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Lovable-OpenMeteo-Test/1.0.0'
      }
    });

    console.log(`Open-Meteo response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Open-Meteo API error:', response.status, response.statusText, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Open-Meteo API error: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Open-Meteo response data keys:', Object.keys(data));
    
    if (!data.hourly || !data.hourly.time) {
      console.error('Invalid response format:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response format from Open-Meteo API' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Normalize data and limit to requested hours
    const timestamps = data.hourly.time.slice(0, hours);
    const temperature = data.hourly.temperature_2m ? data.hourly.temperature_2m.slice(0, hours) : [];
    const solarRadiation = data.hourly.shortwave_radiation ? data.hourly.shortwave_radiation.slice(0, hours) : [];

    // Fill missing values with null
    while (temperature.length < timestamps.length) {
      temperature.push(null);
    }
    while (solarRadiation.length < timestamps.length) {
      solarRadiation.push(null);
    }

    const result = {
      success: true,
      data: {
        timestamps,
        temperature,
        solar_radiation: solarRadiation
      },
      location: {
        latitude: lat,
        longitude: lon,
        timezone: data.timezone || 'UTC',
        elevation: data.elevation || null
      },
      metadata: {
        source: 'Open-Meteo',
        requestedHours: hours,
        actualHours: timestamps.length,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`Weather data fetched successfully in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Weather function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})