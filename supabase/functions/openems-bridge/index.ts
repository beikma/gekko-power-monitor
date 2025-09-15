import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenEMSRequest {
  method: string;
  params?: any;
  endpoint?: string; // For direct OpenEMS Backend connections
  auth?: {
    username: string;
    password: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { method, params, endpoint, auth }: OpenEMSRequest = await req.json();
    
    console.log(`🔌 OpenEMS Bridge: ${method}`, { params, endpoint });
    
    // Default to Gitpod demo endpoint if no specific endpoint provided
    const targetUrl = endpoint || 'https://3000-openems-openems-gitpod-demo.ws-eu107.gitpod.io/rest/jsonrpc';
    
    // Prepare JSON-RPC request
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params: params || {}
    };

    console.log(`📡 Sending to OpenEMS:`, { url: targetUrl, request: jsonRpcRequest });

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add basic auth if provided
    if (auth?.username && auth?.password) {
      const credentials = btoa(`${auth.username}:${auth.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    // Forward request to OpenEMS Backend
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(jsonRpcRequest),
    });

    const responseText = await response.text();
    console.log(`📥 OpenEMS Response (${response.status}):`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse OpenEMS response as JSON:', error);
      data = { rawResponse: responseText };
    }

    // Return standardized response
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        data: response.ok ? data : null,
        error: response.ok ? null : data.error || 'OpenEMS request failed',
        rawResponse: !response.ok ? responseText : undefined
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('OpenEMS Bridge Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal bridge error'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
})