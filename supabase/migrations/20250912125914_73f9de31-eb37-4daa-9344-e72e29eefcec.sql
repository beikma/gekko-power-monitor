-- Create table for storing manual building information
CREATE TABLE public.building_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  total_area NUMERIC,
  floors INTEGER,
  rooms INTEGER,
  year_built INTEGER,
  building_type TEXT,
  usage_type TEXT,
  occupancy INTEGER,
  energy_rating TEXT,
  heating_system TEXT,
  cooling_system TEXT,
  renewable_energy BOOLEAN DEFAULT false,
  solar_panels BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.building_info ENABLE ROW LEVEL SECURITY;

-- Create policies for building info access
-- For now, make it publicly readable and writable (will need auth later)
CREATE POLICY "Building info is publicly readable" 
ON public.building_info 
FOR SELECT 
USING (true);

CREATE POLICY "Building info is publicly writable" 
ON public.building_info 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Building info is publicly updatable" 
ON public.building_info 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_building_info_updated_at
BEFORE UPDATE ON public.building_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();