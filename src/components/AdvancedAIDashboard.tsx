import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Network, 
  AlertTriangle,
  Zap,
  DollarSign,
  Leaf,
  Clock,
  BarChart3,
  Lightbulb,
  Settings
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AdvancedAnalysisResult {
  success: boolean;
  analysis_type: string;
  insights: string;
  generated_at: string;
  model_used: string;
  predictions?: any[];
  model_type?: string;
  accuracy_metrics?: any;
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  estimatedTime: string;
}

const analysisTypes: AnalysisType[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Complete system analysis with GPT-5 insights, efficiency scoring, and optimization recommendations',
    icon: Brain,
    color: 'bg-primary',
    estimatedTime: '2-3 min'
  },
  {
    id: 'predictive_transformer',
    name: 'Transformer Predictions',
    description: 'Advanced time-series forecasting using transformer-inspired analysis with 24h predictions',
    icon: TrendingUp,
    color: 'bg-blue-500',
    estimatedTime: '3-4 min'
  },
  {
    id: 'optimization',
    name: 'Smart Optimization',
    description: 'AI-powered optimization strategies for battery, solar, and load management',
    icon: Target,
    color: 'bg-green-500',
    estimatedTime: '2-3 min'
  },
  {
    id: 'correlation',
    name: 'Advanced Correlations',
    description: 'Deep correlation analysis between energy, weather, and cost patterns',
    icon: Network,
    color: 'bg-purple-500',
    estimatedTime: '1-2 min'
  },
  {
    id: 'anomaly_gpt',
    name: 'AI Anomaly Detection',
    description: 'GPT-powered anomaly detection with root cause analysis and maintenance predictions',
    icon: AlertTriangle,
    color: 'bg-orange-500',
    estimatedTime: '2-3 min'
  }
];

export default function AdvancedAIDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AdvancedAnalysisResult | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('comprehensive');
  const [analysisHistory, setAnalysisHistory] = useState<AdvancedAnalysisResult[]>([]);
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load analysis history from localStorage
    const saved = localStorage.getItem('advanced_ai_history');
    if (saved) {
      setAnalysisHistory(JSON.parse(saved));
    }
  }, []);

  const handleAdvancedAnalysis = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    
    try {
      toast({
        title: "Starting AI Analysis",
        description: `Running ${analysisTypes.find(a => a.id === selectedAnalysis)?.name}...`,
      });

      const { data, error } = await supabase.functions.invoke('energy-ai-advanced', {
        body: {
          analysis_type: selectedAnalysis,
          time_horizon: '7d',
          include_weather: true,
          include_cost_analysis: true
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      
      // Save to history
      const updatedHistory = [data, ...analysisHistory.slice(0, 9)];
      setAnalysisHistory(updatedHistory);
      localStorage.setItem('advanced_ai_history', JSON.stringify(updatedHistory));

      // Process predictions if available
      if (data.predictions) {
        setPredictionData(data.predictions.map((p: any) => ({
          time: new Date(p.timestamp).getHours() + ':00',
          predicted: p.predicted_consumption,
          confidence_min: p.confidence_interval[0],
          confidence_max: p.confidence_interval[1]
        })));
      }

      toast({
        title: "AI Analysis Complete",
        description: `${data.analysis_type} analysis finished successfully`,
      });

    } catch (error) {
      console.error('Error in advanced AI analysis:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to complete AI analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseInsights = (insights: string) => {
    try {
      // Try to parse as JSON first
      return JSON.parse(insights);
    } catch {
      // If not JSON, parse structured text
      const sections = insights.split(/\d+\.\s+\*\*([^*]+)\*\*/);
      const parsed: any = {};
      
      for (let i = 1; i < sections.length; i += 2) {
        const title = sections[i].toLowerCase().replace(/\s+/g, '_');
        const content = sections[i + 1]?.trim();
        parsed[title] = content;
      }
      
      return parsed;
    }
  };

  const formatInsightContent = (content: string) => {
    if (!content) return '';
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
  };

  const getInsightCards = (parsedInsights: any) => {
    const cards = [];
    
    if (parsedInsights.executive_summary) {
      cards.push({
        title: 'Executive Summary',
        content: formatInsightContent(parsedInsights.executive_summary),
        icon: BarChart3,
        color: 'border-blue-200'
      });
    }
    
    if (parsedInsights.energy_efficiency_score || parsedInsights['energy_efficiency_score_(0-100)_with_reasoning']) {
      const score = parsedInsights.energy_efficiency_score || parsedInsights['energy_efficiency_score_(0-100)_with_reasoning'];
      cards.push({
        title: 'Efficiency Score',
        content: formatInsightContent(score),
        icon: Zap,
        color: 'border-green-200'
      });
    }
    
    if (parsedInsights.top_3_optimization_opportunities || parsedInsights['top_3_optimization_opportunities']) {
      const opportunities = parsedInsights.top_3_optimization_opportunities || parsedInsights['top_3_optimization_opportunities'];
      cards.push({
        title: 'Optimization Opportunities',
        content: formatInsightContent(opportunities),
        icon: Lightbulb,
        color: 'border-yellow-200'
      });
    }
    
    if (parsedInsights.predictive_insights) {
      cards.push({
        title: 'Predictive Insights',
        content: formatInsightContent(parsedInsights.predictive_insights),
        icon: TrendingUp,
        color: 'border-purple-200'
      });
    }
    
    if (parsedInsights.financial_impact) {
      cards.push({
        title: 'Financial Impact',
        content: formatInsightContent(parsedInsights.financial_impact),
        icon: DollarSign,
        color: 'border-green-200'
      });
    }
    
    if (parsedInsights.sustainability_metrics) {
      cards.push({
        title: 'Sustainability Metrics',
        content: formatInsightContent(parsedInsights.sustainability_metrics),
        icon: Leaf,
        color: 'border-green-200'
      });
    }
    
    return cards;
  };

  const selectedAnalysisType = analysisTypes.find(a => a.id === selectedAnalysis);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Advanced AI Energy Analysis
          <Badge variant="secondary" className="ml-auto">GPT-5 Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Analysis Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisTypes.map((analysis) => (
                    <Card
                      key={analysis.id}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedAnalysis === analysis.id
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:border-primary'
                      }`}
                      onClick={() => setSelectedAnalysis(analysis.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${analysis.color} text-white`}>
                            <analysis.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{analysis.name}</h4>
                              <Badge variant="outline">{analysis.estimatedTime}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {analysis.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedAnalysisType && (
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <selectedAnalysisType.icon className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{selectedAnalysisType.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Estimated completion: {selectedAnalysisType.estimatedTime}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleAdvancedAnalysis}
                        disabled={isAnalyzing}
                        className="min-w-32"
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Analyzing...
                          </div>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Run Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResult ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Analysis Results</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{analysisResult.model_used}</Badge>
                        <Badge variant="outline">
                          {new Date(analysisResult.generated_at).toLocaleString()}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const parsedInsights = parseInsights(analysisResult.insights);
                      const insightCards = getInsightCards(parsedInsights);
                      
                      if (insightCards.length > 0) {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insightCards.map((card, index) => (
                              <Card key={index} className={`${card.color} border-2`}>
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-base">
                                    <card.icon className="h-5 w-5" />
                                    {card.title}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {card.content}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                              {analysisResult.insights}
                            </pre>
                          </div>
                        );
                      }
                    })()}
                  </CardContent>
                </Card>

                {analysisResult.predictions && predictionData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        24-Hour Predictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={predictionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="confidence_max"
                            stackId="confidence"
                            stroke="none"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.1}
                          />
                          <Area
                            type="monotone"
                            dataKey="confidence_min"
                            stackId="confidence"
                            stroke="none"
                            fill="white"
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                      
                      {analysisResult.accuracy_metrics && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {analysisResult.accuracy_metrics.mae?.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">MAE</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {analysisResult.accuracy_metrics.rmse?.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">RMSE</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {analysisResult.accuracy_metrics.mape?.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">MAPE</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {(analysisResult.accuracy_metrics.r2_score * 100)?.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">R² Score</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Run an AI analysis to see detailed insights, predictions, and optimization recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {analysisHistory.length > 0 ? (
              <div className="space-y-3">
                {analysisHistory.map((result, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setAnalysisResult(result)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const analysisType = analysisTypes.find(a => a.id === result.analysis_type);
                            const Icon = analysisType?.icon || Brain;
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()}
                          <div>
                            <h4 className="font-medium">
                              {analysisTypes.find(a => a.id === result.analysis_type)?.name || result.analysis_type}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.generated_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{result.model_used}</Badge>
                          {result.success && <Badge variant="secondary" className="bg-green-100 text-green-700">Success</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Analysis History</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Your analysis history will appear here after running AI analyses.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}