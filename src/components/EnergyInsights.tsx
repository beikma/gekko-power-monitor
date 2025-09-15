import { Brain, TrendingUp, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnergyAI } from "@/hooks/useEnergyAI";
import { useEnergyReadings } from "@/hooks/useEnergyReadings";
import { supabase } from "@/integrations/supabase/client";

export default function EnergyInsights() {
  const { insights, isAnalyzing, triggerAIAnalysis } = useEnergyAI();
  const { latestReading } = useEnergyReadings();
  
  const triggerEnhancedAnalysis = async () => {
    // Get building info for context
    const { data: buildingInfo } = await supabase
      .from('building_info')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    // Get weather context if building location available
    let weatherContext = null;
    if (buildingInfo?.latitude && buildingInfo?.longitude) {
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/current?latitude=${buildingInfo.latitude}&longitude=${buildingInfo.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
        );
        weatherContext = await weatherResponse.json();
      } catch (error) {
        console.log('Weather data not available');
      }
    }
    
    // Store enhanced energy reading with context
    if (latestReading && buildingInfo) {
      await supabase.from('energy_readings').insert({
        current_power: latestReading.current_power,
        daily_energy: latestReading.daily_energy,
        battery_level: latestReading.battery_level,
        pv_power: latestReading.pv_power,
        grid_power: latestReading.grid_power,
        temperature: weatherContext?.current?.temperature_2m,
        humidity: weatherContext?.current?.relative_humidity_2m,
        weather_condition: weatherContext?.current?.weather_code ? `Code_${weatherContext.current.weather_code}` : null
      });
    }
    
    // Trigger AI analysis with enhanced context
    await triggerAIAnalysis();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-energy-danger" />;
      case 'medium':
        return <Info className="h-4 w-4 text-energy-warning" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-energy-success" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-energy-danger/20 text-energy-danger border-energy-danger/30';
      case 'medium':
        return 'bg-energy-warning/20 text-energy-warning border-energy-warning/30';
      case 'low':
        return 'bg-energy-success/20 text-energy-success border-energy-success/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="energy-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-energy-primary" />
            AI Energy Insights
          </CardTitle>
          <Button
            onClick={triggerEnhancedAnalysis}
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-energy-primary border-t-transparent rounded-full mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Enhanced Analysis
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet</p>
            <p className="text-sm">Click "Enhanced Analysis" to generate AI insights using real data + weather context</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="border border-energy-border rounded-lg p-4 bg-energy-surface/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(insight.severity)}
                    <h4 className="font-medium text-energy-text">{insight.title}</h4>
                  </div>
                  <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                    {insight.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="bg-energy-primary/10 text-energy-primary px-2 py-1 rounded">
                    {insight.category}
                  </span>
                  <span>
                    {Math.round(insight.confidence_score * 100)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}