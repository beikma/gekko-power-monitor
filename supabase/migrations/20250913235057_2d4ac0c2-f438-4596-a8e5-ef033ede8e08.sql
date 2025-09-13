-- Create user dashboard layouts table
CREATE TABLE public.user_dashboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  layout_name TEXT NOT NULL DEFAULT 'Default',
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies for user dashboard layouts
CREATE POLICY "Users can view their own dashboard layouts" 
ON public.user_dashboard_layouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard layouts" 
ON public.user_dashboard_layouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layouts" 
ON public.user_dashboard_layouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard layouts" 
ON public.user_dashboard_layouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_dashboard_layouts_updated_at
BEFORE UPDATE ON public.user_dashboard_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default layout that works without authentication (for demo purposes)
INSERT INTO public.user_dashboard_layouts (user_id, layout_name, widgets) VALUES 
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Demo Layout',
  '[
    {
      "id": "energy-overview",
      "title": "Energy Overview",
      "description": "Real-time power consumption and generation overview",
      "category": "energy",
      "size": "medium",
      "enabled": true,
      "position": {"x": 0, "y": 0},
      "order": 1,
      "requiredData": ["power", "energy"]
    },
    {
      "id": "climate-status",
      "title": "Climate Status", 
      "description": "Indoor temperature, humidity, and air quality",
      "category": "climate",
      "size": "small",
      "enabled": true,
      "position": {"x": 1, "y": 0},
      "order": 2,
      "requiredData": ["temperature", "humidity"]
    },
    {
      "id": "ai-insights-small",
      "title": "AI Insights",
      "description": "Quick AI analysis and recommendations",
      "category": "ai",
      "size": "small", 
      "enabled": true,
      "position": {"x": 2, "y": 0},
      "order": 3,
      "requiredData": []
    },
    {
      "id": "building-info-small",
      "title": "Building Info",
      "description": "Quick building overview with status",
      "category": "building",
      "size": "small",
      "enabled": true,
      "position": {"x": 3, "y": 0},
      "order": 4,
      "requiredData": []
    },
    {
      "id": "weather-small",
      "title": "Weather",
      "description": "Current weather conditions",
      "category": "environmental",
      "size": "small",
      "enabled": true,
      "position": {"x": 0, "y": 1},
      "order": 5,
      "requiredData": []
    },
    {
      "id": "energy-forecast-small",
      "title": "Energy Forecast",
      "description": "Quick energy consumption predictions",
      "category": "ai",
      "size": "small",
      "enabled": true,
      "position": {"x": 1, "y": 1},
      "order": 6,
      "requiredData": []
    }
  ]'::jsonb
);