import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarbonIntensity } from '@/hooks/useCarbonIntensity';
import { Leaf, Zap, Clock, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function CarbonIntensityCard() {
  const { 
    data, 
    isLoading, 
    error, 
    fetchCarbonIntensity, 
    getOptimalTimeSlots,
    isLowCarbonPeriod,
    hasData,
    currentIntensity,
    currentIndex,
    isGreenTime
  } = useCarbonIntensity();

  useEffect(() => {
    // Auto-fetch on mount
    fetchCarbonIntensity();
  }, [fetchCarbonIntensity]);

  const formatChartData = () => {
    if (!data?.forecast) return [];
    
    return data.forecast.slice(0, 24).map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' }),
      intensity: point.intensity,
      index: point.index
    }));
  };

  const getIntensityColor = (index: string) => {
    switch (index) {
      case 'very low': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-100';
      case 'moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'very high': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const optimalSlots = hasData ? getOptimalTimeSlots(6) : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          Carbon Intensity
        </CardTitle>
        <CardDescription>
          Grid carbon intensity for smart energy scheduling (UK)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fetchCarbonIntensity} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
          
          {isGreenTime && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Leaf className="h-3 w-3 mr-1" />
              Green Time!
            </Badge>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {hasData && data && (
          <>
            {/* Current Carbon Intensity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Current Intensity</div>
                  <div className="font-bold text-xl">{currentIntensity} <span className="text-sm font-normal">gCO₂/kWh</span></div>
                  <Badge className={getIntensityColor(currentIndex || 'moderate')}>
                    {currentIndex}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <TrendingDown className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-semibold">
                    {isGreenTime ? 'Good for Usage' : 'Consider Delaying'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target: &lt; 200 gCO₂/kWh
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Next Green Slot</div>
                  <div className="font-semibold">
                    {optimalSlots[0] ? 
                      new Date(optimalSlots[0].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                      'No data'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {optimalSlots[0]?.intensity} gCO₂/kWh
                  </div>
                </div>
              </div>
            </div>

            {/* 24-Hour Forecast */}
            <div className="space-y-2">
              <h4 className="font-semibold">24-Hour Carbon Intensity Forecast</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value} gCO₂/kWh`, 'Carbon Intensity']}
                  />
                  <ReferenceLine y={200} stroke="green" strokeDasharray="3 3" label="Green Threshold" />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Optimal Time Slots */}
            {optimalSlots.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Best Times for Energy Usage (Next 48h)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {optimalSlots.slice(0, 6).map((slot, index) => (
                    <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-center">
                      <div className="font-semibold text-sm">
                        {new Date(slot.timestamp).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs text-green-700">
                        {slot.intensity} gCO₂/kWh
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(data.updated_at).toLocaleString()}
              <br />
              Data source: UK National Grid Carbon Intensity API
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}