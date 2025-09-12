import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const username = url.searchParams.get('username');
    const key = url.searchParams.get('key');
    const gekkoid = url.searchParams.get('gekkoid');
    const value = url.searchParams.get('value'); // For command requests

    if (!endpoint || !username || !key || !gekkoid) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build the myGEKKO API URL
    const gekkoParams = new URLSearchParams({
      username,
      key,
      gekkoid,
    });

    // Add value parameter if it's a command request (POST) and value is provided
    if (req.method === 'POST' && value !== null) {
      gekkoParams.append('value', value);
    }

    const gekkoUrl = `https://live.my-gekko.com/api/v1/${endpoint}?${gekkoParams}`;
    
    console.log(`Proxying ${req.method} request to: ${gekkoUrl}`);

    // Make the request to myGEKKO API with same method
    const response = await fetch(gekkoUrl, {
      method: req.method,
      headers: req.method === 'POST' ? {
        'Content-Type': 'application/json'
      } : undefined
    });
    
    if (!response.ok) {
      console.error(`myGEKKO API error: ${response.status} - ${response.statusText}`);
      
      // Handle specific error codes
      if (response.status === 410) {
        console.error('myGEKKO API: Resource permanently unavailable (410 Gone). This may indicate invalid credentials or discontinued service.');
        return new Response(
          JSON.stringify({ 
            error: `API Error: ${response.status}`, 
            message: 'myGEKKO resource no longer available. Please check your credentials.',
            code: 'RESOURCE_GONE'
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `API Error: ${response.status}` }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.text(); // Use text() instead of json() in case of command responses
    console.log(`Successfully processed ${req.method} request to myGEKKO API`);

    // Try to parse as JSON, but return as text if it fails
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch {
      responseData = { result: data }; // Wrap plain text responses
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});