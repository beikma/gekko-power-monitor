-- Create tables for energy readings and insights
CREATE TABLE IF NOT EXISTS public.energy_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_power DECIMAL,
  daily_energy DECIMAL,
  battery_level INTEGER,
  pv_power DECIMAL,
  grid_power DECIMAL,
  temperature DECIMAL,
  humidity DECIMAL,
  weather_condition TEXT,
  efficiency_score DECIMAL,
  cost_estimate DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.energy_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public access to energy readings" 
ON public.energy_readings 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public access to energy insights" 
ON public.energy_insights 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_energy_readings_created_at ON public.energy_readings (created_at DESC);
CREATE INDEX idx_energy_insights_created_at ON public.energy_insights (created_at DESC);
CREATE INDEX idx_energy_insights_type ON public.energy_insights (insight_type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_energy_insights_updated_at
BEFORE UPDATE ON public.energy_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();