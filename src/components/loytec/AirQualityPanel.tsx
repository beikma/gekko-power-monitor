import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wind, Droplets, Gauge, AlertTriangle } from 'lucide-react';

interface AirQualityPanelProps {
  data: any;
}

interface AirQualityMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  max: number;
  status: 'good' | 'moderate' | 'poor';
  icon: React.ReactNode;
  description: string;
}

export function AirQualityPanel({ data }: AirQualityPanelProps) {
  // Extract air quality data from gekko data or use mock data
  const airQualityMetrics: AirQualityMetric[] = [
    {
      id: 'co2',
      label: 'CO₂',
      value: 420,
      unit: 'ppm',
      max: 1000,
      status: 'good',
      icon: <Wind className="w-4 h-4" />,
      description: 'Carbon dioxide concentration'
    },
    {
      id: 'pm25',
      label: 'PM2.5',
      value: 12,
      unit: 'µg/m³',
      max: 50,
      status: 'good',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Fine particulate matter'
    },
    {
      id: 'pm10',
      label: 'PM10',
      value: 18,
      unit: 'µg/m³',
      max: 100,
      status: 'good',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Coarse particulate matter'
    },
    {
      id: 'pm1',
      label: 'PM1',
      value: 8,
      unit: 'µg/m³',
      max: 25,
      status: 'good',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Ultra-fine particulate matter'
    },
    {
      id: 'tvoc',
      label: 'TVOC',
      value: 245,
      unit: 'ppb',
      max: 1000,
      status: 'good',
      icon: <Gauge className="w-4 h-4" />,
      description: 'Total volatile organic compounds'
    },
    {
      id: 'humidity',
      label: 'Humidity',
      value: 48,
      unit: '%',
      max: 100,
      status: 'good',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Relative humidity'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'moderate': return 'text-amber-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Good</Badge>;
      case 'moderate': return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Moderate</Badge>;
      case 'poor': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Poor</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'moderate': return 'bg-amber-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const overallStatus = airQualityMetrics.some(m => m.status === 'poor') ? 'poor' :
                       airQualityMetrics.some(m => m.status === 'moderate') ? 'moderate' : 'good';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Air Quality</h3>
        </div>
        {getStatusBadge(overallStatus)}
      </div>

      {/* Overall Air Quality Index */}
      <Card className="p-4 bg-gradient-to-r from-green-500/5 to-blue-500/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall AQI</span>
          <span className="text-2xl font-bold text-green-500">Good</span>
        </div>
        <Progress value={25} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0</span>
          <span>Excellent air quality conditions</span>
          <span>500</span>
        </div>
      </Card>

      {/* Individual Metrics */}
      <div className="space-y-3">
        {airQualityMetrics.map((metric) => (
          <div key={metric.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${getStatusColor(metric.status)}`}>
                {metric.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.description}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold">
                {metric.value} <span className="text-xs font-normal text-muted-foreground">{metric.unit}</span>
              </div>
              <div className="w-16 mt-1">
                <Progress 
                  value={(metric.value / metric.max) * 100} 
                  className="h-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {overallStatus !== 'good' && (
        <Card className="p-3 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div className="text-sm">
              <div className="font-medium text-amber-500">Air Quality Alert</div>
              <div className="text-muted-foreground">
                Some air quality metrics require attention. Check ventilation systems.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}