import { StatusIndicator } from "@/components/StatusIndicator";
import { PowerCard } from "@/components/PowerCard";
import { useGekkoApi } from "@/hooks/useGekkoApi";
import { useEnergyAI } from "@/hooks/useEnergyAI";
import EnergyInsights from "@/components/EnergyInsights";
import BuildingProfile from "@/components/BuildingProfile";
import SmartHomeDashboard from '@/components/SmartHomeDashboard';
import { CO2ImpactTracker } from '@/components/CO2ImpactTracker';
import { PredictiveMaintenanceCard } from '@/components/PredictiveMaintenanceCard';
import { EnergyPredictionChart } from '@/components/EnergyPredictionChart';
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Home, Activity, Settings, Grid3X3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

const Index = () => {
  const { data, status, isLoading, error, lastUpdate, refetch, connectionStatus } = useGekkoApi();
  const { storeEnergyReading } = useEnergyAI();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'classic' | 'smart'>('smart');

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing data...",
      description: "Fetching latest power consumption data",
    });
  };

  // Extract real energy values, alerts, and weather data from myGEKKO API data
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

    // Extract energy management data from energymanager.item0.sumstate.value
    let currentPower = 0;
    let dailyEnergy = 0;
    let batteryLevel = 0;
    let pvPower = 0;
    let gridPower = 0;

    try {
      // Check if energymanager data exists
      if (status?.energymanager?.item0?.sumstate?.value) {
        const energyString = status.energymanager.item0.sumstate.value;
        console.log("Energy management string:", energyString);
        
        // Parse the semicolon-separated values based on actual data structure
        const values = energyString.split(';').map((v: string) => parseFloat(v) || 0);
        
        if (values.length >= 21) {
          // Based on console logs analysis:
          // Position 9: 16100.00 = 16.1 kW current power
          // Position 20: 51 = 51% battery level  
          // Position 10: 11000.00 = 11.0 kW PV power
          // Position 14: daily energy values
          currentPower = values[9] / 1000; // Convert from W to kW (16100.00 -> 16.1)
          dailyEnergy = values[14] / 1000; // Convert from Wh to kWh 
          batteryLevel = values[20]; // Battery level in %
          pvPower = values[10] / 1000; // Convert from W to kW (11000.00 -> 11.0)
          gridPower = values[6] / 1000; // Convert from W to kW
          
          console.log("Extracted energy data:", {
            currentPower,
            dailyEnergy,
            batteryLevel,
            pvPower,
            gridPower
          });
        }
      }
    } catch (error) {
      console.error("Energy data extraction error:", error);
    }

    // Extract comprehensive weather data
    const extractWeather = () => {
      try {
        if (status?.globals?.meteo) {
          const meteo = status.globals.meteo;
          
          return {
            current: {
              temperature: meteo.current_temp || null,
              humidity: meteo.current_hum || null,
              pressure: meteo.current_press || null,
              windSpeed: meteo.current_wind || null,
              windDirection: meteo.current_winddir || null,
              uvIndex: meteo.current_uv || null,
              visibility: meteo.current_vis || null,
              condition: meteo.current_cond || 'Clear'
            },
            forecast: []
          };
        }
      } catch (error) {
        console.error("Weather extraction error:", error);
      }
      return null;
    };

    // Extract alerts and alarms from the API
    const extractAlerts = () => {
      const alerts = [];
      
      // Check for alarm state in various locations
      if (data.alarm && typeof data.alarm === 'object') {
        Object.entries(data.alarm).forEach(([key, alarm]: [string, any]) => {
          if (alarm && typeof alarm === 'object' && alarm.sumstate) {
            const state = alarm.sumstate.value;
            if (state && state !== "3") { // 3 = Normal, anything else is an alert
              alerts.push({
                id: key,
                type: 'alarm',
                message: alarm.description || `System Alert: ${key}`,
                severity: state === "1" ? 'critical' : state === "2" ? 'warning' : 'info',
                timestamp: alarm.timestamp || new Date().toISOString()
              });
            }
          }
        });
      }

      return alerts.slice(0, 5); // Limit to 5 most recent alerts
    };

    // Look for common energy parameter names in myGEKKO systems (fallback if energymanager not available)
    if (currentPower === 0 && dailyEnergy === 0) {
      currentPower = extractValue('energy.power') || 
                     extractValue('power.current') ||
                     extractValue('globals.power.value') ||
                     extractValue('variables.power') || 0;

      dailyEnergy = extractValue('energy.daily') ||
                    extractValue('energy.today') ||
                    extractValue('globals.energy.daily') || 0;
    }

    const weather = extractWeather();
    const alerts = extractAlerts();

    // Calculate some derived values for building management
    const estimatedMonthlyCost = dailyEnergy * 30 * 0.25; // Assuming €0.25/kWh
    const powerEfficiency = pvPower > 0 ? (pvPower / (currentPower || 1)) * 100 : 100;

    return {
      currentPower: currentPower,
      dailyEnergy: dailyEnergy,
      batteryLevel: batteryLevel,
      pvPower: pvPower,
      gridPower: gridPower,
      temperature: weather?.current?.temperature,
      humidity: weather?.current?.humidity,
      weather: weather,
      monthlyCost: estimatedMonthlyCost,
      efficiency: Math.min(powerEfficiency, 100),
      alerts: alerts,
      // Status indicators
      systemStatus: alerts.some(a => a.severity === 'critical') ? 'alert' : 
                   alerts.some(a => a.severity === 'warning') ? 'warning' : 'normal',
      connectionQuality: status?.globals?.network ? 'good' : 'poor'
    };
  };

  const energyValues = getEnergyValues();

  // Store energy reading when data changes
  useEffect(() => {
    if (energyValues && connectionStatus === 'connected') {
      storeEnergyReading({
        currentPower: energyValues.currentPower,
        dailyEnergy: energyValues.dailyEnergy,
        batteryLevel: energyValues.batteryLevel,
        pvPower: energyValues.pvPower,
        gridPower: energyValues.gridPower,
        temperature: energyValues.temperature,
        humidity: energyValues.humidity,
        weather: energyValues.weather?.current?.condition,
        efficiencyScore: energyValues.efficiency,
        costEstimate: energyValues.monthlyCost,
      });
    }
  }, [energyValues, connectionStatus, storeEnergyReading]);

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
                onClick={() => setViewMode(viewMode === 'classic' ? 'smart' : 'classic')}
                variant="outline"
                size="sm"
                className="border-primary/20 hover:bg-primary/5"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                {viewMode === 'classic' ? 'Smart View' : 'Classic View'}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-primary/20 hover:bg-primary/5 mr-2"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                size="sm"
                className="border-primary/20 hover:bg-primary/5"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
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
            {error.includes('Resource no longer available') && (
              <div className="mt-3 p-3 bg-muted/20 rounded border border-muted">
                <p className="text-sm text-muted-foreground">
                  <strong>Don't worry!</strong> Your building profile and manual data are still working. 
                  The myGEKKO API credentials may need to be updated. Contact your system administrator 
                  or check the admin panel to update your connection settings.
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'smart' ? (
          <div className="space-y-6">
            {/* CO2 Impact Tracker - Prominent Position */}
            <div className="mb-8">
              <CO2ImpactTracker data={data} />
            </div>

            {/* AI Predictions and Maintenance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <EnergyPredictionChart data={data} />
              </div>
              <div>
                <PredictiveMaintenanceCard data={data} />
              </div>
            </div>

            {/* Smart Home Dashboard */}
            <div className="mb-8">
              <SmartHomeDashboard 
                data={data} 
                status={status} 
                isLoading={isLoading} 
                connectionStatus={connectionStatus} 
              />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <EnergyInsights />
              </div>
              <div>
                <BuildingProfile />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Energy Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <PowerCard
                title="Current Power"
                value={energyValues?.currentPower?.toFixed(2) || "0"}
                unit="kW"
                trend={energyValues?.currentPower > 10 ? "up" : energyValues?.currentPower > 5 ? "stable" : "down"}
                trendValue={energyValues?.currentPower > 10 ? "High Usage" : energyValues?.currentPower > 5 ? "Normal" : "Low Usage"}
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
                title="PV Generation"
                value={energyValues?.pvPower?.toFixed(2) || "0"}
                unit="kW"
                trend={energyValues?.pvPower > 8 ? "up" : energyValues?.pvPower > 3 ? "stable" : "down"}
                trendValue={energyValues?.pvPower > 0 ? "Generating" : "No Sun"}
                isLoading={isLoading}
              />
              
              <PowerCard
                title="Battery Level"
                value={energyValues?.batteryLevel?.toString() || "0"}
                unit="%"
                trend={energyValues?.batteryLevel > 70 ? "up" : energyValues?.batteryLevel > 30 ? "stable" : "down"}
                trendValue={`Grid: ${energyValues?.gridPower?.toFixed(1) || "0"} kW`}
                isLoading={isLoading}
              />
              
              <PowerCard
                title="Building Temp"
                value={energyValues?.temperature ? energyValues.temperature.toFixed(1) : "N/A"}
                unit="°C"
                trend={energyValues?.temperature && energyValues.temperature > 22 ? "up" : energyValues?.temperature && energyValues.temperature < 18 ? "down" : "stable"}
                trendValue={energyValues?.humidity ? `${energyValues.humidity.toFixed(0)}% RH` : "N/A RH"}
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

            {/* AI Energy Insights and Building Profile */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <EnergyInsights />
              </div>
              <div>
                <BuildingProfile />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;