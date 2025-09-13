import AdvancedAIDashboard from "@/components/AdvancedAIDashboard";
import { AdvancedMLDashboard } from "@/components/AdvancedMLDashboard";
import { ProphetForecastCard } from "@/components/ProphetForecastCard";
import { EnergyPredictionChart } from "@/components/EnergyPredictionChart";
import { PredictiveMaintenanceCard } from "@/components/PredictiveMaintenanceCard";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGekkoApi } from "@/hooks/useGekkoApi";

export default function AI() {
  const { data, status, isLoading } = useGekkoApi({ refreshInterval: 30000 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI & Machine Learning</h1>
        <p className="text-muted-foreground mt-2">
          Advanced AI analysis, forecasting, and intelligent insights for your energy system
        </p>
      </div>

      <Tabs defaultValue="ai-analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="ml-analytics">ML Analytics</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="voice-ai">Voice AI</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-analysis" className="space-y-6">
          <AdvancedAIDashboard />
        </TabsContent>

        <TabsContent value="ml-analytics" className="space-y-6">
          <AdvancedMLDashboard />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid gap-6">
            <ProphetForecastCard />
            <EnergyPredictionChart data={data} />
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveMaintenanceCard data={data} />
        </TabsContent>

        <TabsContent value="voice-ai" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Voice AI Assistant</h3>
              <p className="text-muted-foreground mb-6">
                Interact with your energy system using natural language. Ask questions, get insights, and control devices with voice commands.
              </p>
              <VoiceAssistant />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}