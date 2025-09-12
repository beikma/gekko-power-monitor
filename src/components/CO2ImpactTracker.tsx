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
    if (!data) return { dailySavings: 0, yearlySavings: 0, totalSavings: 0 };
    
    let totalPVPower = 0;
    let totalCurrentPower = 0;
    
    // Parse energycosts object structure (similar to EnergyDetailsDashboard)
    if (data.energycosts && typeof data.energycosts === 'object') {
      Object.entries(data.energycosts)
        .filter(([key]) => key.startsWith('item'))
        .forEach(([, meter]: [string, any]) => {
          if (meter?.sumstate?.value) {
            const values = meter.sumstate.value.split(';').map((val: string) => parseFloat(val) || 0);
            totalCurrentPower += values[0] || 0; // Current power in kW
            // Estimate PV based on negative grid values (typical for PV systems)
            if (values[0] < 0) {
              totalPVPower += Math.abs(values[0]);
            }
          }
        });
    }
    
    // Alternative: Check for energy management data from status
    if (totalPVPower === 0 && data.energymanager?.item0?.sumstate?.value) {
      const energyString = data.energymanager.item0.sumstate.value;
      const values = energyString.split(';').map((v: string) => parseFloat(v) || 0);
      
      if (values.length >= 21) {
        totalPVPower = (values[10] || 0) / 1000; // Convert from W to kW
        totalCurrentPower = (values[9] || 0) / 1000; // Convert from W to kW
      }
    }
    
    // Calculate daily PV generation (estimate 8 hours of generation)
    const dailyPV = totalPVPower * 8; // Rough estimate: 8 hours of generation per day
    
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
    <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-emerald-800 dark:text-emerald-100 flex items-center gap-2 text-sm">
          <Leaf className="h-4 w-4" />
          CO₂ Saved
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Main CO2 Display */}
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-100">
            {co2Data.totalSavings.toFixed(1)} kg
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-300">
            Total CO₂
          </div>
        </div>

        {/* Today's saving */}
        <div className="text-center text-xs text-emerald-600 dark:text-emerald-400">
          Today: <span className="font-semibold">{co2Data.dailySavings.toFixed(2)} kg</span>
        </div>
      </CardContent>
    </Card>
  );
}