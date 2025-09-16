import React from 'react';
import { useGekkoApi } from '@/hooks/useGekkoApi';
import { useMCP } from '@/hooks/useMCP';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { Card } from '@/components/ui/card';
import { BuildingMap3D } from '@/components/loytec/BuildingMap3D';
import { AirQualityPanel } from '@/components/loytec/AirQualityPanel';
import { WeatherWidget } from '@/components/loytec/WeatherWidget';
import { EnergyKPIRadar } from '@/components/loytec/EnergyKPIRadar';
import { SystemStatusGrid } from '@/components/loytec/SystemStatusGrid';
import { LiveDataFeed } from '@/components/loytec/LiveDataFeed';

export default function LOYTECDashboard() {
  const { data: gekkoData, isLoading: gekkoLoading, error: gekkoError } = useGekkoApi({ refreshInterval: 10000 });
  const mcpClient = useMCP();
  const { data: weatherData, isLoading: weatherLoading } = useWeatherForecast();

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
            <BuildingMap3D data={gekkoData} mcpClient={mcpClient} />
          </Card>

          {/* System Status Grid */}
          <Card className="p-6 bg-card/50 backdrop-blur border-muted">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">System Status</h2>
              <div className="text-sm text-muted-foreground">
                HVAC • Lighting • Shading • Security
              </div>
            </div>
            <SystemStatusGrid data={gekkoData} />
          </Card>
        </div>

        {/* Right Column - Environmental & KPIs */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-muted">
            <WeatherWidget data={weatherData} />
          </Card>

          {/* Air Quality Panel */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-muted">
            <AirQualityPanel data={gekkoData} />
          </Card>

          {/* Energy KPI Radar */}
          <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-muted">
            <EnergyKPIRadar data={gekkoData} />
          </Card>

          {/* Live Data Feed */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-muted">
            <LiveDataFeed data={gekkoData} />
          </Card>
        </div>
      </div>
    </div>
  );
}