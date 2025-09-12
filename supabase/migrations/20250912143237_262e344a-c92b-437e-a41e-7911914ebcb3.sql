-- Fix all check constraints for energy_insights table

-- Drop existing problematic constraints
ALTER TABLE public.energy_insights 
DROP CONSTRAINT IF EXISTS energy_insights_confidence_score_check,
DROP CONSTRAINT IF EXISTS energy_insights_category_check,
DROP CONSTRAINT IF EXISTS energy_insights_insight_type_check;

-- Add updated constraints that match our function's output
ALTER TABLE public.energy_insights 
ADD CONSTRAINT energy_insights_confidence_score_check 
CHECK (confidence_score >= 0 AND confidence_score <= 100);

ALTER TABLE public.energy_insights 
ADD CONSTRAINT energy_insights_category_check 
CHECK (category IN ('efficiency', 'cost', 'maintenance', 'sustainability', 'optimization', 'energy'));

ALTER TABLE public.energy_insights 
ADD CONSTRAINT energy_insights_insight_type_check 
CHECK (insight_type IN ('efficiency', 'cost_optimization', 'maintenance', 'sustainability', 'load_management', 'general'));