import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GekkoAlarmData {
  status?: any;
  data?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { status, data }: GekkoAlarmData = await req.json();

    console.log("Processing Gekko alarm data...");

    const alarms = [];

    // Extract alarm information from globals.alarm
    if (status?.globals?.alarm?.sumstate?.value) {
      const alarmValue = status.globals.alarm.sumstate.value;
      console.log("Global alarm status:", alarmValue);

      // Alarm values: 1=Armed, 2=Partial, 3=Disarmed
      if (alarmValue === "1") {
        alarms.push({
          description: "Security system is armed",
          alarm_type: "security",
          severity: "medium",
          status: "active",
          source_system: "gekko",
          start_time: new Date().toISOString(),
          metadata: { alarm_code: alarmValue }
        });
      }
    }

    // Check for temperature alarms in roomtemps
    if (status?.roomtemps) {
      Object.entries(status.roomtemps).forEach(([key, room]: [string, any]) => {
        if (key.startsWith('item') && room?.sumstate?.value) {
          const values = room.sumstate.value.split(';');
          const currentTemp = parseFloat(values[0]);
          const targetTemp = parseFloat(values[1]);
          
          if (currentTemp && targetTemp) {
            const tempDiff = Math.abs(currentTemp - targetTemp);
            
            // Create alarm if temperature is more than 5 degrees off target
            if (tempDiff > 5) {
              alarms.push({
                description: `Room temperature deviation: ${currentTemp}°C (target: ${targetTemp}°C)`,
                alarm_type: "heating",
                severity: tempDiff > 8 ? "high" : "medium",
                status: "active",
                source_system: "gekko",
                start_time: new Date().toISOString(),
                metadata: { 
                  room_id: key, 
                  current_temp: currentTemp, 
                  target_temp: targetTemp,
                  deviation: tempDiff
                }
              });
            }
          }
        }
      });
    }

    // Check for connection issues based on missing or invalid data
    if (!status || Object.keys(status).length === 0) {
      alarms.push({
        description: "myGEKKO system connection lost or no data received",
        alarm_type: "connection",
        severity: "critical",
        status: "active",
        source_system: "gekko",
        start_time: new Date().toISOString(),
        metadata: { connection_issue: true }
      });
    }

    // Check for hardware issues in energy costs (unusual readings)
    if (status?.energycosts) {
      Object.entries(status.energycosts).forEach(([key, meter]: [string, any]) => {
        if (key.startsWith('item') && meter?.sumstate?.value) {
          const values = meter.sumstate.value.split(';').map((v: string) => parseFloat(v) || 0);
          const currentPower = values[0];
          
          // Create alarm for unusually high power consumption (>50kW)
          if (currentPower > 50) {
            alarms.push({
              description: `High power consumption detected: ${currentPower}kW on meter ${key}`,
              alarm_type: "hardware",
              severity: currentPower > 100 ? "critical" : "high",
              status: "active",
              source_system: "gekko",
              start_time: new Date().toISOString(),
              metadata: { 
                meter_id: key, 
                power_reading: currentPower,
                threshold_exceeded: true
              }
            });
          }
        }
      });
    }

    console.log(`Found ${alarms.length} alarms to process`);

    // Store new alarms in database
    for (const alarm of alarms) {
      // Check if similar alarm already exists (to avoid duplicates)
      const { data: existingAlarm } = await supabaseClient
        .from('system_alarms')
        .select('id')
        .eq('description', alarm.description)
        .eq('status', 'active')
        .eq('source_system', 'gekko')
        .gte('created_at', new Date(Date.now() - 1000 * 60 * 30).toISOString()) // Last 30 minutes
        .single();

      if (!existingAlarm) {
        const { error: insertError } = await supabaseClient
          .from('system_alarms')
          .insert([alarm]);

        if (insertError) {
          console.error('Error inserting alarm:', insertError);
        } else {
          console.log('Inserted new alarm:', alarm.description);
        }
      } else {
        console.log('Similar alarm already exists, skipping:', alarm.description);
      }
    }

    // Auto-resolve old alarms that are no longer relevant
    const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    
    const { error: resolveError } = await supabaseClient
      .from('system_alarms')
      .update({ 
        status: 'resolved', 
        end_time: new Date().toISOString() 
      })
      .eq('status', 'active')
      .lt('start_time', twoHoursAgo)
      .in('alarm_type', ['connection', 'heating']); // Auto-resolve these types

    if (resolveError) {
      console.error('Error auto-resolving old alarms:', resolveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_alarms: alarms.length,
        message: `Processed ${alarms.length} alarms from Gekko data`
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error processing Gekko alarms:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});