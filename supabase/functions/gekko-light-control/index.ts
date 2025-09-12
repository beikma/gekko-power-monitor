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
    console.log('Full status data received:', JSON.stringify(statusData, null, 2));
    
    const lights = statusData.lights || {};
    console.log('Lights data:', JSON.stringify(lights, null, 2));
    
    console.log('Current light status retrieved');

    // Determine if we should turn all lights on or off
    // Count active lights to decide the action
    const lightItems = Object.entries(lights)
      .filter(([key]) => key.startsWith('item'))
      .map(([key, light]: [string, any]) => {
        const values = light.sumstate?.value?.split(';') || [];
        console.log(`Light ${key}:`, { light, values });
        return {
          id: key,
          isOn: parseInt(values[0]) === 1
        };
      });

    const activeLights = lightItems.filter(light => light.isOn).length;
    const shouldTurnOn = activeLights < lightItems.length / 2; // Turn on if less than half are active
    const command = shouldTurnOn ? '1' : '0'; // 1 = on, 0 = off

    console.log(`Toggling all lights ${shouldTurnOn ? 'ON' : 'OFF'} (${activeLights}/${lightItems.length} currently active)`);

    // Send commands to all light groups first (faster bulk control)
    const groupCommands = [];
    const groups = Object.entries(lights)
      .filter(([key]) => key.startsWith('group'))
      .map(([key]) => key);

    console.log('Groups found:', groups);

    for (const groupId of groups) {
      const groupCommand = {
        groupId,
        command,
        endpoint: `var/${groupId}/scmd`,
        url: `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/${groupId}/scmd&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}&value=${command}`
      };
      
      console.log(`Sending command to group ${groupId}:`, groupCommand.url);
      
      groupCommands.push(
        fetch(groupCommand.url, { method: 'POST' })
          .then(response => {
            console.log(`Group ${groupId} response:`, response.status);
            return {
              groupId,
              success: response.ok,
              status: response.status
            };
          })
          .catch(error => {
            console.error(`Group ${groupId} error:`, error);
            return {
              groupId,
              success: false,
              error: error.message
            };
          })
      );
    }

    const groupResults = await Promise.all(groupCommands);
    console.log('All group command results:', groupResults);
    
    return {
      action: shouldTurnOn ? 'all_on' : 'all_off',
      lightsAffected: lightItems.length,
      groupsControlled: groups.length,
      groupResults,
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
    
    const url = `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/${lightId}/scmd&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}&value=${newState}`;
    
    console.log(`Toggling light ${lightId} from ${currentState} to ${newState}`);
    
    const response = await fetch(url, { method: 'POST' });
    
    return {
      lightId,
      previousState: currentState,
      newState,
      success: response.ok,
      status: response.status
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
    
    const url = `https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy?endpoint=var/${lightId}/scmd&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoId}&value=${command}`;
    
    console.log(`Setting brightness for ${lightId} to ${brightness}%`);
    
    const response = await fetch(url, { method: 'POST' });
    
    return {
      lightId,
      brightness,
      command,
      success: response.ok,
      status: response.status
    };

  } catch (error) {
    console.error(`Error setting brightness for ${lightId}:`, error);
    throw error;
  }
}