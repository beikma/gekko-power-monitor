import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Car, Euro, TreePine } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CO2ImpactTrackerProps {
  data: any;
}

export function CO2ImpactTracker({ data }: CO2ImpactTrackerProps) {
  // Calculate CO2 savings based on energy data
  const calculateCO2Savings = () => {
    if (!data?.energycosts) return { dailySavings: 0, yearlySavings: 0, totalSavings: 0 };
    
    const energyData = data.energycosts.split(';').map((val: string) => parseFloat(val) || 0);
    const pvPower = energyData[8] || 0; // PV power generation in kWh
    const dailyPV = pvPower / 1000; // Convert to kWh
    
    // CO2 emission factor for grid electricity (Germany): ~0.4 kg CO2/kWh
    const co2FactorGrid = 0.4;
    const dailyCO2Saved = dailyPV * co2FactorGrid;
    const yearlyCO2Saved = dailyCO2Saved * 365;
    
    // Simulate total savings (would come from historical data)
    const totalCO2Saved = yearlyCO2Saved * 2.3; // Simulate 2.3 years of operation
    
    return {
      dailySavings: dailyCO2Saved,
      yearlySavings: yearlyCO2Saved,
      totalSavings: totalCO2Saved
    };
  };

  const co2Data = calculateCO2Savings();
  
  // Convert CO2 to meaningful comparisons
  const treesEquivalent = Math.round(co2Data.totalSavings / 22); // 1 tree absorbs ~22kg CO2/year
  const carKmEquivalent = Math.round(co2Data.totalSavings / 0.12); // ~0.12kg CO2/km
  const euroSavings = Math.round(co2Data.totalSavings * 85); // EU ETS price ~85€/ton
  
  const yearlyTarget = 5000; // 5 tons yearly target
  const progressPercent = Math.min((co2Data.yearlySavings / yearlyTarget) * 100, 100);

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-emerald-800 dark:text-emerald-100 flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              CO₂ Impact Tracker
            </CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-300">
              Environmental impact through smart automation
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
            Live Savings
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Savings Display */}
        <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
          <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-100">
            {co2Data.totalSavings.toFixed(1)} kg
          </div>
          <div className="text-sm text-emerald-600 dark:text-emerald-300">
            Total CO₂ Saved
          </div>
        </div>

        {/* Yearly Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-emerald-700 dark:text-emerald-300">Yearly Target Progress</span>
            <span className="text-emerald-800 dark:text-emerald-200 font-medium">
              {co2Data.yearlySavings.toFixed(0)} / {yearlyTarget} kg
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Impact Comparisons */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-black/30 rounded-lg">
            <TreePine className="h-8 w-8 text-green-600" />
            <div>
              <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                {treesEquivalent}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                Trees Planted
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-black/30 rounded-lg">
            <Car className="h-8 w-8 text-blue-600" />
            <div>
              <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                {(carKmEquivalent / 1000).toFixed(0)}k km
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                Car Distance
              </div>
            </div>
          </div>
        </div>

        {/* Financial Impact */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900 rounded-lg border border-emerald-300 dark:border-emerald-600">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            <span className="text-emerald-800 dark:text-emerald-200 font-medium">
              Carbon Credits Value
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-800 dark:text-emerald-100">
            €{euroSavings.toLocaleString()}
          </div>
        </div>

        {/* Daily Savings */}
        <div className="text-center text-sm text-emerald-600 dark:text-emerald-400">
          Today: <span className="font-semibold">{co2Data.dailySavings.toFixed(2)} kg CO₂</span> saved
        </div>
      </CardContent>
    </Card>
  );
}