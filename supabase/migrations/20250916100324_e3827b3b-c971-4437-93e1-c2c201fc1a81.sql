-- Fix Microsoft Teams webhook security issue
-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Teams configuration is publicly readable" ON public.teams_configuration;
DROP POLICY IF EXISTS "Teams configuration is publicly writable" ON public.teams_configuration;
DROP POLICY IF EXISTS "Teams configuration is publicly updatable" ON public.teams_configuration;
DROP POLICY IF EXISTS "Teams configuration is publicly deletable" ON public.teams_configuration;

-- Create secure RLS policies that require authentication
CREATE POLICY "Authenticated users can view teams configurations"
ON public.teams_configuration
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create teams configurations"
ON public.teams_configuration
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update teams configurations"
ON public.teams_configuration
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete teams configurations"
ON public.teams_configuration
FOR DELETE
USING (auth.uid() IS NOT NULL);