-- Create table for storing system alarms and maintenance events
CREATE TABLE public.system_alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  alarm_type TEXT NOT NULL, -- 'connection', 'hardware', 'configuration', 'heating', 'weather'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  source_system TEXT NOT NULL DEFAULT 'gekko',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for enhanced energy costs data
CREATE TABLE public.energy_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL, -- 'Ladestation 1', 'Ladestation 2', etc.
  item_id TEXT NOT NULL, -- 'item0', 'item1', etc.
  list_type TEXT NOT NULL, -- 'daily', 'monthly', 'yearly'
  date_recorded DATE NOT NULL,
  energy_value NUMERIC NOT NULL DEFAULT 0,
  cost_value NUMERIC NOT NULL DEFAULT 0,
  meter_reading NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for weather correlation data
CREATE TABLE public.weather_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  temperature NUMERIC,
  humidity NUMERIC,
  wind_speed NUMERIC,
  weather_condition TEXT,
  pressure NUMERIC,
  source_system TEXT NOT NULL DEFAULT 'gekko',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for authentication)
CREATE POLICY "System alarms are publicly readable" 
ON public.system_alarms 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert alarms" 
ON public.system_alarms 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only system can update alarms" 
ON public.system_alarms 
FOR UPDATE 
USING (true);

CREATE POLICY "Energy costs are publicly readable" 
ON public.energy_costs 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert energy costs" 
ON public.energy_costs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Weather data is publicly readable" 
ON public.weather_data 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert weather data" 
ON public.weather_data 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_system_alarms_start_time ON public.system_alarms(start_time);
CREATE INDEX idx_system_alarms_type ON public.system_alarms(alarm_type);
CREATE INDEX idx_system_alarms_status ON public.system_alarms(status);

CREATE INDEX idx_energy_costs_date ON public.energy_costs(date_recorded);
CREATE INDEX idx_energy_costs_item ON public.energy_costs(item_id, list_type);

CREATE INDEX idx_weather_data_recorded_at ON public.weather_data(recorded_at);

-- Create triggers for updated_at
CREATE TRIGGER update_system_alarms_updated_at
BEFORE UPDATE ON public.system_alarms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_energy_costs_updated_at
BEFORE UPDATE ON public.energy_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();