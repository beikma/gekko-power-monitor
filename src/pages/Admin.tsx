import { ForecastCard } from '@/components/ForecastCard';
import { WeatherForecastCard } from '@/components/WeatherForecastCard';
import { CarbonIntensityCard } from '@/components/CarbonIntensityCard';
import { SolarForecastCard } from '@/components/SolarForecastCard';
import { DirectLightControl } from '@/components/DirectLightControl';

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