import React, { useEffect } from 'react';
import { useGekkoApi } from '@/hooks/useGekkoApi';
import { useMCP } from '@/hooks/useMCP';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { useEnergyReadings } from '@/hooks/useEnergyReadings';
import { useBuildingData } from '@/hooks/useBuildingData';
import { useCarbonIntensity } from '@/hooks/useCarbonIntensity';
import { Card } from '@/components/ui/card';
import { BuildingMap3D } from '@/components/loytec/BuildingMap3D';
import { AirQualityPanel } from '@/components/loytec/AirQualityPanel';
import { WeatherWidget } from '@/components/loytec/WeatherWidget';
import { EnergyKPIRadar } from '@/components/loytec/EnergyKPIRadar';
import { SystemStatusGrid } from '@/components/loytec/SystemStatusGrid';
import { LiveDataFeed } from '@/components/loytec/LiveDataFeed';

export default function LOYTECDashboard() {
  const { data: gekkoData, status: gekkoStatus, isLoading: gekkoLoading, error: gekkoError } = useGekkoApi({ refreshInterval: 10000 });
  const mcpClient = useMCP();
  const { data: weatherData, isLoading: weatherLoading, fetchWeatherForLocation } = useWeatherForecast();
  const { readings: energyReadings, latestReading } = useEnergyReadings();
  const { manualInfo: buildingInfo } = useBuildingData();
  const carbonIntensity = useCarbonIntensity();

  // Auto-fetch weather data when building location is available
  useEffect(() => {
    if (buildingInfo?.latitude && buildingInfo?.longitude) {
      fetchWeatherForLocation('custom', buildingInfo.latitude, buildingInfo.longitude);
    } else {
      // Default to Bruneck if no building location
      fetchWeatherForLocation('bruneck');
    }
  }, [buildingInfo?.latitude, buildingInfo?.longitude, fetchWeatherForLocation]);

  // Fetch carbon intensity data
  useEffect(() => {
    carbonIntensity.fetchCarbonIntensity();
  }, []);

  if (gekkoLoading || weatherLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading building systems...</p>
        </div>
      </div>
    );
  }

  if (gekkoError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 max-w-md text-center">
          <p className="text-destructive font-medium mb-2">Connection Error</p>
          <p className="text-sm text-muted-foreground">
            Unable to connect to building systems. Please check your connection.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            LOYTEC Building Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time building automation and monitoring system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Building Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3D Building Map */}
          <Card className="p-6 bg-card/50 backdrop-blur border-muted">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Building Overview</h2>
              <div className="text-sm text-muted-foreground">
                Real-time zone monitoring
              </div>
            </div>
            <BuildingMap3D data={gekkoData} status={gekkoStatus} mcpClient={mcpClient} buildingInfo={buildingInfo} />
          </Card>

          {/* System Status Grid */}
          <Card className="p-6 bg-card/50 backdrop-blur border-muted">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">System Status</h2>
              <div className="text-sm text-muted-foreground">
                HVAC • Lighting • Shading • Security
              </div>
            </div>
            <SystemStatusGrid data={gekkoData} status={gekkoStatus} mcpClient={mcpClient} />
          </Card>
        </div>

        {/* Right Column - Environmental & KPIs */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-muted">
            <WeatherWidget 
              data={weatherData} 
              location={buildingInfo?.city || 'Bruneck'} 
              carbonIntensity={carbonIntensity} 
            />
          </Card>

          {/* Air Quality Panel */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-muted">
            <AirQualityPanel data={gekkoData} status={gekkoStatus} />
          </Card>

          {/* Energy KPI Radar */}
          <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-muted">
            <EnergyKPIRadar 
              gekkoData={gekkoData} 
              energyReadings={energyReadings} 
              latestReading={latestReading} 
            />
          </Card>

          {/* Live Data Feed */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-muted">
            <LiveDataFeed 
              gekkoData={gekkoData} 
              status={gekkoStatus} 
              latestReading={latestReading} 
            />
          </Card>
        </div>
      </div>
    </div>
  );
}