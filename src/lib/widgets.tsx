import { WidgetConfig, WidgetCategory } from "@/types/widget";
import { EnergyOverviewWidget } from "@/components/widgets/EnergyOverviewWidget";
import { EnergyTrendsWidget } from "@/components/widgets/EnergyTrendsWidget";
import { ClimateWidget } from "@/components/widgets/ClimateWidget";
import { SecurityStatusWidget } from "@/components/widgets/SecurityStatusWidget";
import { SystemAlarmsWidget } from "@/components/widgets/SystemAlarmsWidget";
import { LightingControlWidget } from "@/components/widgets/LightingControlWidget";
import { BuildingInfoWidget } from "@/components/widgets/BuildingInfoWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { AIInsightsWidget } from "@/components/widgets/AIInsightsWidget";
import { EnergyForecastWidget } from "@/components/widgets/EnergyForecastWidget";
import { 
  Zap, 
  Thermometer, 
  Lightbulb,
  Shield, 
  AlertTriangle, 
  Activity,
  Settings,
  Building,
  Cloud,
  Brain,
  TrendingUp
} from "lucide-react";

// Widget Categories for organization
export const WIDGET_CATEGORIES: WidgetCategory[] = [
  {
    id: 'energy',
    title: 'Energy Management',
    description: 'Power consumption, solar generation, and battery status',
    icon: Zap
  },
  {
    id: 'climate',
    title: 'Climate Control',
    description: 'Temperature, humidity, and air quality monitoring',
    icon: Thermometer
  },
  {
    id: 'lighting',
    title: 'Lighting Control',
    description: 'Smart lighting control and automation',
    icon: Lightbulb
  },
  {
    id: 'security',
    title: 'Security & Safety',
    description: 'Security status, alarms, and monitoring',
    icon: Shield
  },
  {
    id: 'monitoring',
    title: 'System Monitoring',
    description: 'System health, alarms, and diagnostics',
    icon: Activity
  },
  {
    id: 'control',
    title: 'Device Control',
    description: 'Direct control of connected devices',
    icon: Settings
  },
  {
    id: 'building',
    title: 'Building Information',
    description: 'Building profile, location, and system details',
    icon: Building
  },
  {
    id: 'environmental',
    title: 'Environmental Data',
    description: 'Weather, outdoor conditions, and forecasts',
    icon: Cloud
  },
  {
    id: 'ai',
    title: 'AI & Machine Learning',
    description: 'Intelligent insights, forecasting, and analysis',
    icon: Brain
  }
];

// Available Widget Registry
export const AVAILABLE_WIDGETS: Omit<WidgetConfig, 'enabled' | 'position' | 'order'>[] = [
  {
    id: 'energy-overview',
    title: 'Energy Overview',
    description: 'Real-time power consumption and generation overview',
    category: 'energy',
    size: 'medium',
    component: EnergyOverviewWidget,
    requiredData: ['power', 'energy']
  },
  {
    id: 'energy-trends',
    title: 'Energy Trends',
    description: '24-hour energy consumption and generation trends',
    category: 'energy',
    size: 'large',
    component: EnergyTrendsWidget,
    requiredData: ['power', 'energy']
  },
  {
    id: 'climate-status',
    title: 'Climate Status',
    description: 'Indoor temperature, humidity, and air quality',
    category: 'climate',
    size: 'small',
    component: ClimateWidget,
    requiredData: ['temperature', 'humidity']
  },
  {
    id: 'security-status',
    title: 'Security Status',
    description: 'Security system status and door locks',
    category: 'security',
    size: 'small',
    component: SecurityStatusWidget,
    requiredData: ['security']
  },
  {
    id: 'system-alarms',
    title: 'System Alarms',
    description: 'Active system alarms and notifications',
    category: 'monitoring',
    size: 'medium',
    component: SystemAlarmsWidget,
    requiredData: ['alarms']
  },
  {
    id: 'lighting-control',
    title: 'Lighting Control',
    description: 'Control and monitor lighting systems',
    category: 'lighting',
    size: 'medium',
    component: LightingControlWidget,
    requiredData: ['lighting']
  },
  {
    id: 'building-info-small',
    title: 'Building Info',
    description: 'Quick building overview with status',
    category: 'building',
    size: 'small',
    component: BuildingInfoWidget,
    requiredData: []
  },
  {
    id: 'building-info-medium',
    title: 'Building Profile',
    description: 'Detailed building information and system status',
    category: 'building',
    size: 'medium',
    component: BuildingInfoWidget,
    requiredData: []
  },
  {
    id: 'weather-small',
    title: 'Weather',
    description: 'Current weather conditions',
    category: 'environmental',
    size: 'small',
    component: WeatherWidget,
    requiredData: []
  },
  {
    id: 'weather-medium',
    title: 'Weather Details',
    description: 'Detailed weather information and forecast',
    category: 'environmental',
    size: 'medium',
    component: WeatherWidget,
    requiredData: []
  },
  {
    id: 'ai-insights-small',
    title: 'AI Insights',
    description: 'Quick AI analysis and recommendations',
    category: 'ai',
    size: 'small',
    component: AIInsightsWidget,
    requiredData: []
  },
  {
    id: 'ai-insights-medium',
    title: 'AI Energy Insights',
    description: 'Comprehensive AI analysis with recommendations',
    category: 'ai',
    size: 'medium',
    component: AIInsightsWidget,
    requiredData: []
  },
  {
    id: 'energy-forecast-small',
    title: 'Energy Forecast',
    description: 'Quick energy consumption predictions',
    category: 'ai',
    size: 'small',
    component: EnergyForecastWidget,
    requiredData: []
  },
  {
    id: 'energy-forecast-medium',
    title: 'Energy Forecast Details',
    description: 'Detailed AI-powered energy forecasting',
    category: 'ai',
    size: 'medium',
    component: EnergyForecastWidget,
    requiredData: []
  }
];

// Default Dashboard Layout for new users
export const DEFAULT_DASHBOARD_LAYOUT: WidgetConfig[] = [
  {
    ...AVAILABLE_WIDGETS[0], // Energy Overview
    enabled: true,
    position: { x: 0, y: 0 },
    order: 1
  },
  {
    ...AVAILABLE_WIDGETS[2], // Climate Status
    enabled: true,
    position: { x: 1, y: 0 },
    order: 2
  },
  {
    ...AVAILABLE_WIDGETS[9], // AI Insights Small
    enabled: true,
    position: { x: 2, y: 0 },
    order: 3
  },
  {
    ...AVAILABLE_WIDGETS[6], // Building Info Small
    enabled: true,
    position: { x: 3, y: 0 },
    order: 4
  },
  {
    ...AVAILABLE_WIDGETS[4], // System Alarms
    enabled: true,
    position: { x: 0, y: 1 },
    order: 5
  },
  {
    ...AVAILABLE_WIDGETS[11], // Energy Forecast Small
    enabled: true,
    position: { x: 1, y: 1 },
    order: 6
  }
];

// Helper function to check if widget should be visible based on available data
export function shouldShowWidget(widget: WidgetConfig, availableData: Record<string, any>): boolean {
  if (!widget.requiredData || widget.requiredData.length === 0) {
    return true; // No requirements, always show
  }

  // Check if any of the required data keys exist and have meaningful values
  return widget.requiredData.some(dataKey => {
    const value = availableData[dataKey];
    if (value === null || value === undefined) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}

// Helper to get grid class based on widget size
export function getWidgetGridClass(size: WidgetConfig['size']): string {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1';
    case 'medium':
      return 'col-span-2 row-span-1';
    case 'large':
      return 'col-span-2 row-span-2';
    case 'full':
      return 'col-span-full row-span-1';
    default:
      return 'col-span-1 row-span-1';
  }
}