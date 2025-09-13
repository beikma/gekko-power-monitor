import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamsNotificationRequest {
  alarm: {
    id: string;
    description: string;
    alarm_type: string;
    severity: string;
    status: string;
    start_time: string;
    metadata?: any;
  };
  building_info?: {
    name: string;
    address: string;
  };
}

interface TeamsConfig {
  id: string;
  name: string;
  webhook_url: string;
  notification_types: string[];
  severity_levels: string[];
  user_roles: string[];
  is_active: boolean;
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

    const { alarm, building_info }: TeamsNotificationRequest = await req.json();

    console.log("Processing Teams notification for alarm:", alarm.id);

    // Fetch active Teams configurations
    const { data: teamsConfigs, error: configError } = await supabaseClient
      .from('teams_configuration')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Failed to fetch Teams configurations: ${configError.message}`);
    }

    if (!teamsConfigs || teamsConfigs.length === 0) {
      console.log("No active Teams configurations found");
      return new Response(
        JSON.stringify({ message: "No active Teams configurations" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter configurations based on alarm type and severity
    const relevantConfigs = teamsConfigs.filter((config: TeamsConfig) => {
      const matchesType = config.notification_types.length === 0 || 
                         config.notification_types.includes(alarm.alarm_type);
      const matchesSeverity = config.severity_levels.includes(alarm.severity);
      
      return matchesType && matchesSeverity;
    });

    console.log(`Found ${relevantConfigs.length} relevant Teams configurations`);

    // Send notifications to all relevant Teams channels
    const notifications = relevantConfigs.map(async (config: TeamsConfig) => {
      try {
        const teamsCard = createTeamsCard(alarm, building_info, config);
        
        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(teamsCard),
        });

        if (!response.ok) {
          throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}`);
        }

        console.log(`Successfully sent notification to ${config.name}`);
        return { config: config.name, success: true };
      } catch (error) {
        console.error(`Failed to send notification to ${config.name}:`, error);
        return { config: config.name, success: false, error: error.message };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount}/${results.length} Teams notifications`,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error sending Teams notifications:', error);
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

function createTeamsCard(alarm: any, building_info: any, config: TeamsConfig) {
  const severityColor = getSeverityColor(alarm.severity);
  const buildingName = building_info?.name || "Building Management System";
  const buildingAddress = building_info?.address || "Unknown Location";
  
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": severityColor,
    "summary": `${alarm.severity.toUpperCase()} Alert: ${alarm.description}`,
    "sections": [
      {
        "activityTitle": `🚨 ${alarm.severity.toUpperCase()} ALERT`,
        "activitySubtitle": buildingName,
        "activityImage": "https://img.icons8.com/color/96/000000/warning-shield.png",
        "facts": [
          {
            "name": "Alert Type:",
            "value": alarm.alarm_type.charAt(0).toUpperCase() + alarm.alarm_type.slice(1)
          },
          {
            "name": "Description:",
            "value": alarm.description
          },
          {
            "name": "Severity:",
            "value": alarm.severity.toUpperCase()
          },
          {
            "name": "Status:",
            "value": alarm.status.charAt(0).toUpperCase() + alarm.status.slice(1)
          },
          {
            "name": "Location:",
            "value": buildingAddress
          },
          {
            "name": "Time:",
            "value": new Date(alarm.start_time).toLocaleString()
          },
          {
            "name": "Notification Channel:",
            "value": config.name
          }
        ],
        "markdown": true
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "View Dashboard",
        "targets": [
          {
            "os": "default",
            "uri": `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://dashboard.example.com'}`
          }
        ]
      }
    ]
  };
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return '#DC3545'; // Red
    case 'high':
      return '#FD7E14'; // Orange  
    case 'medium':
      return '#FFC107'; // Yellow
    case 'low':
      return '#28A745'; // Green
    default:
      return '#6C757D'; // Gray
  }
}