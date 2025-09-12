-- Create table to store historical energy data for AI analysis
CREATE TABLE public.energy_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_power DECIMAL(10,3) NOT NULL DEFAULT 0,
  daily_energy DECIMAL(10,3) NOT NULL DEFAULT 0,
  battery_level INTEGER DEFAULT 0,
  pv_power DECIMAL(10,3) NOT NULL DEFAULT 0,
  grid_power DECIMAL(10,3) NOT NULL DEFAULT 0,
  temperature DECIMAL(5,2),
  humidity INTEGER,
  weather_condition TEXT,
  efficiency_score DECIMAL(5,2),
  cost_estimate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for time-based queries
CREATE INDEX idx_energy_readings_recorded_at ON public.energy_readings(recorded_at DESC);
CREATE INDEX idx_energy_readings_created_at ON public.energy_readings(created_at DESC);

-- Create table to store AI-generated insights and recommendations
CREATE TABLE public.energy_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'anomaly', 'prediction', 'recommendation', 'alert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('efficiency', 'cost', 'usage', 'maintenance', 'optimization')),
  metadata JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for insights
CREATE INDEX idx_energy_insights_type ON public.energy_insights(insight_type);
CREATE INDEX idx_energy_insights_active ON public.energy_insights(is_active, created_at DESC);
CREATE INDEX idx_energy_insights_severity ON public.energy_insights(severity, created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_energy_insights_updated_at
  BEFORE UPDATE ON public.energy_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up old insights
CREATE OR REPLACE FUNCTION public.cleanup_expired_insights()
RETURNS void AS $$
BEGIN
  DELETE FROM public.energy_insights 
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SET search_path = public;