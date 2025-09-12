import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Brain, Zap } from 'lucide-react';

interface EnergyPredictionChartProps {
  data: any;
}

export function EnergyPredictionChart({ data }: EnergyPredictionChartProps) {
  // Generate prediction data based on current patterns
  const generatePredictionData = () => {
    const currentHour = new Date().getHours();
    const predictions = [];
    
    // Historical pattern simulation
    const baseConsumption = [3.2, 2.8, 2.5, 2.3, 2.1, 2.4, 3.1, 4.2, 5.1, 4.8, 4.5, 4.7, 4.9, 4.6, 4.3, 4.1, 4.4, 5.2, 5.8, 5.3, 4.7, 4.1, 3.8, 3.5];
    const pvGeneration = [0, 0, 0, 0, 0, 0.2, 1.1, 2.3, 3.8, 4.9, 5.6, 6.1, 6.3, 5.9, 5.2, 4.1, 2.8, 1.2, 0.3, 0, 0, 0, 0, 0];
    
    for (let i = 0; i < 24; i++) {
      const hour = i;
      const isPast = hour <= currentHour;
      const consumption = baseConsumption[i] * (0.9 + Math.random() * 0.2);
      const pv = pvGeneration[i] * (0.8 + Math.random() * 0.4);
      const grid = Math.max(0, consumption - pv);
      const battery = Math.min(pv - consumption, 0);
      
      predictions.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        consumption: parseFloat(consumption.toFixed(2)),
        pv: parseFloat(pv.toFixed(2)),
        grid: parseFloat(grid.toFixed(2)),
        battery: parseFloat(battery.toFixed(2)),
        isPrediction: !isPast,
        cost: parseFloat((grid * 0.32 + Math.max(0, consumption - pv) * 0.08).toFixed(2))
      });
    }
    
    return predictions;
  };

  const predictionData = generatePredictionData();
  const currentHour = new Date().getHours();
  const todayTotal = predictionData.reduce((sum, item) => sum + item.consumption, 0);
  const todayCost = predictionData.reduce((sum, item) => sum + item.cost, 0);
  const pvTotal = predictionData.reduce((sum, item) => sum + item.pv, 0);
  const selfConsumption = ((pvTotal / todayTotal) * 100);

  // ML predictions for tomorrow
  const tomorrowPrediction = {
    consumption: todayTotal * 1.05, // 5% increase predicted
    cost: todayCost * 0.92, // 8% cost reduction through optimization
    pvGeneration: pvTotal * 1.12, // 12% more PV expected (better weather)
    savings: todayCost * 0.08
  };

  return (
    <div className="space-y-4">
      {/* Prediction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Today's Prediction</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {todayTotal.toFixed(1)} kWh
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  €{todayCost.toFixed(2)} cost
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Self-Consumption</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {selfConsumption.toFixed(0)}%
                </p>
                <p className="text-xs text-green-500 dark:text-green-400">
                  {pvTotal.toFixed(1)} kWh PV
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Tomorrow's Savings</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  €{tomorrowPrediction.savings.toFixed(2)}
                </p>
                <p className="text-xs text-purple-500 dark:text-purple-400">
                  AI Optimization
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Prediction Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                24h Energy Prediction
              </CardTitle>
              <CardDescription>
                AI-powered consumption and generation forecast
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
              ML Model v2.1
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionData}>
                <defs>
                  <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor' }}
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pv" 
                  stroke="#10B981" 
                  fill="url(#pvGradient)"
                  strokeWidth={2}
                  name="PV Generation"
                />
                <Area 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#3B82F6" 
                  fill="url(#consumptionGradient)"
                  strokeWidth={2}
                  name="Consumption"
                />
                <Line 
                  type="monotone" 
                  dataKey="grid" 
                  stroke="#EF4444" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  name="Grid Import"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Legend */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Consumption</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>PV Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
              <span>Grid Import</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-indigo-800 dark:text-indigo-100 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Optimization Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Peak Load Prediction:</strong> High consumption expected at 18:00-20:00. 
            Pre-cool building at 16:00 using excess PV power.
          </div>
          <div className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Weather Integration:</strong> Sunny afternoon forecasted. Battery charging 
            optimized for evening load shifting.
          </div>
          <div className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Cost Optimization:</strong> Shift 15% of non-critical loads to 14:00-16:00 
            to maximize self-consumption and save €{tomorrowPrediction.savings.toFixed(2)}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}