import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LightControlRequest {
  action: 'toggle_all' | 'toggle_light' | 'set_brightness';
  lightId?: string;
  value?: string | number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as LightControlRequest;
    const { action, lightId, value } = body;

    // GEKKO API credentials - these should match your existing setup
    const gekkoUsername = "mustermann@my-gekko.com";
    const gekkoKey = "HjR9j4BrruA8wZiBeiWXnD";
    const gekkoId = "K999-7UOZ-8ZYZ-6TH3";

    console.log(`Light control request: ${action}`, { lightId, value });

    let result;

    switch (action) {
      case 'toggle_all':
        result = await toggleAllLights(gekkoUsername, gekkoKey, gekkoId);
        break;
      case 'toggle_light':
        result = await toggleSingleLight(gekkoUsername, gekkoKey, gekkoId, lightId!, value as string);
        break;
      case 'set_brightness':
        result = await setBrightness(gekkoUsername, gekkoKey, gekkoId, lightId!, value as number);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in light control:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function toggleAllLights(username: string, key: string, gekkoId: string) {
  try {
    // First, get current status of all lights
    const statusResponse = await fetch(
      `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/status&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}`
    );
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to get light status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    const lights = statusData.lights || {};
    
    console.log('Current light status retrieved');

    // Determine if we should turn all lights on or off
    // Count active lights to decide the action
    const lightItems = Object.entries(lights)
      .filter(([key]) => key.startsWith('item'))
      .map(([key, light]: [string, any]) => {
        const values = light.sumstate?.value?.split(';') || [];
        return {
          id: key,
          isOn: parseInt(values[0]) === 1
        };
      });

    const activeLights = lightItems.filter(light => light.isOn).length;
    const shouldTurnOn = activeLights < lightItems.length / 2; // Turn on if less than half are active
    const command = shouldTurnOn ? '1' : '0'; // 1 = on, 0 = off

    console.log(`Toggling all lights ${shouldTurnOn ? 'ON' : 'OFF'} (${activeLights}/${lightItems.length} currently active)`);

    // Send commands to individual lights instead of groups
    const lightCommands = [];
    
    for (const lightItem of lightItems) {
      const commandUrl = `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/${lightItem.id}/scmd&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}&value=${command}`;
      
      console.log(`Sending command to light ${lightItem.id}: ${commandUrl}`);
      
      lightCommands.push(
        fetch(commandUrl, { 
          method: 'GET',  // Changed to GET
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(response => {
            console.log(`Light ${lightItem.id} response:`, response.status, response.statusText);
            return response.text().then(text => ({
              lightId: lightItem.id,
              success: response.ok,
              status: response.status,
              responseText: text
            }));
          })
          .catch(error => {
            console.error(`Light ${lightItem.id} error:`, error);
            return {
              lightId: lightItem.id,
              success: false,
              error: error.message
            };
          })
      );
    }

    const lightResults = await Promise.all(lightCommands);
    console.log('All light command results:', lightResults);
    
    return {
      action: shouldTurnOn ? 'all_on' : 'all_off',
      lightsAffected: lightItems.length,
      lightResults,
      command: command
    };

  } catch (error) {
    console.error('Error in toggleAllLights:', error);
    throw error;
  }
}

async function toggleSingleLight(username: string, key: string, gekkoId: string, lightId: string, currentState: string) {
  try {
    // Toggle the state - if currently on (1), turn off (0) and vice versa
    const newState = currentState === '1' ? '0' : '1';
    
    const commandUrl = `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/${lightId}/scmd&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}&value=${newState}`;
    
    console.log(`Toggling light ${lightId} from ${currentState} to ${newState}`);
    console.log(`Command URL: ${commandUrl}`);
    
    const response = await fetch(commandUrl, { 
      method: 'GET',  // Changed to GET
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`Light ${lightId} response:`, response.status, response.statusText, responseText);
    
    return {
      lightId,
      previousState: currentState,
      newState,
      success: response.ok,
      status: response.status,
      responseText: responseText
    };

  } catch (error) {
    console.error(`Error toggling light ${lightId}:`, error);
    throw error;
  }
}

async function setBrightness(username: string, key: string, gekkoId: string, lightId: string, brightness: number) {
  try {
    // Format: D followed by brightness percentage (0-100)
    const command = `D${Math.max(0, Math.min(100, brightness))}`;
    
    const commandUrl = `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/${lightId}/scmd&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}&value=${command}`;
    
    console.log(`Setting brightness for ${lightId} to ${brightness}%`);
    console.log(`Command URL: ${commandUrl}`);
    
    const response = await fetch(commandUrl, { 
      method: 'GET',  // Changed to GET
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`Brightness ${lightId} response:`, response.status, response.statusText, responseText);
    
    return {
      lightId,
      brightness,
      command,
      success: response.ok,
      status: response.status,
      responseText: responseText
    };

  } catch (error) {
    console.error(`Error setting brightness for ${lightId}:`, error);
    throw error;
  }
}