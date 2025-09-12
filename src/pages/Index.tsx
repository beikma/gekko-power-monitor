import { StatusIndicator } from "@/components/StatusIndicator";
import { PowerCard } from "@/components/PowerCard";
import { useGekkoApi } from "@/hooks/useGekkoApi";
import { useEnergyAI } from "@/hooks/useEnergyAI";
import EnergyInsights from "@/components/EnergyInsights";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Home, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

const Index = () => {
  const { data, status, isLoading, error, lastUpdate, refetch, connectionStatus } = useGekkoApi();
  const { storeEnergyReading } = useEnergyAI();
  const { toast } = useToast();

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

      // Check for temperature alerts in room control
      if (data.globals && data.globals.raumregelung) {
        Object.entries(data.globals.raumregelung).forEach(([room, config]: [string, any]) => {
          if (config && typeof config === 'object') {
            const temp = parseFloat(config.temperature?.value) || 0;
            if (temp < 5 || temp > 30) {
              alerts.push({
                id: `temp_${room}`,
                type: 'temperature',
                message: `Room ${room}: Temperature ${temp}°C`,
                severity: temp < 0 || temp > 35 ? 'critical' : 'warning',
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      }

      // Check for KNX/IO station alerts
      if (data.globals && data.globals.network) {
        Object.entries(data.globals.network).forEach(([station, config]: [string, any]) => {
          if (config && typeof config === 'object' && station.includes('IOStation')) {
            const status = config.status?.value || config.value;
            if (status && status !== "OK" && status !== "3") {
              alerts.push({
                id: `network_${station}`,
                type: 'network',
                message: `${station}: ${status}`,
                severity: 'warning',
                timestamp: new Date().toISOString()
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

        {/* AI Energy Insights */}
        <div className="mb-8">
          <EnergyInsights />
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
                  <span className="font-medium">{energyValues?.temperature ? energyValues.temperature.toFixed(1) : "N/A"}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Humidity:</span>
                  <span className="font-medium">{energyValues?.humidity ? energyValues.humidity.toFixed(0) : "N/A"}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Status:</span>
                  <span className={`font-medium ${
                    energyValues?.systemStatus === 'normal' ? 'text-energy-success' : 
                    energyValues?.systemStatus === 'warning' ? 'text-energy-warning' : 'text-energy-danger'
                  }`}>
                    {energyValues?.systemStatus === 'normal' ? 'Normal' : 
                     energyValues?.systemStatus === 'warning' ? 'Warning' : 'Alert'}
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
              System Alerts
            </h3>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground mb-2">
                Last updated: {lastUpdate?.toLocaleString() || 'Never'}
              </div>
              
              {/* Active Alerts */}
              {energyValues?.alerts && energyValues.alerts.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {energyValues.alerts.map((alert, index) => (
                    <div 
                      key={alert.id || index}
                      className={`p-3 rounded-lg border text-xs ${
                        alert.severity === 'critical' ? 'bg-energy-danger/10 border-energy-danger/20 text-energy-danger' :
                        alert.severity === 'warning' ? 'bg-energy-warning/10 border-energy-warning/20 text-energy-warning' :
                        'bg-energy-success/10 border-energy-success/20 text-energy-success'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">
                            {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'} 
                            {alert.type === 'temperature' ? ' Temperature Alert' :
                             alert.type === 'network' ? ' Network Alert' : 
                             alert.type === 'alarm' ? ' System Alarm' : ' Alert'}
                          </div>
                          <div className="mt-1 opacity-90">{alert.message}</div>
                        </div>
                        <div className="text-xs opacity-70 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-energy-success/10 border border-energy-success/20 rounded-lg text-xs text-energy-success">
                  ✅ All systems operating normally
                </div>
              )}
              
              {/* Quick Status Indicators */}
              <div className="border-t border-border pt-3 mt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">System:</span>
                    <span className={`font-medium ${
                      energyValues?.systemStatus === 'normal' ? 'text-energy-success' : 
                      energyValues?.systemStatus === 'warning' ? 'text-energy-warning' : 'text-energy-danger'
                    }`}>
                      {energyValues?.systemStatus === 'normal' ? 'Normal' : 
                       energyValues?.systemStatus === 'warning' ? 'Warning' : 'Alert'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connection:</span>
                    <span className={`font-medium ${connectionStatus === 'connected' ? 'text-energy-success' : 'text-energy-danger'}`}>
                      {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional automatic alerts */}
              {energyValues?.currentPower > 10 && (
                <div className="p-2 bg-energy-warning/10 border border-energy-warning/20 rounded text-xs">
                  ⚡ High power consumption: {energyValues.currentPower.toFixed(2)} kW
                </div>
              )}
              {energyValues?.temperature && energyValues.temperature > 25 && (
                <div className="p-2 bg-energy-danger/10 border border-energy-danger/20 rounded text-xs">
                  🌡️ High temperature: {energyValues.temperature.toFixed(1)}°C
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weather Forecast Section */}
        {energyValues?.weather?.forecast && energyValues.weather.forecast.length > 0 && (
          <div className="mt-6">
            <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Weather Forecast
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {energyValues.weather.forecast.slice(0, 5).map((day, index) => (
                  <div key={day.day || index} className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-sm font-medium mb-2">Day {index + 1}</div>
                    <div className="space-y-1 text-xs">
                      {day.tempMax !== null && day.tempMin !== null && (
                        <div>
                          <span className="text-energy-danger">{day.tempMax.toFixed(0)}°</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-primary">{day.tempMin.toFixed(0)}°</span>
                        </div>
                      )}
                      {day.humidity !== null && (
                        <div className="text-muted-foreground">{day.humidity.toFixed(0)}% RH</div>
                      )}
                      {day.windSpeed !== null && (
                        <div className="text-muted-foreground">{day.windSpeed.toFixed(1)} m/s</div>
                      )}
                      {day.rain !== null && day.rain > 0 && (
                        <div className="text-primary">💧 {day.rain.toFixed(1)}mm</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weather Details Section */}
        {energyValues?.weather && (
          <div className="mt-6">
            <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Current Weather Conditions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {energyValues.weather.current.temperature !== null && (
                  <div className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-2xl mb-1">🌡️</div>
                    <div className="text-sm font-medium">Temperature</div>
                    <div className="text-lg font-bold text-primary">{energyValues.weather.current.temperature.toFixed(1)}°C</div>
                  </div>
                )}
                {energyValues.weather.current.humidity !== null && (
                  <div className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-2xl mb-1">💧</div>
                    <div className="text-sm font-medium">Humidity</div>
                    <div className="text-lg font-bold text-accent">{energyValues.weather.current.humidity.toFixed(0)}%</div>
                  </div>
                )}
                {energyValues.weather.current.windSpeed !== null && (
                  <div className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-2xl mb-1">💨</div>
                    <div className="text-sm font-medium">Wind Speed</div>
                    <div className="text-lg font-bold text-energy-success">{energyValues.weather.current.windSpeed.toFixed(1)} m/s</div>
                  </div>
                )}
                {energyValues.weather.current.pressure !== null && (
                  <div className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-2xl mb-1">🌀</div>
                    <div className="text-sm font-medium">Pressure</div>
                    <div className="text-lg font-bold text-muted-foreground">{energyValues.weather.current.pressure.toFixed(0)} hPa</div>
                  </div>
                )}
                {energyValues.weather.current.uvIndex !== null && (
                  <div className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-2xl mb-1">☀️</div>
                    <div className="text-sm font-medium">UV Index</div>
                    <div className="text-lg font-bold text-energy-warning">{energyValues.weather.current.uvIndex.toFixed(0)}</div>
                  </div>
                )}
                {energyValues.weather.current.visibility !== null && (
                  <div className="text-center p-3 bg-background/30 rounded-lg">
                    <div className="text-2xl mb-1">👁️</div>
                    <div className="text-sm font-medium">Visibility</div>
                    <div className="text-lg font-bold text-muted-foreground">{energyValues.weather.current.visibility.toFixed(1)} km</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
