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
    
    // Default endpoints - try multiple fallbacks
    const defaultEndpoints = [
      'https://demo.openems.io/rest/jsonrpc',
      'https://openems.fenecon.de/rest/jsonrpc', 
      'http://localhost:8084/rest/jsonrpc', // Local development
    ];
    
    const targetUrl = endpoint || defaultEndpoints[0];
    
    // Try to connect to real OpenEMS first, fallback to simulation
    let useSimulation = false;
    
    // Check if we should use simulation mode (for demo purposes)
    if (!endpoint) {
      useSimulation = true;
    }
    
    // Prepare JSON-RPC request
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params: params || {}
    };

    console.log(`📡 Sending to OpenEMS:`, { url: targetUrl, request: jsonRpcRequest, useSimulation });

    // Simulation mode for demo purposes
    if (useSimulation) {
      console.log('🎭 Using OpenEMS simulation mode');
      return generateSimulationResponse(method, params || {});
    }

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

// Simulation functions for demo purposes
function generateSimulationResponse(method: string, params: any) {
  const now = new Date();
  const baseResponse = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
  };

  switch (method) {
    case 'getEdgesStatus':
      return new Response(JSON.stringify({
        success: true,
        status: 200,
        data: {
          ...baseResponse,
          result: {
            "edge0": { online: true, lastMessage: now.toISOString() },
            "demo-edge": { online: true, lastMessage: now.toISOString() },
            "simulation-edge": { online: true, lastMessage: now.toISOString() }
          }
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      });

    case 'getEdgesChannelsValues':
      const currentHour = now.getHours();
      const consumption = 2000 + Math.sin(currentHour * Math.PI / 12) * 1500; // 500-3500W cycle
      const production = Math.max(0, Math.sin((currentHour - 6) * Math.PI / 12) * 4000); // Solar curve
      const gridPower = consumption - production;
      const batteryPower = Math.random() * 1000 - 500; // ±500W

      return new Response(JSON.stringify({
        success: true,
        status: 200,
        data: {
          ...baseResponse,
          result: {
            "edge0": {
              "_sum/GridActivePower": { value: Math.round(gridPower) },
              "_sum/ProductionActivePower": { value: Math.round(production) },
              "_sum/ConsumptionActivePower": { value: Math.round(consumption) },
              "_sum/EssActivePower": { value: Math.round(batteryPower) },
              "_sum/EssSoc": { value: Math.round(50 + Math.sin(currentHour * Math.PI / 6) * 30) },
              "meter0/ActivePower": { value: Math.round(gridPower) },
              "ess0/ActivePower": { value: Math.round(batteryPower) },
              "ess0/Soc": { value: Math.round(50 + Math.sin(currentHour * Math.PI / 6) * 30) }
            }
          }
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      });

    case 'queryHistoricTimeseriesData':
      const { fromDate, toDate, channels = [] } = params;
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const timestamps = [];
      const data: Record<string, number[]> = {};
      
      // Initialize channel arrays
      channels.forEach((channel: string) => {
        data[channel] = [];
      });

      // Generate hourly data points
      for (let time = new Date(start); time <= end; time.setHours(time.getHours() + 1)) {
        timestamps.push(time.toISOString());
        
        const hour = time.getHours();
        channels.forEach((channel: string) => {
          let value = 0;
          
          if (channel.includes('Consumption')) {
            value = 2000 + Math.sin(hour * Math.PI / 12) * 1500;
          } else if (channel.includes('Production')) {
            value = Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 4000);
          } else if (channel.includes('Grid')) {
            const consumption = 2000 + Math.sin(hour * Math.PI / 12) * 1500;
            const production = Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 4000);
            value = consumption - production;
          }
          
          data[channel].push(Math.round(value + (Math.random() - 0.5) * 200));
        });
      }

      return new Response(JSON.stringify({
        success: true,
        status: 200,
        data: {
          ...baseResponse,
          result: {
            timestamps,
            data
          }
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      });

    default:
      return new Response(JSON.stringify({
        success: false,
        error: `Simulation for method '${method}' not implemented`
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 501
      });
  }
}