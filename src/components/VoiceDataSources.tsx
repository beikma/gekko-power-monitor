import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, Cloud, Sun, Building, Activity, AlertTriangle, Thermometer } from 'lucide-react';

export function VoiceDataSources() {
  const dataSources = [
    {
      name: 'GEKKO Building Control',
      icon: <Building className="h-4 w-4" />,
      status: 'active',
      description: 'Real-time access to lights, temperature, HVAC systems',
      capabilities: ['Temperature control', 'Light control', 'Room sensors', 'System status'],
      color: 'bg-blue-500'
    },
    {
      name: 'Energy Monitoring',
      icon: <Zap className="h-4 w-4" />,
      status: 'active', 
      description: 'Live power consumption, solar generation, battery status',
      capabilities: ['Current power usage', 'Daily consumption', 'Solar output', 'Battery levels'],
      color: 'bg-green-500'
    },
    {
      name: 'Weather Data',
      icon: <Cloud className="h-4 w-4" />,
      status: 'active',
      description: 'Current weather and forecasts for optimization',
      capabilities: ['Temperature', 'Humidity', 'Weather conditions', '7-day forecast'],
      color: 'bg-cyan-500'
    },
    {
      name: 'Solar Forecast',
      icon: <Sun className="h-4 w-4" />,
      status: 'active',
      description: 'Predicted solar generation for energy planning',
      capabilities: ['Solar predictions', 'Optimal usage times', 'Weather correlation'],
      color: 'bg-yellow-500'
    },
    {
      name: 'Building Database',
      icon: <Database className="h-4 w-4" />,
      status: 'active',
      description: 'Historical data, configurations, and analytics',
      capabilities: ['Historical trends', 'System configurations', 'Usage patterns'],
      color: 'bg-purple-500'
    },
    {
      name: 'System Alarms',
      icon: <AlertTriangle className="h-4 w-4" />,
      status: 'active',
      description: 'Active alerts and system notifications',
      capabilities: ['Active alarms', 'System health', 'Maintenance alerts'],
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dataSources.map((source, index) => (
        <Card key={index} className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${source.color}`} />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 ${source.color} text-white rounded-lg`}>
                {source.icon}
              </div>
              <div>
                <CardTitle className="text-sm">{source.name}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {source.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mb-3">
              {source.description}
            </CardDescription>
            <div className="space-y-1">
              {source.capabilities.map((capability, capIndex) => (
                <div key={capIndex} className="text-xs text-muted-foreground flex items-center gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  {capability}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function VoiceCapabilitiesOverview() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>ChatGPT Voice Assistant Data Access</CardTitle>
            <CardDescription>
              The assistant can access all building systems and data sources in real-time
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">What You Can Ask:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>• "What's the current energy consumption?"</div>
              <div>• "Set office temperature to 22 degrees"</div>
              <div>• "How much solar power are we generating?"</div>
              <div>• "Turn lobby lights to 75 percent"</div>
              <div>• "Show me today's weather forecast"</div>
              <div>• "What's the building status?"</div>
              <div>• "Are there any system alarms?"</div>
              <div>• "Give me an energy efficiency analysis"</div>
            </div>
          </div>
          
          <VoiceDataSources />
          
          <div className="pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              <strong>Real-time Integration:</strong> The assistant uses ChatGPT for natural language understanding 
              combined with direct access to your building's APIs and databases for accurate, up-to-date responses.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}