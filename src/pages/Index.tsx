import { PowerCard } from "@/components/PowerCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { useGekkoApi } from "@/hooks/useGekkoApi";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Home, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { data, status, isLoading, error, lastUpdate, refetch, connectionStatus } = useGekkoApi();
  const { toast } = useToast();

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing data...",
      description: "Fetching latest power consumption data",
    });
  };

  // Extract real energy values from myGEKKO API data
  const getEnergyValues = () => {
    if (!data) return null;
    
    // Extract power and energy data from the actual API structure
    const extractValue = (path: string) => {
      const keys = path.split('.');
      let value = data;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return 0;
        }
      }
      return typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0) || 0;
    };

    // Look for common energy parameter names in myGEKKO systems
    const powerConsumption = extractValue('energy.power') || 
                           extractValue('power.current') ||
                           extractValue('globals.power.value') ||
                           extractValue('variables.power') || 0;

    const dailyEnergy = extractValue('energy.daily') ||
                       extractValue('energy.today') ||
                       extractValue('globals.energy.daily') || 0;

    const temperature = extractValue('meteo.temperature.value') ||
                       extractValue('temperature.outdoor') ||
                       (status?.meteo?.temperature?.value ? parseFloat(status.meteo.temperature.value) : 20);

    const humidity = extractValue('meteo.humidity.value') ||
                    (status?.meteo?.humidity?.value ? parseFloat(status.meteo.humidity.value) : 50);

    // Calculate some derived values for building management
    const estimatedMonthlyCost = dailyEnergy * 30 * 0.25; // Assuming €0.25/kWh
    const powerEfficiency = powerConsumption > 0 ? (dailyEnergy / 24) / powerConsumption * 100 : 100;

    return {
      currentPower: powerConsumption,
      dailyEnergy: dailyEnergy,
      temperature: temperature,
      humidity: humidity,
      monthlyCost: estimatedMonthlyCost,
      efficiency: Math.min(powerEfficiency, 100),
      // Status indicators
      systemStatus: status?.alarm?.sumstate?.value === "3" ? 'normal' : 'alert',
      connectionQuality: status?.globals?.network ? 'good' : 'poor'
    };
  };

  const energyValues = getEnergyValues();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Home className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  myGEKKO Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Real-time Energy Monitor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <StatusIndicator 
                status={connectionStatus} 
                lastUpdate={lastUpdate} 
              />
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-primary/20 hover:bg-primary/5"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">Connection Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        {/* Energy Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <PowerCard
            title="Current Power"
            value={energyValues?.currentPower?.toFixed(2) || "0"}
            unit="kW"
            trend={energyValues?.currentPower > 5 ? "up" : energyValues?.currentPower > 2 ? "stable" : "down"}
            trendValue={energyValues?.currentPower > 5 ? "High Usage" : energyValues?.currentPower > 2 ? "Normal" : "Low Usage"}
            isLoading={isLoading}
          />
          
          <PowerCard
            title="Daily Energy"
            value={energyValues?.dailyEnergy?.toFixed(1) || "0"}
            unit="kWh"
            trend={energyValues?.dailyEnergy > 50 ? "up" : "stable"}
            trendValue={`€${energyValues?.dailyEnergy ? (energyValues.dailyEnergy * 0.25).toFixed(2) : "0.00"}`}
            isLoading={isLoading}
          />
          
          <PowerCard
            title="Building Temp"
            value={energyValues?.temperature?.toFixed(1) || "20"}
            unit="°C"
            trend={energyValues?.temperature > 22 ? "up" : energyValues?.temperature < 18 ? "down" : "stable"}
            trendValue={`${energyValues?.humidity?.toFixed(0) || "50"}% RH`}
            isLoading={isLoading}
          />
          
          <PowerCard
            title="Monthly Est."
            value={energyValues?.monthlyCost?.toFixed(0) || "0"}
            unit="€"
            trend={energyValues?.monthlyCost > 200 ? "up" : "stable"}
            trendValue={`${energyValues?.efficiency?.toFixed(0) || "100"}% Eff.`}
            isLoading={isLoading}
          />
        </div>

        {/* Building Management Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Energy Summary
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : energyValues ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Load:</span>
                  <span className="font-medium">{energyValues.currentPower.toFixed(2)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today's Usage:</span>
                  <span className="font-medium">{energyValues.dailyEnergy.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Cost:</span>
                  <span className="font-medium">€{(energyValues.dailyEnergy * 0.25).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efficiency:</span>
                  <span className={`font-medium ${energyValues.efficiency > 80 ? 'text-energy-success' : energyValues.efficiency > 60 ? 'text-energy-warning' : 'text-energy-danger'}`}>
                    {energyValues.efficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No energy data available</p>
            )}
          </div>
          
          <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Building Status
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span className="font-medium">{energyValues?.temperature.toFixed(1) || "N/A"}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Humidity:</span>
                  <span className="font-medium">{energyValues?.humidity.toFixed(0) || "N/A"}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Status:</span>
                  <span className={`font-medium ${energyValues?.systemStatus === 'normal' ? 'text-energy-success' : 'text-energy-danger'}`}>
                    {energyValues?.systemStatus === 'normal' ? 'Normal' : 'Alert'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connection:</span>
                  <span className={`font-medium ${connectionStatus === 'connected' ? 'text-energy-success' : 'text-energy-danger'}`}>
                    {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground mb-2">
                Last updated: {lastUpdate?.toLocaleString() || 'Never'}
              </div>
              {energyValues?.currentPower > 10 && (
                <div className="p-2 bg-energy-warning/10 border border-energy-warning/20 rounded text-xs">
                  ⚠️ High power consumption detected
                </div>
              )}
              {energyValues?.temperature > 25 && (
                <div className="p-2 bg-energy-danger/10 border border-energy-danger/20 rounded text-xs">
                  🌡️ High temperature - check HVAC
                </div>
              )}
              {energyValues?.systemStatus === 'alert' && (
                <div className="p-2 bg-energy-danger/10 border border-energy-danger/20 rounded text-xs">
                  🚨 System alert - check status
                </div>
              )}
              {(!energyValues?.currentPower || energyValues.currentPower < 1) && (
                <div className="p-2 bg-energy-success/10 border border-energy-success/20 rounded text-xs">
                  💡 Low energy usage - efficient operation
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
