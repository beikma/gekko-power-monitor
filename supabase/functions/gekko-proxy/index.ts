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

    const gekkoUrl = `https://live.my-gekko.com/api/v1/${endpoint}?${gekkoParams}`;
    
    console.log(`Proxying request to: ${gekkoUrl}`);

    // Make the request to myGEKKO API
    const response = await fetch(gekkoUrl);
    
    if (!response.ok) {
      console.error(`myGEKKO API error: ${response.status} - ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `API Error: ${response.status}` }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched data from myGEKKO API');

    return new Response(
      JSON.stringify(data),
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