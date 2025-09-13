import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIService {
  id: string;
  service_id: string;
  name: string;
  description: string;
  short_description?: string;
  provider: string;
  category: string;
  subcategory?: string;
  version: string;
  pricing_model: 'free' | 'subscription' | 'usage-based';
  price_per_month?: number;
  price_per_usage?: number;
  is_featured: boolean;
  is_active: boolean;
  installation_type: 'widget' | 'integration' | 'agent';
  config_schema?: any;
  api_endpoints?: any;
  icon_url?: string;
  screenshot_urls?: string[];
  tags?: string[];
  requirements?: any;
  compatibility?: any;
  created_at: string;
  updated_at: string;
}

export interface ServiceInstallation {
  id: string;
  service_id: string;
  installation_id: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  config: any;
  installed_sections: string[];
  installation_date: string;
  last_used?: string;
  usage_stats?: any;
  created_at: string;
  updated_at: string;
}

export function useMarketplaceServices() {
  const [services, setServices] = useState<AIService[]>([]);
  const [installedServices, setInstalledServices] = useState<ServiceInstallation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_services')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data as AIService[] || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err.message);
    }
  };

  // Fetch installed services
  const fetchInstalledServices = async () => {
    try {
      const { data, error } = await supabase
        .from('user_service_installations')
        .select('*')
        .order('installation_date', { ascending: false });

      if (error) throw error;
      setInstalledServices(data as ServiceInstallation[] || []);
    } catch (err) {
      console.error('Error fetching installed services:', err);
      setError(err.message);
    }
  };

  // Install a service
  const installService = async (installationData: {
    service_id: string;
    config: any;
    installed_sections: string[];
  }) => {
    try {
      const installationId = `${installationData.service_id}-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('user_service_installations')
        .insert({
          service_id: installationData.service_id,
          installation_id: installationId,
          status: 'active',
          config: installationData.config,
          installed_sections: installationData.installed_sections,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh installed services
      await fetchInstalledServices();
      
      return data;
    } catch (err) {
      console.error('Error installing service:', err);
      throw new Error(err.message || 'Failed to install service');
    }
  };

  // Uninstall a service
  const uninstallService = async (installationId: string) => {
    try {
      const { error } = await supabase
        .from('user_service_installations')
        .delete()
        .eq('installation_id', installationId);

      if (error) throw error;

      // Refresh installed services
      await fetchInstalledServices();
      
      toast({
        title: "Service Uninstalled",
        description: "The service has been successfully removed.",
      });
    } catch (err) {
      console.error('Error uninstalling service:', err);
      toast({
        title: "Uninstall Failed",
        description: err.message || "Failed to uninstall the service.",
        variant: "destructive",
      });
    }
  };

  // Update service configuration
  const updateServiceConfig = async (installationId: string, config: any, sections?: string[]) => {
    try {
      const updateData: any = { config };
      if (sections) {
        updateData.installed_sections = sections;
      }

      const { error } = await supabase
        .from('user_service_installations')
        .update(updateData)
        .eq('installation_id', installationId);

      if (error) throw error;

      // Refresh installed services
      await fetchInstalledServices();
      
      toast({
        title: "Configuration Updated",
        description: "Service configuration has been updated successfully.",
      });
    } catch (err) {
      console.error('Error updating service config:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update service configuration.",
        variant: "destructive",
      });
    }
  };

  // Toggle service status
  const toggleServiceStatus = async (installationId: string, status: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('user_service_installations')
        .update({ status })
        .eq('installation_id', installationId);

      if (error) throw error;

      // Refresh installed services
      await fetchInstalledServices();
      
      toast({
        title: `Service ${status === 'active' ? 'Activated' : 'Deactivated'}`,
        description: `The service has been ${status === 'active' ? 'activated' : 'deactivated'}.`,
      });
    } catch (err) {
      console.error('Error toggling service status:', err);
      toast({
        title: "Status Change Failed",
        description: err.message || "Failed to change service status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchServices(), fetchInstalledServices()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  return {
    services,
    installedServices,
    isLoading,
    error,
    installService,
    uninstallService,
    updateServiceConfig,
    toggleServiceStatus,
    refetch: () => Promise.all([fetchServices(), fetchInstalledServices()]),
  };
}