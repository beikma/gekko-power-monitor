import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const VoiceRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  userId: z.string().optional(),
  clientIp: z.string().optional()
});

const SetPointSchema = z.object({
  point: z.string(),
  value: z.union([z.string(), z.number()]),
  room: z.string().optional()
});

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// MCP client for myGEKKO integration
async function callMCP(tool: string, args: any = {}) {
  const mcpUrl = 'http://localhost:8787/mcp/tools';
  const token = 'default-token-change-me';
  
  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool, args })
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('MCP Error:', error);
    throw new Error('Failed to connect to building control system');
  }
}

// Intent classification with rule-based approach
function classifyIntent(text: string): { intent: string; confidence: number; params: any } {
  const lowerText = text.toLowerCase();
  
  // Set point patterns
  if (lowerText.includes('set') && (lowerText.includes('temperature') || lowerText.includes('light') || lowerText.includes('to'))) {
    const tempMatch = lowerText.match(/set.*?temperature.*?to\s*(\d+(?:\.\d+)?)/);
    const lightMatch = lowerText.match(/set.*?light.*?to\s*(\d+(?:\.\d+)?)/);
    const roomMatch = lowerText.match(/(office|lobby|living|kitchen|bedroom|bathroom)/);
    
    if (tempMatch) {
      return {
        intent: 'set_point',
        confidence: 0.9,
        params: {
          type: 'temperature',
          value: parseFloat(tempMatch[1]),
          room: roomMatch?.[1] || 'office',
          unit: '°C'
        }
      };
    }
    
    if (lightMatch) {
      return {
        intent: 'set_point',
        confidence: 0.9,
        params: {
          type: 'light',
          value: parseInt(lightMatch[1]),
          room: roomMatch?.[1] || 'lobby',
          unit: '%'
        }
      };
    }
  }
  
  // Read point patterns
  if (lowerText.includes('what') || lowerText.includes('temperature') || lowerText.includes('status') || lowerText.includes('current')) {
    const roomMatch = lowerText.match(/(office|lobby|living|kitchen|bedroom|bathroom)/);
    
    if (lowerText.includes('temperature')) {
      return {
        intent: 'read_point',
        confidence: 0.8,
        params: {
          type: 'temperature',
          room: roomMatch?.[1] || 'office'
        }
      };
    }
    
    if (lowerText.includes('light') || lowerText.includes('brightness')) {
      return {
        intent: 'read_point',
        confidence: 0.8,
        params: {
          type: 'light',
          room: roomMatch?.[1] || 'lobby'
        }
      };
    }
    
    if (lowerText.includes('boiler') || lowerText.includes('heating')) {
      return {
        intent: 'read_point',
        confidence: 0.8,
        params: {
          type: 'switch',
          room: 'technical room'
        }
      };
    }
  }
  
  // List points
  if (lowerText.includes('list') || lowerText.includes('show all') || lowerText.includes('available')) {
    return {
      intent: 'list_points',
      confidence: 0.8,
      params: {}
    };
  }
  
  // System health
  if (lowerText.includes('health') || lowerText.includes('system') || lowerText.includes('status')) {
    return {
      intent: 'health',
      confidence: 0.7,
      params: {}
    };
  }
  
  // History/consumption
  if (lowerText.includes('energy') || lowerText.includes('consumption') || lowerText.includes('history') || lowerText.includes('today') || lowerText.includes('yesterday')) {
    return {
      intent: 'history',
      confidence: 0.7,
      params: {
        timeframe: lowerText.includes('yesterday') ? 'yesterday' : 'today'
      }
    };
  }
  
  return {
    intent: 'unknown',
    confidence: 0.1,
    params: {}
  };
}

// Validate and execute set_point commands
async function executeSetPoint(params: any): Promise<{ success: boolean; message: string; data?: any }> {
  const { type, value, room, unit } = params;
  
  // Find matching point in database
  const { data: points, error } = await supabase
    .from('points')
    .select('*')
    .eq('type', type)
    .ilike('room', `%${room}%`)
    .eq('is_controllable', true);
    
  if (error || !points || points.length === 0) {
    return {
      success: false,
      message: `No controllable ${type} found in ${room}`
    };
  }
  
  const point = points[0];
  
  // Validate value range
  if (point.min_value !== null && value < point.min_value) {
    return {
      success: false,
      message: `Value ${value} is below minimum ${point.min_value}${point.unit}`
    };
  }
  
  if (point.max_value !== null && value > point.max_value) {
    return {
      success: false,
      message: `Value ${value} is above maximum ${point.max_value}${point.unit}`
    };
  }
  
  try {
    // Call MCP to set the point
    const mcpResponse = await callMCP('set_point', {
      point: point.point_id,
      value: value.toString()
    });
    
    if (mcpResponse.success) {
      // Update database with new value
      await supabase
        .from('points')
        .update({
          current_value: value.toString(),
          last_updated: new Date().toISOString()
        })
        .eq('id', point.id);
      
      // Log to history
      await supabase
        .from('point_history')
        .insert({
          point_id: point.point_id,
          value: value.toString(),
          source: 'voice'
        });
      
      return {
        success: true,
        message: `Set ${point.name} to ${value}${point.unit}`,
        data: { point: point.name, value, unit: point.unit }
      };
    } else {
      return {
        success: false,
        message: `Failed to set ${point.name}: ${mcpResponse.error || 'Unknown error'}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error setting ${point.name}: ${error.message}`
    };
  }
}

// Execute read_point commands
async function executeReadPoint(params: any): Promise<{ success: boolean; message: string; data?: any }> {
  const { type, room } = params;
  
  // Find matching point in database
  const { data: points, error } = await supabase
    .from('points')
    .select('*')
    .eq('type', type)
    .ilike('room', `%${room}%`);
    
  if (error || !points || points.length === 0) {
    return {
      success: false,
      message: `No ${type} sensor found in ${room}`
    };
  }
  
  const point = points[0];
  
  try {
    // Call MCP to read current value
    const mcpResponse = await callMCP('read_point', {
      point: point.point_id
    });
    
    if (mcpResponse.success && mcpResponse.data) {
      let currentValue = mcpResponse.data.value || point.current_value;
      
      // Update database with fresh value
      await supabase
        .from('points')
        .update({
          current_value: currentValue,
          last_updated: new Date().toISOString()
        })
        .eq('id', point.id);
      
      return {
        success: true,
        message: `${point.name} is currently ${currentValue}${point.unit}`,
        data: { point: point.name, value: currentValue, unit: point.unit }
      };
    } else {
      // Fall back to database value
      return {
        success: true,
        message: `${point.name} was last recorded at ${point.current_value}${point.unit}`,
        data: { point: point.name, value: point.current_value, unit: point.unit }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error reading ${point.name}: ${error.message}`
    };
  }
}

// Execute list_points command
async function executeListPoints(): Promise<{ success: boolean; message: string; data?: any }> {
  const { data: points, error } = await supabase
    .from('points')
    .select('name, room, type, unit, is_controllable, current_value')
    .order('room', { ascending: true });
    
  if (error) {
    return {
      success: false,
      message: "Error retrieving points list"
    };
  }
  
  const controllablePoints = points?.filter(p => p.is_controllable) || [];
  const sensorPoints = points?.filter(p => !p.is_controllable) || [];
  
  let message = `Found ${points?.length || 0} points. `;
  
  if (controllablePoints.length > 0) {
    message += `Controllable: ${controllablePoints.map(p => `${p.name} (${p.current_value}${p.unit})`).join(', ')}. `;
  }
  
  if (sensorPoints.length > 0) {
    message += `Sensors: ${sensorPoints.map(p => `${p.name} (${p.current_value}${p.unit})`).join(', ')}.`;
  }
  
  return {
    success: true,
    message,
    data: { controllable: controllablePoints, sensors: sensorPoints }
  };
}

// Execute health check
async function executeHealth(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const mcpResponse = await callMCP('health');
    
    // Also check database connectivity
    const { count } = await supabase
      .from('points')
      .select('*', { count: 'exact', head: true });
    
    return {
      success: true,
      message: `System is operational. Database has ${count} points configured. MCP connection: ${mcpResponse.success ? 'OK' : 'Error'}`,
      data: { dbPoints: count, mcpStatus: mcpResponse.success }
    };
  } catch (error) {
    return {
      success: false,
      message: `System health check failed: ${error.message}`
    };
  }
}

// Execute history query
async function executeHistory(params: any): Promise<{ success: boolean; message: string; data?: any }> {
  const { timeframe } = params;
  const hoursBack = timeframe === 'yesterday' ? 48 : 24;
  
  const { data: history, error } = await supabase
    .from('point_history')
    .select('point_id, value, timestamp')
    .gte('timestamp', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })
    .limit(100);
    
  if (error) {
    return {
      success: false,
      message: "Error retrieving history data"
    };
  }
  
  const recordCount = history?.length || 0;
  let message = `Found ${recordCount} data points from the last ${hoursBack} hours.`;
  
  if (recordCount > 0) {
    // Group by point_id and get latest values
    const latestByPoint = history?.reduce((acc, curr) => {
      if (!acc[curr.point_id]) {
        acc[curr.point_id] = curr;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const pointSummary = Object.values(latestByPoint || {}).slice(0, 3);
    if (pointSummary.length > 0) {
      message += ` Recent readings include: ${pointSummary.map((p: any) => `${p.point_id} at ${p.value}`).join(', ')}.`;
    }
  }
  
  return {
    success: true,
    message,
    data: { history: history?.slice(0, 10), totalRecords: recordCount }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { text, userId, clientIp } = VoiceRequestSchema.parse(requestData);
    
    const startTime = Date.now();
    
    // Classify intent
    const { intent, confidence, params } = classifyIntent(text);
    
    console.log(`Intent: ${intent}, Confidence: ${confidence}, Params:`, params);
    
    let result: { success: boolean; message: string; data?: any };
    
    // Execute based on intent
    switch (intent) {
      case 'set_point':
        result = await executeSetPoint(params);
        break;
      case 'read_point':
        result = await executeReadPoint(params);
        break;
      case 'list_points':
        result = await executeListPoints();
        break;
      case 'health':
        result = await executeHealth();
        break;
      case 'history':
        result = await executeHistory(params);
        break;
      default:
        result = {
          success: false,
          message: "I didn't understand that command. Try 'set office temperature to 22', 'what is lobby light status', or 'list all points'."
        };
    }
    
    const responseTime = Date.now() - startTime;
    
    // Log the interaction
    try {
      await supabase.from('voice_log').insert({
        user_input: text,
        intent,
        point_id: params.point || null,
        old_value: null, // Could be enhanced to track old values
        new_value: params.value?.toString() || null,
        success: result.success,
        error_message: result.success ? null : result.message,
        response_time_ms: responseTime,
        ip_address: clientIp || null
      });
    } catch (logError) {
      console.error('Failed to log interaction:', logError);
    }
    
    return new Response(JSON.stringify({
      success: result.success,
      intent,
      confidence,
      message: result.message,
      speechText: result.message, // For TTS
      data: result.data,
      responseTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Voice Assistant Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      speechText: 'Sorry, I encountered an error processing your request.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});