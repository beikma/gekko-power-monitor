import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WidgetConfig } from '@/types/widget';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/lib/widgets';

export interface DashboardLayout {
  id: string;
  layout_name: string;
  widgets: WidgetConfig[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDashboardLayout() {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<WidgetConfig[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load dashboard layouts from database or localStorage fallback
  const loadDashboardLayouts = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from database first
      const { data, error } = await supabase
        .from('user_dashboard_layouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database load failed, using localStorage fallback:', error);
        // Fallback to localStorage
        const savedLayout = localStorage.getItem('dashboard-layout');
        if (savedLayout) {
          try {
            const parsed = JSON.parse(savedLayout);
            setCurrentLayout(parsed);
          } catch (err) {
            console.error('Failed to parse localStorage layout:', err);
            setCurrentLayout(DEFAULT_DASHBOARD_LAYOUT);
          }
        } else {
          setCurrentLayout(DEFAULT_DASHBOARD_LAYOUT);
        }
        setError(null);
        return;
      }

      if (data && data.length > 0) {
        // Convert the JSON widgets to WidgetConfig arrays
        const convertedLayouts = data.map(layout => ({
          ...layout,
          widgets: Array.isArray(layout.widgets) ? (layout.widgets as unknown) as WidgetConfig[] : []
        })) as DashboardLayout[];
        
        setLayouts(convertedLayouts);
        // Use the most recent active layout
        const activeLayout = convertedLayouts.find(layout => layout.is_active) || convertedLayouts[0];
        setCurrentLayout(activeLayout.widgets);
      } else {
        // No layouts found, use default and save it
        setCurrentLayout(DEFAULT_DASHBOARD_LAYOUT);
        await saveDefaultLayout();
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard layouts:', err);
      setError(err.message);
      
      // Fallback to localStorage or default
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        try {
          const parsed = JSON.parse(savedLayout);
          setCurrentLayout(parsed);
        } catch (parseErr) {
          setCurrentLayout(DEFAULT_DASHBOARD_LAYOUT);
        }
      } else {
        setCurrentLayout(DEFAULT_DASHBOARD_LAYOUT);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save default layout to database
  const saveDefaultLayout = async () => {
    try {
      // For demo purposes, save without user authentication
      const { error } = await supabase
        .from('user_dashboard_layouts')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Demo user ID
          layout_name: 'My Dashboard',
          widgets: DEFAULT_DASHBOARD_LAYOUT as any, // Cast to any for JSON
          is_active: true
        });

      if (error) {
        console.error('Failed to save default layout:', error);
        // Save to localStorage as fallback
        localStorage.setItem('dashboard-layout', JSON.stringify(DEFAULT_DASHBOARD_LAYOUT));
      }
    } catch (err) {
      console.error('Error saving default layout:', err);
      localStorage.setItem('dashboard-layout', JSON.stringify(DEFAULT_DASHBOARD_LAYOUT));
    }
  };

  // Save layout to database
  const saveLayout = async (widgets: WidgetConfig[], layoutName: string = 'My Dashboard') => {
    try {
      // Always save to localStorage as backup
      localStorage.setItem('dashboard-layout', JSON.stringify(widgets));
      
      // Try to save to database
      const existingLayout = layouts.find(layout => layout.is_active);
      
      if (existingLayout) {
        // Update existing layout
        const { error } = await supabase
          .from('user_dashboard_layouts')
          .update({ 
            widgets: widgets as any, // Cast to any for JSON
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLayout.id);

        if (error) {
          console.error('Failed to update layout in database:', error);
          toast({
            title: "Layout Saved Locally",
            description: "Changes saved to your browser but not synced to cloud.",
            variant: "default",
          });
        } else {
          toast({
            title: "Layout Saved",
            description: "Your dashboard layout has been updated.",
          });
        }
      } else {
        // Create new layout
        const { error } = await supabase
          .from('user_dashboard_layouts')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // Demo user ID
            layout_name: layoutName,
            widgets: widgets as any, // Cast to any for JSON
            is_active: true
          });

        if (error) {
          console.error('Failed to create layout in database:', error);
          toast({
            title: "Layout Saved Locally",
            description: "Changes saved to your browser but not synced to cloud.",
            variant: "default",
          });
        } else {
          toast({
            title: "Layout Created",
            description: "Your new dashboard layout has been saved.",
          });
        }
      }

      setCurrentLayout(widgets);
      // Reload layouts to get updated data
      await loadDashboardLayouts();
      
    } catch (err) {
      console.error('Error saving layout:', err);
      // Ensure localStorage is updated even if database fails
      localStorage.setItem('dashboard-layout', JSON.stringify(widgets));
      setCurrentLayout(widgets);
      
      toast({
        title: "Layout Saved Locally",
        description: "Changes saved to your browser. Database sync failed.",
        variant: "default",
      });
    }
  };

  // Reset to default layout
  const resetToDefault = async () => {
    try {
      await saveLayout(DEFAULT_DASHBOARD_LAYOUT, 'Default Layout');
      toast({
        title: "Layout Reset",
        description: "Dashboard has been reset to default layout.",
      });
    } catch (err) {
      console.error('Error resetting layout:', err);
      toast({
        title: "Reset Failed",
        description: "Failed to reset dashboard layout.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDashboardLayouts();
  }, []);

  return {
    layouts,
    currentLayout,
    isLoading,
    error,
    saveLayout,
    resetToDefault,
    refresh: loadDashboardLayouts,
  };
}