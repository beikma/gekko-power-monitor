export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  category: 'energy' | 'climate' | 'lighting' | 'security' | 'monitoring' | 'control' | 'building' | 'environmental' | 'ai';
  size: 'small' | 'medium' | 'large' | 'full';
  enabled: boolean;
  position: { x: number; y: number };
  order: number;
  requiredData?: string[]; // What myGEKKO data points this widget needs
  component: React.ComponentType<any>;
  settings?: Record<string, any>;
}

export interface DashboardLayout {
  userId?: string;
  widgets: WidgetConfig[];
  lastModified: Date;
}

export interface WidgetProps {
  data?: any;
  status?: any;
  isLoading?: boolean;
  settings?: Record<string, any>;
  onSettingsChange?: (settings: Record<string, any>) => void;
  size?: 'small' | 'medium' | 'large' | 'full';
}

export interface WidgetCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}