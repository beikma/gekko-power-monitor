import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, DollarSign, Leaf, Gauge, Clock } from 'lucide-react';

interface EnergyKPIRadarProps {
  data: any;
}

interface KPIData {
  category: string;
  current: number;
  target: number;
  previous: number;
}

export function EnergyKPIRadar({ data }: EnergyKPIRadarProps) {
  // Mock KPI data - in real implementation this would be calculated from your energy data
  const kpiData: KPIData[] = [
    { category: 'Energy Efficiency', current: 85, target: 90, previous: 78 },
    { category: 'Cost Optimization', current: 78, target: 85, previous: 72 },
    { category: 'Comfort Score', current: 92, target: 95, previous: 88 },
    { category: 'Environmental', current: 88, target: 95, previous: 85 },
    { category: 'System Performance', current: 91, target: 95, previous: 89 },
    { category: 'Maintenance Score', current: 76, target: 85, previous: 74 }
  ];

  // Overall performance score
  const overallScore = Math.round(kpiData.reduce((acc, item) => acc + item.current, 0) / kpiData.length);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/10 text-green-500">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-amber-500/10 text-amber-500">Good</Badge>;
    return <Badge className="bg-red-500/10 text-red-500">Needs Attention</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Energy KPIs</h3>
        </div>
        {getScoreBadge(overallScore)}
      </div>

      {/* Overall Score */}
      <Card className="p-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 text-center">
        <div className="text-sm text-muted-foreground mb-1">Overall Performance</div>
        <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Building efficiency score
        </div>
      </Card>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={kpiData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
              className="text-xs"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
              tickCount={5}
            />
            <Radar
              name="Current"
              dataKey="current"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="hsl(var(--muted-foreground))"
              fill="transparent"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Radar
              name="Previous"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              fill="transparent"
              strokeWidth={1}
              opacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Details */}
      <div className="space-y-2">
        {kpiData.map((item, index) => {
          const improvement = item.current - item.previous;
          const targetGap = item.target - item.current;
          
          return (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                {getKPIIcon(item.category)}
                <span className="text-sm font-medium">{item.category}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`font-bold text-sm ${getScoreColor(item.current)}`}>
                    {item.current}%
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {improvement > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                    )}
                    <span className={improvement > 0 ? 'text-green-500' : 'text-red-500'}>
                      {improvement > 0 ? '+' : ''}{improvement}%
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Target: {item.target}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Insights */}
      <Card className="p-3 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Performance Insights</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>• Comfort score exceeds target by {kpiData[2].current - kpiData[2].target}%</div>
          <div>• Energy efficiency improved by {kpiData[0].current - kpiData[0].previous}% this period</div>
          <div>• Maintenance score needs {kpiData[5].target - kpiData[5].current}% improvement</div>
        </div>
      </Card>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

function getKPIIcon(category: string) {
  switch (category) {
    case 'Energy Efficiency':
      return <Zap className="w-4 h-4 text-amber-500" />;
    case 'Cost Optimization':
      return <DollarSign className="w-4 h-4 text-green-500" />;
    case 'Comfort Score':
      return <Gauge className="w-4 h-4 text-blue-500" />;
    case 'Environmental':
      return <Leaf className="w-4 h-4 text-emerald-500" />;
    case 'System Performance':
      return <TrendingUp className="w-4 h-4 text-purple-500" />;
    case 'Maintenance Score':
      return <Clock className="w-4 h-4 text-orange-500" />;
    default:
      return <Gauge className="w-4 h-4 text-gray-500" />;
  }
}