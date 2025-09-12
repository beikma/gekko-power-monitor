-- Add unique constraint on recorded_at to prevent duplicate readings
ALTER TABLE public.energy_readings 
ADD CONSTRAINT energy_readings_recorded_at_unique UNIQUE (recorded_at);

-- Create index for better query performance on recorded_at
CREATE INDEX IF NOT EXISTS idx_energy_readings_recorded_at 
ON public.energy_readings (recorded_at DESC);