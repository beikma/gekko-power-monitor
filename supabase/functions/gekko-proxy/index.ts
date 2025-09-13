import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const index = url.searchParams.get('index'); // For command index

    if (!endpoint || !username || !key || !gekkoid) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build the myGEKKO API URL using original authentication format
    const gekkoParams = new URLSearchParams({
      username,
      key,
      gekkoid,
    });

    let gekkoUrl;
    let requestOptions: RequestInit = {
      method: req.method,
    };

    // Handle different myGEKKO API endpoints
    if (endpoint === 'var/scmd' && index && value !== null) {
      // Try different command formats - myGEKKO might need specific command format
      gekkoParams.append('index', index);
      gekkoParams.append('value', value);
      gekkoUrl = `https://live.my-gekko.com/api/v1/var/${endpoint}?${gekkoParams}`;
      requestOptions.method = 'GET';
      
      console.log(`🔧 Trying var/scmd format: index=${index}, value=${value}`);
    } else if (endpoint === 'scmd' && index && value !== null) {
      // Alternative: Direct scmd endpoint
      gekkoParams.append('index', index);
      gekkoParams.append('value', value);
      gekkoUrl = `https://live.my-gekko.com/api/v1/${endpoint}?${gekkoParams}`;
      requestOptions.method = 'GET';
      
      console.log(`🔧 Trying direct scmd format: index=${index}, value=${value}`);
    } else if (endpoint.includes('lights/') && endpoint.includes('/scmd') && value !== null) {
      // Try lights-specific command format
      gekkoParams.append('value', value);
      gekkoUrl = `https://live.my-gekko.com/api/v1/var/${endpoint}?${gekkoParams}`;
      requestOptions.method = 'GET';
      
      console.log(`🔧 Trying lights/scmd format: ${endpoint}, value=${value}`);
    } else if (endpoint.startsWith('list/')) {
      // Handle alarm list endpoints - these use a different API structure
      const startrow = url.searchParams.get('startrow') || '0';
      const rowcount = url.searchParams.get('rowcount') || '100';
      const year = url.searchParams.get('year') || new Date().getFullYear().toString();
      
      gekkoParams.append('startrow', startrow);
      gekkoParams.append('rowcount', rowcount);
      gekkoParams.append('year', year);
      
      gekkoUrl = `https://live.my-gekko.com/api/v1/${endpoint}?${gekkoParams}`;
      requestOptions.method = 'GET';
      
      console.log(`🚨 Trying alarm list format: ${endpoint} with startrow=${startrow}, rowcount=${rowcount}, year=${year}`);
    } else {
      // For regular GET requests (status, info, etc.)
      gekkoUrl = `https://live.my-gekko.com/api/v1/${endpoint}?${gekkoParams}`;
      requestOptions.method = 'GET';
    }
    
    console.log(`Proxying ${req.method} request to: ${gekkoUrl}`);
    console.log(`Request method: ${requestOptions.method}, Body: ${requestOptions.body || 'none'}`);

    // Make the request to myGEKKO API
    const response = await fetch(gekkoUrl, requestOptions);
    
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