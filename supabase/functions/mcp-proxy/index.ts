import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tool, args, mcpUrl, token } = await req.json();
    
    // Default MCP server URL (can be overridden)
    const targetUrl = mcpUrl || 'http://localhost:8787/mcp/tools';
    
    // Forward request to MCP server
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool, args }),
    });

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        data: response.ok ? data : null,
        error: response.ok ? null : data.error || 'MCP request failed'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('MCP Proxy Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal proxy error'
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