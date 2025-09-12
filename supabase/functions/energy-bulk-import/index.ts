import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface HistoricalDataPoint {
  timestamp: string;
  current_power: number;
  daily_energy: number;
  battery_level: number;
  pv_power: number;
  grid_power: number;
  temperature?: number;
  humidity?: number;
  weather_condition?: string;
  efficiency_score?: number;
  cost_estimate?: number;
}

interface BulkImportRequest {
  data: HistoricalDataPoint[];
  source: string; // 'csv', 'api', 'manual'
  date_range?: {
    start: string;
    end: string;
  };
}

serve(async (req) => {
  console.log('Bulk Energy Import function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BulkImportRequest = await req.json();
    
    if (!body.data || !Array.isArray(body.data) || body.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No historical data provided' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting bulk import of ${body.data.length} records from ${body.source}`);

    // Validate and clean data
    const cleanedData = body.data
      .filter(record => record.timestamp && !isNaN(new Date(record.timestamp).getTime()))
      .map(record => ({
        recorded_at: new Date(record.timestamp).toISOString(),
        current_power: Number(record.current_power) || 0,
        daily_energy: Number(record.daily_energy) || 0,
        battery_level: Math.min(Math.max(Number(record.battery_level) || 0, 0), 100),
        pv_power: Number(record.pv_power) || 0,
        grid_power: Number(record.grid_power) || 0,
        temperature: record.temperature ? Number(record.temperature) : null,
        humidity: record.humidity ? Math.min(Math.max(Number(record.humidity), 0), 100) : null,
        weather_condition: record.weather_condition || null,
        efficiency_score: record.efficiency_score ? Math.min(Math.max(Number(record.efficiency_score), 0), 100) : null,
        cost_estimate: record.cost_estimate ? Number(record.cost_estimate) : null,
      }))
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    console.log(`Cleaned data: ${cleanedData.length} valid records`);

    if (cleanedData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid records found after data cleaning' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert in batches to avoid timeouts
    const batchSize = 1000;
    let totalInserted = 0;
    let totalSkipped = 0;

    for (let i = 0; i < cleanedData.length; i += batchSize) {
      const batch = cleanedData.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cleanedData.length/batchSize)}: ${batch.length} records`);

      try {
        const { data: insertedData, error } = await supabase
          .from('energy_readings')
          .insert(batch)
          .select('id');

        if (error) {
          console.error('Batch insert error:', error);
          // Continue with next batch even if some fail
          totalSkipped += batch.length;
        } else {
          totalInserted += insertedData?.length || 0;
          console.log(`Batch inserted successfully: ${insertedData?.length} records`);
        }
      } catch (batchError) {
        console.error('Batch processing error:', batchError);
        totalSkipped += batch.length;
      }

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate summary statistics
    const dateRange = {
      start: cleanedData[0]?.recorded_at,
      end: cleanedData[cleanedData.length - 1]?.recorded_at,
    };

    const avgPower = cleanedData.reduce((sum, r) => sum + r.current_power, 0) / cleanedData.length;
    const avgPV = cleanedData.reduce((sum, r) => sum + r.pv_power, 0) / cleanedData.length;
    const maxDaily = Math.max(...cleanedData.map(r => r.daily_energy));

    console.log('Import completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          totalProcessed: cleanedData.length,
          totalInserted,
          totalSkipped,
          dateRange,
          statistics: {
            avgPowerConsumption: Number(avgPower.toFixed(2)),
            avgPVGeneration: Number(avgPV.toFixed(2)),
            maxDailyEnergy: Number(maxDaily.toFixed(2)),
          }
        },
        message: `Successfully imported ${totalInserted} historical energy records`
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in bulk energy import:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to import historical data', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});