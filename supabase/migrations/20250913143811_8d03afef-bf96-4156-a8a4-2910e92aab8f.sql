-- Create points table to track controllable myGEKKO points
CREATE TABLE public.points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  point_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  room TEXT,
  type TEXT NOT NULL, -- 'temperature', 'light', 'switch', 'sensor'
  unit TEXT, -- '°C', '%', 'on/off', etc.
  is_controllable BOOLEAN NOT NULL DEFAULT false,
  min_value NUMERIC,
  max_value NUMERIC,
  current_value TEXT,
  last_updated TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Points are publicly readable"
ON public.points
FOR SELECT
USING (true);

CREATE POLICY "Only system can insert points"
ON public.points
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only system can update points"
ON public.points
FOR UPDATE
USING (true);

-- Create voice_log table to track all voice commands
CREATE TABLE public.voice_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_input TEXT NOT NULL,
  intent TEXT NOT NULL,
  point_id TEXT,
  old_value TEXT,
  new_value TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  response_time_ms INTEGER,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Voice log is publicly readable"
ON public.voice_log
FOR SELECT
USING (true);

CREATE POLICY "Only system can insert voice log"
ON public.voice_log
FOR INSERT
WITH CHECK (true);

-- Create history table for point value history
CREATE TABLE public.point_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  point_id TEXT NOT NULL,
  value TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'mcp',
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Point history is publicly readable"
ON public.point_history
FOR SELECT
USING (true);

CREATE POLICY "Only system can insert point history"
ON public.point_history
FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_point_history_point_timestamp ON public.point_history(point_id, timestamp DESC);
CREATE INDEX idx_points_point_id ON public.points(point_id);
CREATE INDEX idx_voice_log_created_at ON public.voice_log(created_at DESC);

-- Insert sample points
INSERT INTO public.points (point_id, name, room, type, unit, is_controllable, min_value, max_value, current_value) VALUES
('HVAC.Office.Temperature', 'Office Temperature', 'Office', 'temperature', '°C', true, 15, 28, '21.5'),
('LIGHTS.Lobby.Main', 'Lobby Main Light', 'Lobby', 'light', '%', true, 0, 100, '75'),
('HVAC.Living.Temperature', 'Living Room Temperature', 'Living Room', 'temperature', '°C', true, 15, 28, '22.0'),
('SENSORS.Kitchen.Humidity', 'Kitchen Humidity', 'Kitchen', 'sensor', '%', false, null, null, '45'),
('BOILER.Main.Status', 'Main Boiler', 'Technical Room', 'switch', 'on/off', true, null, null, 'on');

-- Create trigger for updating timestamps
CREATE TRIGGER update_points_updated_at
  BEFORE UPDATE ON public.points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();