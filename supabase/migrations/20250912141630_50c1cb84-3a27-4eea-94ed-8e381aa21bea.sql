-- Fix confidence_score field precision to allow values 0-100
ALTER TABLE public.energy_insights 
ALTER COLUMN confidence_score TYPE DECIMAL(5,2);

-- Also ensure other DECIMAL fields can handle larger values if needed
ALTER TABLE public.energy_readings 
ALTER COLUMN efficiency_score TYPE DECIMAL(5,2),
ALTER COLUMN cost_estimate TYPE DECIMAL(10,2);