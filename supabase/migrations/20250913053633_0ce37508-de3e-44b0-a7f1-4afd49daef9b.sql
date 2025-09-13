-- Create teams configuration table
CREATE TABLE public.teams_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  notification_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  severity_levels TEXT[] NOT NULL DEFAULT ARRAY['critical', 'high']::TEXT[],
  user_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams_configuration ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teams configuration is publicly readable" 
ON public.teams_configuration 
FOR SELECT 
USING (true);

CREATE POLICY "Teams configuration is publicly writable" 
ON public.teams_configuration 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teams configuration is publicly updatable" 
ON public.teams_configuration 
FOR UPDATE 
USING (true);

CREATE POLICY "Teams configuration is publicly deletable" 
ON public.teams_configuration 
FOR DELETE 
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_teams_configuration_updated_at
BEFORE UPDATE ON public.teams_configuration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();