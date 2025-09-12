import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, AlertTriangle, TrendingUp, Zap, Calendar, Download, Database, Activity, Settings, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MLAnalysisResult {
  success: boolean;
  analysis_type?: string;
  data_points_analyzed?: number;
  insights?: any[];
  message?: string;
}

interface MultiImportResult {
  success: boolean;
  imported?: {
    alarms?: { imported: number; processed: number };
    costs?: Array<{ imported: number; item: string; itemId: string }>;
    weather?: { imported: number; processed: number };
  };
  summary?: {
    totalImported: number;
    dataTypes: number;
    year: number;
  };
}

export function AdvancedMLDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MLAnalysisResult | null>(null);
  const [importResult, setImportResult] = useState<MultiImportResult | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState('seasonal');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [dataStats, setDataStats] = useState<any>(null);
  const { toast } = useToast();

  const gekkoCredentials = {
    username: 'mustermann@my-gekko.com',
    key: 'HjR9j4BrruA8wZiBeiWXnD',
    gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
  };

  const analysisTypes = [
    { id: 'seasonal', name: 'Seasonal Analysis', icon: Calendar, description: 'Identify energy patterns across seasons' },
    { id: 'weather_correlation', name: 'Weather Correlation', icon: Cloud, description: 'Analyze weather impact on energy usage' },
    { id: 'predictive', name: 'Predictive Modeling', icon: TrendingUp, description: 'Forecast future energy consumption' },
    { id: 'anomaly_detection', name: 'Anomaly Detection', icon: AlertTriangle, description: 'Detect unusual patterns and equipment issues' },
    { id: 'optimization', name: 'Optimization Analysis', icon: Zap, description: 'Find opportunities to reduce energy costs' }
  ];

  useEffect(() => {
    fetchDataStats();
  }, []);

  const fetchDataStats = async () => {
    try {
      // Get counts from all tables
      const [energyCount, alarmsCount, costsCount, weatherCount] = await Promise.all([
        supabase.from('energy_readings').select('id', { count: 'exact', head: true }),
        supabase.from('system_alarms').select('id', { count: 'exact', head: true }),
        supabase.from('energy_costs').select('id', { count: 'exact', head: true }),
        supabase.from('weather_data').select('id', { count: 'exact', head: true })
      ]);

      setDataStats({
        energyReadings: energyCount.count || 0,
        systemAlarms: alarmsCount.count || 0,
        energyCosts: costsCount.count || 0,
        weatherData: weatherCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching data stats:', error);
    }
  };

  const handleMultiImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('gekko-multi-import', {
        body: {
          credentials: gekkoCredentials,
          dataTypes: ['alarms', 'costs', 'meteo'],
          year: parseInt(selectedYear),
          rowcount: 1000,
          items: ['item0', 'item1', 'item2'] // Import from multiple charging stations
        }
      });

      if (error) {
        throw error;
      }

      setImportResult(data);
      await fetchDataStats(); // Refresh stats
      
      toast({
        title: "Multi-Source Import Successful",
        description: `Imported ${data.summary?.totalImported || 0} records from ${data.summary?.dataTypes || 0} data sources`,
      });

    } catch (error) {
      console.error('Multi-import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || 'Failed to import multi-source data',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleMLAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('energy-ml-analysis', {
        body: {
          analysis_type: selectedAnalysis,
          lookback_days: 365 // Use more data for better analysis
        }
      });

      if (error) {
        throw error;
      }

      setAnalysisResult(data);
      
      toast({
        title: "ML Analysis Complete",
        description: `Generated ${data.insights?.length || 0} insights from ${data.data_points_analyzed || 0} data points`,
      });

    } catch (error) {
      console.error('ML Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || 'Failed to perform ML analysis',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const selectedAnalysisInfo = analysisTypes.find(a => a.id === selectedAnalysis);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced ML Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive machine learning analysis using multi-source myGEKKO data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import">Data Import</TabsTrigger>
              <TabsTrigger value="analysis">ML Analysis</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="space-y-4">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{dataStats?.energyReadings?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">Energy Readings</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold">{dataStats?.systemAlarms?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">System Alarms</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{dataStats?.energyCosts?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">Cost Records</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Cloud className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{dataStats?.weatherData?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">Weather Records</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Import comprehensive data from myGEKKO including: system alarms, energy costs from multiple charging stations, and weather data for advanced correlations.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleMultiImport} 
                  disabled={isImporting}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing Multi-Source Data...' : `Import All Data Types (${selectedYear})`}
                </Button>
              </div>

              {importResult && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Import Results</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Total Imported:</strong> {importResult.summary?.totalImported || 0} records</p>
                      <p><strong>Data Sources:</strong> {importResult.summary?.dataTypes || 0}</p>
                      <p><strong>Year:</strong> {importResult.summary?.year}</p>
                    </div>
                    <div>
                      {importResult.imported?.alarms && (
                        <p><strong>Alarms:</strong> {importResult.imported.alarms.imported} imported</p>
                      )}
                      {importResult.imported?.costs && (
                        <p><strong>Cost Items:</strong> {importResult.imported.costs.length} charging stations</p>
                      )}
                      {importResult.imported?.weather && (
                        <p><strong>Weather:</strong> {importResult.imported.weather.imported} records</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Type</label>
                  <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAnalysisInfo && (
                  <Alert>
                    <selectedAnalysisInfo.icon className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{selectedAnalysisInfo.name}:</strong> {selectedAnalysisInfo.description}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleMLAnalysis} 
                  disabled={isAnalyzing || !dataStats?.energyReadings}
                  className="w-full"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Running ML Analysis...' : `Run ${selectedAnalysisInfo?.name} Analysis`}
                </Button>

                {!dataStats?.energyReadings && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No energy data available. Please import data first to run ML analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {analysisResult && analysisResult.insights && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                    <Badge variant="outline">
                      {analysisResult.data_points_analyzed} data points analyzed
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {analysisResult.insights.map((insight: any, index: number) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{insight.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {insight.description}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={insight.severity === 'high' ? 'destructive' : 
                                        insight.severity === 'medium' ? 'default' : 'secondary'}
                              >
                                {insight.severity}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {insight.confidence_score}% confidence
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Progress value={insight.confidence_score} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              Category: {insight.category} • Type: {insight.insight_type}
                            </div>
                            {insight.metadata && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground">Technical Details</summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs">
                                  {JSON.stringify(insight.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {!analysisResult && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run an ML analysis to see insights here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}