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

interface GekkoCredentials {
  username: string;
  key: string;
  gekkoid: string;
}

interface MultiImportRequest {
  credentials: GekkoCredentials;
  dataTypes: ('alarms' | 'costs' | 'weather' | 'meteo')[];
  year?: number;
  rowcount?: number;
  items?: string[]; // For costs data: ['item0', 'item1', etc.]
}

serve(async (req) => {
  console.log('Multi-source GEKKO Import function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MultiImportRequest = await req.json();
    const { credentials, dataTypes, year = new Date().getFullYear(), rowcount = 1000, items = ['item0'] } = body;

    console.log(`Importing data types: ${dataTypes.join(', ')} for year ${year}`);

    const results: any = {
      success: true,
      imported: {},
      errors: {},
      summary: {
        totalImported: 0,
        dataTypes: dataTypes.length,
        year: year
      }
    };

    // Import alarms data
    if (dataTypes.includes('alarms')) {
      try {
        const alarmResult = await importAlarmData(credentials, year, rowcount);
        results.imported.alarms = alarmResult;
        results.summary.totalImported += alarmResult.imported;
      } catch (error) {
        console.error('Error importing alarms:', error);
        results.errors.alarms = error.message;
      }
    }

    // Import costs data for multiple items
    if (dataTypes.includes('costs')) {
      try {
        const costsResults = [];
        for (const item of items) {
          const costResult = await importCostData(credentials, item, year, rowcount);
          costsResults.push(costResult);
          results.summary.totalImported += costResult.imported;
        }
        results.imported.costs = costsResults;
      } catch (error) {
        console.error('Error importing costs:', error);
        results.errors.costs = error.message;
      }
    }

    // Import weather/meteo data
    if (dataTypes.includes('meteo') || dataTypes.includes('weather')) {
      try {
        const weatherResult = await importWeatherData(credentials, year, rowcount);
        results.imported.weather = weatherResult;
        results.summary.totalImported += weatherResult.imported;
      } catch (error) {
        console.error('Error importing weather:', error);
        results.errors.weather = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        ...results,
        message: `Multi-source import completed. Total records: ${results.summary.totalImported}`
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in multi-source import:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to import multi-source data', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function importAlarmData(credentials: GekkoCredentials, year: number, rowcount: number) {
  const { username, key, gekkoid } = credentials;
  const apiUrl = `https://live.my-gekko.com/api/v1/list/alarm/lists/list0/status?startrow=0&rowcount=${rowcount}&year=${year}&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoid}`;
  
  console.log('Fetching alarm data from myGEKKO');

  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`myGEKKO API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.rows || !Array.isArray(data.rows)) {
    console.log('No alarm data found');
    return { imported: 0, message: 'No alarm data available' };
  }

  console.log(`Processing ${data.rows.length} alarm records`);

  // Transform alarm data: [Description, Start Time, Status, End Time]
  const transformedAlarms = data.rows.map((row: string[]) => {
    const [description, startTimeStr, status, endTimeStr] = row;
    
    // Parse German date format: "31.12.24 01:05:13"
    const parseGermanDate = (dateStr: string) => {
      if (!dateStr || dateStr === '-') return null;
      
      const [datePart, timePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('.');
      const fullYear = year.length === 2 ? `20${year}` : year;
      
      return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timePart ? ` ${timePart}` : ''}`);
    };

    const startTime = parseGermanDate(startTimeStr);
    const endTime = parseGermanDate(endTimeStr);

    // Categorize alarm type
    let alarmType = 'unknown';
    let severity = 'medium';
    
    if (description.includes('Net.') || description.includes('Verbindung') || description.includes('MQTT')) {
      alarmType = 'connection';
      severity = 'high';
    } else if (description.includes('IOStation') || description.includes('IO-')) {
      alarmType = 'hardware';
      severity = 'high';
    } else if (description.includes('Speicher') || description.includes('H/K')) {
      alarmType = 'heating';
      severity = 'medium';
    } else if (description.includes('Wetter')) {
      alarmType = 'weather';
      severity = 'low';
    } else if (description.includes('Einstellungen')) {
      alarmType = 'configuration';
      severity = 'medium';
    }

    return {
      description: description.trim(),
      alarm_type: alarmType,
      start_time: startTime?.toISOString(),
      end_time: endTime?.toISOString(),
      status: endTime ? 'resolved' : 'active',
      severity: severity,
      source_system: 'gekko',
      metadata: {
        raw_status: status,
        original_start: startTimeStr,
        original_end: endTimeStr
      }
    };
  }).filter(alarm => alarm.start_time); // Only include alarms with valid timestamps

  console.log(`Transformed ${transformedAlarms.length} valid alarm records`);

  // Insert alarms in batches
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < transformedAlarms.length; i += batchSize) {
    const batch = transformedAlarms.slice(i, i + batchSize);
    
    try {
      const { data: insertedData, error } = await supabase
        .from('system_alarms')
        .upsert(batch, { onConflict: 'description,start_time' })
        .select('id');

      if (error) {
        console.error('Error inserting alarm batch:', error);
        continue;
      }

      totalInserted += insertedData?.length || 0;
    } catch (batchError) {
      console.error('Batch processing error:', batchError);
    }
  }

  return {
    imported: totalInserted,
    processed: transformedAlarms.length,
    message: `Imported ${totalInserted} alarm records`
  };
}

async function importCostData(credentials: GekkoCredentials, itemId: string, year: number, rowcount: number) {
  const { username, key, gekkoid } = credentials;
  
  // Get item information first
  const listUrl = `https://live.my-gekko.com/api/v1/list/?startrow=0&rowcount=100&year=${year}&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoid}`;
  
  const listResponse = await fetch(listUrl);
  const listData = await listResponse.json();
  
  const itemName = listData?.costs?.[itemId]?.name || `Unknown Item ${itemId}`;
  
  // Fetch daily costs data (list0)
  const apiUrl = `https://live.my-gekko.com/api/v1/list/costs/${itemId}/list0/status?startrow=0&rowcount=${rowcount}&year=${year}&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoid}`;
  
  console.log(`Fetching cost data for ${itemName} (${itemId})`);

  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`myGEKKO API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.rows || !Array.isArray(data.rows)) {
    console.log(`No cost data found for ${itemId}`);
    return { imported: 0, item: itemName, message: 'No cost data available' };
  }

  console.log(`Processing ${data.rows.length} cost records for ${itemName}`);

  // Transform cost data: [Date, Energy Value, Cost Value, Meter Reading]
  const transformedCosts = data.rows.map((row: string[]) => {
    const [dateStr, energyStr, costStr, meterStr] = row;
    
    // Parse German date format: "01.03.25"
    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('.');
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    return {
      item_name: itemName,
      item_id: itemId,
      list_type: 'daily',
      date_recorded: parseDate(dateStr),
      energy_value: parseFloat(energyStr) || 0,
      cost_value: parseFloat(costStr) || 0,
      meter_reading: parseFloat(meterStr) || 0,
      currency: 'EUR'
    };
  }).filter(cost => cost.date_recorded);

  console.log(`Transformed ${transformedCosts.length} valid cost records`);

  // Insert costs in batches
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < transformedCosts.length; i += batchSize) {
    const batch = transformedCosts.slice(i, i + batchSize);
    
    try {
      const { data: insertedData, error } = await supabase
        .from('energy_costs')
        .upsert(batch, { onConflict: 'item_id,list_type,date_recorded' })
        .select('id');

      if (error) {
        console.error('Error inserting cost batch:', error);
        continue;
      }

      totalInserted += insertedData?.length || 0;
    } catch (batchError) {
      console.error('Batch processing error:', batchError);
    }
  }

  return {
    imported: totalInserted,
    processed: transformedCosts.length,
    item: itemName,
    itemId: itemId,
    message: `Imported ${totalInserted} cost records for ${itemName}`
  };
}

async function importWeatherData(credentials: GekkoCredentials, year: number, rowcount: number) {
  const { username, key, gekkoid } = credentials;
  const apiUrl = `https://live.my-gekko.com/api/v1/list/meteo/lists/list0/status?startrow=0&rowcount=${rowcount}&year=${year}&username=${encodeURIComponent(username)}&key=${key}&gekkoid=${gekkoid}`;
  
  console.log('Fetching weather data from myGEKKO');

  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.log('Weather API not available or no data');
      return { imported: 0, message: 'Weather data not available' };
    }

    const data = await response.json();
    
    if (!data.rows || !Array.isArray(data.rows)) {
      console.log('No weather data found');
      return { imported: 0, message: 'No weather data available' };
    }

    console.log(`Processing ${data.rows.length} weather records`);

    // Transform weather data (structure depends on myGEKKO setup)
    const transformedWeather = data.rows.map((row: string[]) => {
      // This structure might need adjustment based on actual weather data format
      const [dateStr, tempStr, humidityStr, ...others] = row;
      
      const parseGermanDate = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return null;
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('.');
        const fullYear = year.length === 2 ? `20${year}` : year;
        return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timePart ? ` ${timePart}` : ''}`);
      };

      const recordedAt = parseGermanDate(dateStr);
      
      return {
        recorded_at: recordedAt?.toISOString(),
        temperature: tempStr && tempStr !== '-' ? parseFloat(tempStr) : null,
        humidity: humidityStr && humidityStr !== '-' ? parseFloat(humidityStr) : null,
        source_system: 'gekko'
      };
    }).filter(weather => weather.recorded_at);

    // Insert weather data in batches
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < transformedWeather.length; i += batchSize) {
      const batch = transformedWeather.slice(i, i + batchSize);
      
      try {
        const { data: insertedData, error } = await supabase
          .from('weather_data')
          .upsert(batch, { onConflict: 'recorded_at,source_system' })
          .select('id');

        if (error) {
          console.error('Error inserting weather batch:', error);
          continue;
        }

        totalInserted += insertedData?.length || 0;
      } catch (batchError) {
        console.error('Batch processing error:', batchError);
      }
    }

    return {
      imported: totalInserted,
      processed: transformedWeather.length,
      message: `Imported ${totalInserted} weather records`
    };

  } catch (error) {
    console.log('Weather data import failed:', error.message);
    return { imported: 0, message: 'Weather data import failed', error: error.message };
  }
}