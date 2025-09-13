import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Lightbulb,
  Zap,
  Loader2,
  Sparkles
} from "lucide-react";
import { WidgetProps } from "@/types/widget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AIInsightsWidget({ data, status, isLoading, size = 'medium' }: WidgetProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const runQuickAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('energy-ai-analysis-simple', {
        body: {
          current_power: status?.power?.consumption || 0,
          solar_generation: status?.power?.solar || 0,
          battery_level: status?.power?.battery || 0
        }
      });

      if (error) throw error;

      setInsights(result);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (size === 'small') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-purple-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quick Analysis</span>
            <Button 
              size="sm" 
              onClick={runQuickAnalysis}
              disabled={analyzing}
              className="gap-1"
            >
              {analyzing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {analyzing ? 'Running...' : 'Analyze'}
            </Button>
          </div>

          {insights && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-energy-success" />
                <span className="text-xs text-energy-success font-medium">
                  Efficiency: {insights.efficiency_score || 85}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {insights.summary || 'Run analysis for AI insights'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium/Large size
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AI Energy Insights
          </div>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-2 w-2 mr-1" />
            GPT-5
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Efficiency Score</p>
            <p className="text-lg font-bold text-energy-success">
              {insights?.efficiency_score || 85}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Savings Potential</p>
            <p className="text-lg font-bold text-energy-warning">
              €{insights?.savings_potential || 25}/mo
            </p>
          </div>
        </div>

        {/* AI Insights */}
        {insights ? (
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-energy-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Top Recommendation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insights.recommendation || 'Optimize battery charging during off-peak hours for 15% cost reduction'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Trend: {insights.trend || 'Improving'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-blue-500" />
                <span>Peak: {insights.peak_usage || '18:00-20:00'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Get AI-powered insights about your energy usage
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={runQuickAnalysis}
            disabled={analyzing}
            className="flex-1 gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-3 w-3" />
                Quick Analysis
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = '/ai'}
            className="gap-2"
          >
            <Sparkles className="h-3 w-3" />
            Advanced
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}