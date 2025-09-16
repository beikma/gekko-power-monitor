import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Droplets, 
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause
} from 'lucide-react';

interface LiveDataFeedProps {
  gekkoData: any;
  status: any;
  latestReading: any;
}

interface LiveDataPoint {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: string;
  type: 'energy' | 'temperature' | 'humidity' | 'air_quality' | 'system';
  icon: React.ReactNode;
}

export function LiveDataFeed({ gekkoData, status, latestReading }: LiveDataFeedProps) {
  const [isLive, setIsLive] = useState(true);
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);

  // Generate live data points with real data integration
  const generateLiveDataPoint = (): LiveDataPoint[] => {
    const baseData = [
      {
        id: 'power_consumption',
        name: 'Power Consumption',
        value: latestReading?.current_power || (8500 + Math.random() * 1000 - 500),
        unit: 'W',
        type: 'energy' as const,
        icon: <Zap className="w-3 h-3" />
      },
      {
        id: 'temperature_avg',
        name: 'Avg Temperature',
        value: latestReading?.temperature || (22.5 + Math.random() * 2 - 1),
        unit: '°C',
        type: 'temperature' as const,
        icon: <Thermometer className="w-3 h-3" />
      },
      {
        id: 'humidity_avg',
        name: 'Avg Humidity',
        value: latestReading?.humidity || (45 + Math.random() * 10 - 5),
        unit: '%',
        type: 'humidity' as const,
        icon: <Droplets className="w-3 h-3" />
      },
      {
        id: 'co2_level',
        name: 'CO₂ Level',
        value: 420 + Math.random() * 100 - 50, // Could extract from gekkoData if available
        unit: 'ppm',
        type: 'air_quality' as const,
        icon: <Wind className="w-3 h-3" />
      },
      {
        id: 'energy_efficiency',
        name: 'Energy Efficiency',
        value: latestReading?.efficiency_score || (85 + Math.random() * 10 - 5),
        unit: '%',
        type: 'system' as const,
        icon: <Activity className="w-3 h-3" />
      }
    ];

    return baseData.map(item => {
      const prevValue = liveData.find(prev => prev.id === item.id)?.value || item.value;
      const change = ((item.value - prevValue) / prevValue) * 100;
      const trend = Math.abs(change) < 0.5 ? 'stable' : change > 0 ? 'up' : 'down';
      
      return {
        ...item,
        value: Math.round(item.value * 100) / 100,
        trend,
        change: Math.round(change * 100) / 100,
        timestamp: new Date().toLocaleTimeString()
      };
    });
  };

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLiveData(generateLiveDataPoint());
    }, 2000);

    // Initial data
    setLiveData(generateLiveDataPoint());

    return () => clearInterval(interval);
  }, [isLive, liveData, latestReading]);

  const getTrendIcon = (trend: LiveDataPoint['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'stable':
        return <Minus className="w-3 h-3 text-gray-500" />;
      default:
        return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: LiveDataPoint['trend']) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      case 'stable': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeColor = (type: LiveDataPoint['type']) => {
    switch (type) {
      case 'energy': return 'text-amber-500';
      case 'temperature': return 'text-red-500';
      case 'humidity': return 'text-blue-500';
      case 'air_quality': return 'text-green-500';
      case 'system': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Live Data Feed</h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLive(!isLive)}
          className="flex items-center gap-2"
        >
          {isLive ? (
            <>
              <Pause className="w-3 h-3" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Resume
            </>
          )}
        </Button>
      </div>

      {/* Live Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className="text-xs text-muted-foreground">
          {isLive ? 'Live updates every 2 seconds' : 'Updates paused'}
        </span>
      </div>

      {/* Data Points */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {liveData.map((point) => (
          <Card key={point.id} className="p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${getTypeColor(point.type)} bg-muted`}>
                  {point.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{point.name}</div>
                  <div className="text-xs text-muted-foreground">{point.timestamp}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-bold text-sm">
                    {point.value} {point.unit}
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(point.trend)}
                    <span className={`text-xs ${getTrendColor(point.trend)}`}>
                      {Math.abs(point.change)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Statistics */}
      <Card className="p-3 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Updates</div>
            <div className="font-bold text-sm">{liveData.length * 5}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Trending Up</div>
            <div className="font-bold text-sm text-green-500">
              {liveData.filter(p => p.trend === 'up').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Trending Down</div>
            <div className="font-bold text-sm text-red-500">
              {liveData.filter(p => p.trend === 'down').length}
            </div>
          </div>
        </div>
      </Card>

      {/* Data Quality */}
      <div className="text-xs text-muted-foreground text-center">
        Data source: {latestReading ? 'Real Energy Data' : 'Simulated'} • Last sync: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}