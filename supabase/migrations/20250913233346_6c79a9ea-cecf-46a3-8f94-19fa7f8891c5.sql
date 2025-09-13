-- Create AI/ML services marketplace tables
CREATE TABLE public.ai_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  pricing_model TEXT NOT NULL DEFAULT 'free', -- free, subscription, usage-based
  price_per_month NUMERIC DEFAULT 0,
  price_per_usage NUMERIC DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  installation_type TEXT NOT NULL DEFAULT 'widget', -- widget, integration, agent
  config_schema JSONB DEFAULT '{}',
  api_endpoints JSONB DEFAULT '{}',
  icon_url TEXT,
  screenshot_urls TEXT[],
  tags TEXT[],
  requirements JSONB DEFAULT '{}',
  compatibility JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user service installations table
CREATE TABLE public.user_service_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL,
  installation_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, pending, error
  config JSONB DEFAULT '{}',
  installed_sections TEXT[], -- which dashboard sections it's integrated into
  installation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE,
  usage_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id) REFERENCES ai_services(service_id)
);

-- Enable RLS
ALTER TABLE public.ai_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_service_installations ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_services (public read)
CREATE POLICY "AI services are publicly readable" 
ON public.ai_services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only system can manage AI services" 
ON public.ai_services 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create policies for user_service_installations (public for now)
CREATE POLICY "Service installations are publicly readable" 
ON public.user_service_installations 
FOR SELECT 
USING (true);

CREATE POLICY "Service installations are publicly manageable" 
ON public.user_service_installations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert sample AI/ML services
INSERT INTO public.ai_services (service_id, name, description, short_description, provider, category, subcategory, pricing_model, is_featured, installation_type, icon_url, tags, config_schema) VALUES
('energy-optimizer-pro', 'Energy Optimizer Pro', 'Advanced ML-powered energy optimization that learns your usage patterns and automatically adjusts systems for maximum efficiency and cost savings.', 'AI-powered energy optimization with 30% average savings', 'SmartGrid AI', 'Energy Management', 'Optimization', 'subscription', true, 'integration', '/api/placeholder/64/64', ARRAY['energy', 'optimization', 'ml', 'cost-saving'], '{"api_key": {"type": "string", "required": true}, "optimization_level": {"type": "select", "options": ["conservative", "balanced", "aggressive"], "default": "balanced"}}'),

('predictive-maintenance-ai', 'Predictive Maintenance AI', 'Machine learning system that predicts equipment failures before they happen, reducing downtime and maintenance costs by up to 40%.', 'Predict equipment failures before they happen', 'MaintenanceIQ', 'Maintenance', 'Predictive', 'usage-based', true, 'widget', '/api/placeholder/64/64', ARRAY['maintenance', 'predictive', 'ai', 'monitoring'], '{"sensor_types": {"type": "multiselect", "options": ["temperature", "vibration", "pressure", "electrical"]}, "alert_threshold": {"type": "number", "default": 0.8}}'),

('smart-voice-assistant', 'Smart Home Voice Assistant', 'Natural language voice control for all your smart home devices with advanced understanding and context awareness.', 'Voice control for smart home with natural language', 'VoiceHome Tech', 'Voice AI', 'Control', 'subscription', false, 'agent', '/api/placeholder/64/64', ARRAY['voice', 'control', 'nlp', 'automation'], '{"wake_word": {"type": "string", "default": "Hey Home"}, "languages": {"type": "multiselect", "options": ["en", "de", "fr", "es"]}}'),

('weather-impact-analyzer', 'Weather Impact Analyzer', 'AI service that correlates weather patterns with energy consumption to optimize heating, cooling, and solar systems.', 'Optimize energy based on weather predictions', 'ClimateAI Solutions', 'Weather', 'Analytics', 'free', false, 'widget', '/api/placeholder/64/64', ARRAY['weather', 'analytics', 'energy', 'optimization'], '{"location": {"type": "string", "required": true}, "forecast_days": {"type": "number", "default": 7}}'),

('security-ai-monitor', 'Security AI Monitor', 'Advanced AI-powered security monitoring with facial recognition, behavioral analysis, and threat detection.', 'AI-powered security with threat detection', 'SecureAI Systems', 'Security', 'Monitoring', 'subscription', true, 'integration', '/api/placeholder/64/64', ARRAY['security', 'ai', 'monitoring', 'detection'], '{"cameras": {"type": "number", "required": true}, "recognition_type": {"type": "select", "options": ["face", "object", "behavior", "all"]}}'),

('solar-forecast-pro', 'Solar Forecast Pro', 'Machine learning solar production forecasting with 95% accuracy to optimize battery charging and energy usage.', 'Accurate solar production forecasting', 'SolarAI Tech', 'Energy Management', 'Solar', 'subscription', false, 'widget', '/api/placeholder/64/64', ARRAY['solar', 'forecasting', 'ml', 'battery'], '{"panel_capacity": {"type": "number", "required": true}, "battery_capacity": {"type": "number"}, "forecast_horizon": {"type": "number", "default": 24}}');

-- Create trigger for updated_at
CREATE TRIGGER update_ai_services_updated_at
BEFORE UPDATE ON public.ai_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_service_installations_updated_at
BEFORE UPDATE ON public.user_service_installations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();