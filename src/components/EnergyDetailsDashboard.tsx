import { Zap, TrendingUp, Calculator, Activity, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface EnergyDetailsDashboardProps {
  data: any;
  refetch?: () => void;
}

export default function EnergyDetailsDashboard({ data, refetch }: EnergyDetailsDashboardProps) {
  // Debug logging
  console.log('EnergyDetailsDashboard received data:', data);
  console.log('EnergyDetailsDashboard energycosts:', data?.energycosts);
  
  // Extract energy costs data with real names
  const energyCosts = data?.energycosts || {};
  const energyMeters = Object.entries(energyCosts)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, meter]: [string, any]) => {
      const values = meter.sumstate?.value?.split(';') || [];
      const meterName = meter.name || `Energy Meter ${key.replace('item', '')}`;
      return {
        id: key,
        name: meterName,
        currentPower: parseFloat(values[0]) || 0, // kW
        dailyEnergy: parseFloat(values[1]) || 0, // kWh today
        monthlyEnergy: parseFloat(values[2]) || 0, // kWh this month
        yearlyEnergy: parseFloat(values[3]) || 0, // kWh this year
        tariff: parseFloat(values[4]) || 0, // cent/kWh
        totalCounter: parseFloat(values[7]) || 0, // Total kWh counter
        maxPower: parseFloat(values[8]) || 0, // Max power today
        cost: parseFloat(values[16]) || 0, // Cost today
        yearCost: parseFloat(values[17]) || 0, // Cost this year
        lastUpdate: values[18] || '',
        unit: values[5] || 'kWh'
      };
    })
    .filter(meter => meter.currentPower > 0 || meter.dailyEnergy > 0);

  // Extract load management data
  const loads = data?.loads || {};
  const loadItems = Object.entries(loads)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, load]: [string, any]) => {
      const values = load.sumstate?.value?.split(';') || [];
      return {
        id: key,
        name: `Load ${key.replace('item', '')}`,
        status: parseInt(values[0]) || 0, // 0=off, 1=on, 2=priority
        power: parseFloat(values[1]) || 0
      };
    });

  const totalCurrentPower = energyMeters.reduce((sum, meter) => sum + meter.currentPower, 0);
  const totalDailyEnergy = energyMeters.reduce((sum, meter) => sum + meter.dailyEnergy, 0);
  const totalDailyCost = energyMeters.reduce((sum, meter) => sum + meter.cost, 0);
  const totalYearlyCost = energyMeters.reduce((sum, meter) => sum + meter.yearCost, 0);

  const activeLoads = loadItems.filter(load => load.status > 0).length;
  const priorityLoads = loadItems.filter(load => load.status === 2).length;

  const getLoadStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <Badge variant="secondary">Off</Badge>;
      case 1: return <Badge variant="default">On</Badge>;
      case 2: return <Badge variant="destructive">Priority</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-muted-foreground';
      case 1: return 'text-energy-success';
      case 2: return 'text-energy-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Energy Overview */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-energy-primary" />
            Energy Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-energy-text">{totalCurrentPower.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">kW Current Power</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-semibold text-energy-primary">{totalDailyEnergy.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">kWh Today</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-accent">€{totalDailyCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Cost Today</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Annual Cost:</span>
              <span className="font-medium">€{totalYearlyCost.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Active Meters:</span>
              <span className="font-medium">{energyMeters.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Management */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-energy-primary" />
            Load Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-energy-success">{activeLoads}</div>
              <div className="text-xs text-muted-foreground">Active Loads</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-energy-warning">{priorityLoads}</div>
              <div className="text-xs text-muted-foreground">Priority Loads</div>
            </div>
          </div>

          <div className="space-y-2">
            {loadItems.slice(0, 6).map((load) => (
              <div key={load.id} className="flex items-center justify-between p-2 border border-energy-border rounded">
                <span className={`text-sm font-medium ${getStatusColor(load.status)}`}>
                  {load.name}
                </span>
                {getLoadStatusBadge(load.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-energy-primary" />
            Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">€{(totalDailyCost * 30).toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">Estimated Monthly</div>
          </div>

          <div className="space-y-3">
            {energyMeters.slice(0, 3).map((meter, index) => {
              const percentage = totalDailyCost > 0 ? (meter.cost / totalDailyCost) * 100 : 0;
              return (
                <div key={meter.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{meter.name}</span>
                    <span>€{meter.cost.toFixed(2)}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Average: {energyMeters.length > 0 ? (energyMeters.reduce((sum, m) => sum + m.tariff, 0) / energyMeters.length).toFixed(1) : 0} ct/kWh
          </div>
        </CardContent>
      </Card>

      {/* Detailed Energy Meters */}
      <Card className="energy-card lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-energy-primary" />
            Energy Meter Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-energy-border">
                  <th className="text-left p-2">Meter</th>
                  <th className="text-right p-2">Power (kW)</th>
                  <th className="text-right p-2">Today (kWh)</th>
                  <th className="text-right p-2">Month (kWh)</th>
                  <th className="text-right p-2">Year (kWh)</th>
                  <th className="text-right p-2">Cost Today</th>
                  <th className="text-right p-2">Tariff (ct/kWh)</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {energyMeters.map((meter) => (
                  <tr key={meter.id} className="border-b border-energy-border/50 hover:bg-energy-surface/30">
                    <td className="p-2 font-medium">{meter.name}</td>
                    <td className="p-2 text-right font-mono">
                      {meter.currentPower > 0 ? meter.currentPower.toFixed(2) : '-'}
                    </td>
                    <td className="p-2 text-right font-mono">{meter.dailyEnergy.toFixed(1)}</td>
                    <td className="p-2 text-right font-mono">{meter.monthlyEnergy.toFixed(1)}</td>
                    <td className="p-2 text-right font-mono">{meter.yearlyEnergy.toFixed(0)}</td>
                    <td className="p-2 text-right font-mono">€{meter.cost.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{meter.tariff.toFixed(1)}</td>
                    <td className="p-2 text-center">
                      <Badge variant={meter.currentPower > 0 ? "default" : "secondary"} className="text-xs">
                        {meter.currentPower > 0 ? "Active" : "Idle"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {energyMeters.length > 0 && (
            <div className="mt-4 text-xs text-muted-foreground">
              Last updated: {energyMeters[0].lastUpdate || 'N/A'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}