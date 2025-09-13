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

// OpenAI client for intelligent intent recognition
async function classifyIntentWithAI(text: string): Promise<{ intent: string; confidence: number; params: any }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.warn('OpenAI API key not found, falling back to rule-based classification');
    return classifyIntent(text);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a smart building voice assistant. Analyze user commands and return JSON with intent classification.

Available intents:
- "set_point": User wants to set temperature, lights, or control something (e.g., "set office temperature to 22", "turn on lobby lights")
- "read_point": User wants to know status/values (e.g., "what's the office temperature", "show energy consumption")
- "energy_analysis": User wants energy insights (e.g., "how much energy did we use", "energy efficiency report")
- "system_health": System status check (e.g., "system status", "is everything working")
- "help": User needs assistance

Extract parameters like room, value, timeframe. Return JSON: {"intent": "...", "confidence": 0.0-1.0, "params": {}}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      return JSON.parse(aiResponse);
    } catch {
      // Fallback if AI response isn't valid JSON
      return classifyIntent(text);
    }
  } catch (error) {
    console.error('OpenAI classification error:', error);
    return classifyIntent(text);
  }
}

// GEKKO API integration for real building controls
async function callGekkoAPI(endpoint: string, params: any = {}) {
  try {
    const response = await supabase.functions.invoke('gekko-proxy', {
      body: { endpoint, params }
    });
    
    if (response.error) {
      throw new Error(`GEKKO API error: ${response.error.message}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('GEKKO API Error:', error);
    throw new Error('Failed to connect to building control system');
  }
}

// Enhanced intent classification with more patterns
function classifyIntent(text: string): { intent: string; confidence: number; params: any } {
  const lowerText = text.toLowerCase();
  
  // Set/Control patterns
  if (lowerText.includes('set') || lowerText.includes('turn') || lowerText.includes('adjust') || lowerText.includes('change')) {
    const tempMatch = lowerText.match(/(?:set|adjust|change).*?temperature.*?(?:to\s*)?(\d+(?:\.\d+)?)/);
    const lightMatch = lowerText.match(/(?:set|turn|adjust).*?light.*?(?:to\s*)?(\d+(?:\.\d+)?)/);
    const roomMatch = lowerText.match(/(office|lobby|living|kitchen|bedroom|bathroom|entrance|hallway|meeting|conference)/);
    
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
  
  // Read/Query patterns - enhanced
  if (lowerText.includes('what') || lowerText.includes('how') || lowerText.includes('show') || lowerText.includes('tell me') || lowerText.includes('current') || lowerText.includes('status')) {
    const roomMatch = lowerText.match(/(office|lobby|living|kitchen|bedroom|bathroom|entrance|hallway|meeting|conference)/);
    
    // Energy/power queries
    if (lowerText.includes('energy') || lowerText.includes('power') || lowerText.includes('consumption') || lowerText.includes('usage')) {
      return {
        intent: 'read_point',
        confidence: 0.9,
        params: {
          type: 'energy',
          room: roomMatch?.[1] || null
        }
      };
    }
    
    // Temperature queries
    if (lowerText.includes('temperature') || lowerText.includes('temp') || lowerText.includes('hot') || lowerText.includes('cold')) {
      return {
        intent: 'read_point',
        confidence: 0.9,
        params: {
          type: 'temperature',
          room: roomMatch?.[1] || 'office'
        }
      };
    }
    
    // Light queries
    if (lowerText.includes('light') || lowerText.includes('brightness') || lowerText.includes('lamp') || lowerText.includes('illumination')) {
      return {
        intent: 'read_point',
        confidence: 0.8,
        params: {
          type: 'light',
          room: roomMatch?.[1] || 'lobby'
        }
      };
    }

    // Building/system status
    if (lowerText.includes('building') || lowerText.includes('system') || lowerText.includes('everything') || lowerText.includes('all')) {
      return {
        intent: 'read_point',
        confidence: 0.8,
        params: {
          type: 'status',
          room: null
        }
      };
    }
  }
  
  // Energy analysis patterns
  if (lowerText.includes('analysis') || lowerText.includes('efficiency') || lowerText.includes('optimization') || lowerText.includes('savings')) {
    return {
      intent: 'energy_analysis',
      confidence: 0.8,
      params: {
        type: 'comprehensive'
      }
    };
  }
  
  // List/inventory patterns
  if (lowerText.includes('list') || lowerText.includes('show all') || lowerText.includes('available') || lowerText.includes('inventory')) {
    return {
      intent: 'read_point',
      confidence: 0.8,
      params: {
        type: 'list',
        room: null
      }
    };
  }
  
  // System health patterns
  if (lowerText.includes('health') || lowerText.includes('check') || lowerText.includes('working') || lowerText.includes('connection')) {
    return {
      intent: 'system_health',
      confidence: 0.9,
      params: {}
    };
  }
  
  // Help patterns
  if (lowerText.includes('help') || lowerText.includes('commands') || lowerText.includes('what can') || lowerText.includes('how do')) {
    return {
      intent: 'help',
      confidence: 0.9,
      params: {}
    };
  }
  
  return {
    intent: 'unknown',
    confidence: 0.1,
    params: {}
  };
}

// Execute set_point commands via GEKKO API
async function executeSetPoint(params: any): Promise<{ success: boolean; message: string; data?: any }> {
  const { type, value, room } = params;
  
  try {
    // For temperature control
    if (type === 'temperature') {
      if (value < 15 || value > 30) {
        return {
          success: false,
          message: `Temperature ${value}°C is outside safe range (15-30°C)`
        };
      }
      
      // Call GEKKO temperature control
      const gekkoResponse = await callGekkoAPI('setTemperature', { 
        room: room || 'office', 
        temperature: value 
      });
      
      return {
        success: true,
        message: `Set ${room || 'office'} temperature to ${value}°C`,
        data: { room, value, unit: '°C', gekkoResponse }
      };
    }
    
    // For light control
    if (type === 'light') {
      if (value < 0 || value > 100) {
        return {
          success: false,
          message: `Light level ${value}% is outside range (0-100%)`
        };
      }
      
      // Call GEKKO light control
      const gekkoResponse = await callGekkoAPI('setLight', { 
        room: room || 'lobby', 
        brightness: value 
      });
      
      return {
        success: true,
        message: `Set ${room || 'lobby'} light to ${value}%`,
        data: { room, value, unit: '%', gekkoResponse }
      };
    }
    
    return {
      success: false,
      message: `Control type '${type}' not supported. Try temperature or light.`
    };
    
  } catch (error) {
    console.error('Set point error:', error);
    return {
      success: false,
      message: `Failed to set ${type}: ${error.message}`
    };
  }
}

// Execute read_point commands via GEKKO API and database
async function executeReadPoint(params: any): Promise<{ success: boolean; message: string; data?: any }> {
  const { type, room } = params;
  
  try {
    // Read energy data
    if (type === 'energy' || type === 'consumption') {
      const { data: energyData, error } = await supabase
        .from('energy_readings')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1);
      
      if (energyData && energyData.length > 0) {
        const latest = energyData[0];
        return {
          success: true,
          message: `Current energy: ${latest.current_power?.toFixed(1)} kW, Daily: ${latest.daily_energy?.toFixed(1)} kWh, Solar: ${latest.pv_power?.toFixed(1)} kW`,
          data: latest
        };
      }
    }
    
    // Read temperature via GEKKO
    if (type === 'temperature') {
      const gekkoResponse = await callGekkoAPI('getTemperature', { room: room || 'office' });
      return {
        success: true,
        message: `${room || 'Office'} temperature is ${gekkoResponse.temperature}°C`,
        data: { room, temperature: gekkoResponse.temperature, unit: '°C' }
      };
    }
    
    // Read light status via GEKKO  
    if (type === 'light') {
      const gekkoResponse = await callGekkoAPI('getLight', { room: room || 'lobby' });
      return {
        success: true,
        message: `${room || 'Lobby'} light is at ${gekkoResponse.brightness}%`,
        data: { room, brightness: gekkoResponse.brightness, unit: '%' }
      };
    }
    
    // Fallback: check database points
    const { data: points, error } = await supabase
      .from('points')
      .select('*')
      .eq('type', type)
      .ilike('room', `%${room || ''}%`)
      .order('last_updated', { ascending: false })
      .limit(1);
      
    if (points && points.length > 0) {
      const point = points[0];
      return {
        success: true,
        message: `${point.name} is ${point.current_value}${point.unit || ''}`,
        data: point
      };
    }
    
    return {
      success: false,
      message: `No ${type} data found for ${room || 'any room'}`
    };
    
  } catch (error) {
    console.error('Read point error:', error);
    return {
      success: false,
      message: `Error reading ${type}: ${error.message}`
    };
  }
}

// Execute energy_analysis command
async function executeEnergyAnalysis(params: any): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Get recent energy data
    const { data: energyData, error } = await supabase
      .from('energy_readings')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });
    
    if (error || !energyData || energyData.length === 0) {
      return {
        success: false,
        message: "No recent energy data available for analysis"
      };
    }

    // Call the AI analysis function
    const analysisResponse = await supabase.functions.invoke('energy-ai-analysis-simple', {
      body: { analysis_type: 'consumption_summary' }
    });

    if (analysisResponse.error) {
      // Fallback to basic analysis
      const latest = energyData[0];
      const avgPower = energyData.reduce((sum, r) => sum + (r.current_power || 0), 0) / energyData.length;
      const totalDaily = energyData.reduce((sum, r) => sum + (r.daily_energy || 0), 0) / energyData.length;
      
      return {
        success: true,
        message: `Energy Summary: Current power ${latest.current_power?.toFixed(1)} kW, 24h average ${avgPower.toFixed(1)} kW, daily total ${totalDaily.toFixed(1)} kWh`,
        data: { current_power: latest.current_power, avg_power: avgPower, daily_total: totalDaily }
      };
    }

    const analysis = analysisResponse.data;
    return {
      success: true,
      message: `Energy Analysis: ${analysis.summary || 'Analysis complete'}`,
      data: analysis
    };
    
  } catch (error) {
    console.error('Energy analysis error:', error);
    return {
      success: false,
      message: `Energy analysis failed: ${error.message}`
    };
  }
}

// Execute system health check
async function executeHealth(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Check database connectivity
    const { count: pointsCount } = await supabase
      .from('points')
      .select('*', { count: 'exact', head: true });
      
    const { count: energyCount } = await supabase
      .from('energy_readings')
      .select('*', { count: 'exact', head: true });

    // Check GEKKO API connectivity
    let gekkoStatus = 'Unknown';
    try {
      const gekkoResponse = await callGekkoAPI('status', {});
      gekkoStatus = gekkoResponse ? 'Connected' : 'Disconnected';
    } catch {
      gekkoStatus = 'Disconnected';
    }
    
    return {
      success: true,
      message: `System Status: Database has ${pointsCount} points and ${energyCount} energy readings. GEKKO API: ${gekkoStatus}`,
      data: { 
        database_points: pointsCount, 
        energy_readings: energyCount,
        gekko_status: gekkoStatus,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Health check error:', error);
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
    
    // Classify intent with AI enhancement
    const { intent, confidence, params } = await classifyIntentWithAI(text);
    
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
      case 'energy_analysis':
        result = await executeEnergyAnalysis(params);
        break;
      case 'system_health':
        result = await executeHealth();
        break;
      case 'help':
        result = {
          success: true,
          message: "I can help you control your smart building. Try: 'set office temperature to 22', 'what's the energy consumption', 'system status', or 'energy analysis'."
        };
        break;
      default:
        result = {
          success: false,
          message: "I didn't understand that command. Try 'set office temperature to 22', 'what's the energy consumption', 'system status', or say 'help' for more options."
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