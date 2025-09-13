import { ForecastCard } from '@/components/ForecastCard';
import { WeatherForecastCard } from '@/components/WeatherForecastCard';
import { CarbonIntensityCard } from '@/components/CarbonIntensityCard';
import { SolarForecastCard } from '@/components/SolarForecastCard';
import { DirectLightControl } from '@/components/DirectLightControl';
import { MCPTestPanel } from '@/components/MCPTestPanel';
import { OpenMeteoTestCard } from '@/components/OpenMeteoTestCard';
import { OpenMeteoDirectTest } from '@/components/OpenMeteoDirectTest';
import { ProphetForecastCard } from '@/components/ProphetForecastCard';
import { VoiceAssistant } from '@/components/VoiceAssistant';

export default function Admin() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Advanced energy management, forecasting, and direct MyGekko API control
        </p>
      </div>
      
      <div className="grid gap-6">
        <DirectLightControl />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <MCPTestPanel />
          <OpenMeteoTestCard />
        </div>
        
        <OpenMeteoDirectTest />
        
        <ProphetForecastCard />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Voice Assistant Demo</h3>
            <VoiceAssistant />
          </div>
        </div>
        
        <ForecastCard />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <WeatherForecastCard />
          <CarbonIntensityCard />
        </div>
        
        <SolarForecastCard />
      </div>
    </div>
  );
}