import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, MessageSquare, Users, Settings, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamsConfig {
  id: string;
  name: string;
  webhook_url: string;
  notification_types: string[];
  severity_levels: string[];
  user_roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const NOTIFICATION_TYPES = [
  { value: 'heating', label: 'Heating' },
  { value: 'security', label: 'Security' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'connection', label: 'Connection' },
  { value: 'configuration', label: 'Configuration' }
];

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const USER_ROLES = [
  { value: 'facility_manager', label: 'Facility Manager' },
  { value: 'service_technician', label: 'Service Technician' },
  { value: 'security_team', label: 'Security Team' },
  { value: 'maintenance_team', label: 'Maintenance Team' },
  { value: 'building_admin', label: 'Building Admin' }
];

export function TeamsConfiguration() {
  const [configs, setConfigs] = useState<TeamsConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TeamsConfig | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    notification_types: [] as string[],
    severity_levels: ['critical', 'high'] as string[],
    user_roles: [] as string[],
    is_active: true
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams_configuration')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching Teams configurations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Teams configurations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.webhook_url) {
      toast({
        title: "Error", 
        description: "Name and webhook URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingConfig) {
        const { error } = await supabase
          .from('teams_configuration')
          .update(formData)
          .eq('id', editingConfig.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Teams configuration updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('teams_configuration')
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Teams configuration created successfully",
        });
      }
      
      resetForm();
      fetchConfigs();
    } catch (error) {
      console.error('Error saving Teams configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save Teams configuration",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Teams configuration?')) return;
    
    try {
      const { error } = await supabase
        .from('teams_configuration')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Teams configuration deleted successfully",
      });
      
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting Teams configuration:', error);
      toast({
        title: "Error",
        description: "Failed to delete Teams configuration",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (config: TeamsConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      webhook_url: config.webhook_url,
      notification_types: config.notification_types,
      severity_levels: config.severity_levels,
      user_roles: config.user_roles,
      is_active: config.is_active
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      webhook_url: '',
      notification_types: [],
      severity_levels: ['critical', 'high'],
      user_roles: [],
      is_active: true
    });
    setEditingConfig(null);
    setShowAddForm(false);
  };

  const handleCheckboxChange = (field: 'notification_types' | 'severity_levels' | 'user_roles', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const testNotification = async (config: TeamsConfig) => {
    try {
      const testAlarm = {
        id: 'test-' + Date.now(),
        description: 'Test notification from Building Management System',
        alarm_type: 'configuration',
        severity: 'medium',
        status: 'active',
        start_time: new Date().toISOString(),
        metadata: { test: true }
      };

      const response = await fetch(`https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/teams-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alarm: testAlarm,
          building_info: {
            name: 'Test Building',
            address: 'Test Location'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      toast({
        title: "Success",
        description: `Test notification sent to ${config.name}`,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Microsoft Teams Integration
              </CardTitle>
              <CardDescription>
                Configure Teams channels to receive notifications about system alerts and alarms
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Configuration
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">To set up Teams notifications:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to your Microsoft Teams channel</li>
              <li>Click the "..." menu next to the channel name</li>
              <li>Select "Connectors" and search for "Incoming Webhook"</li>
              <li>Configure the webhook and copy the URL</li>
              <li>Paste the webhook URL in the configuration below</li>
            </ol>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Teams Webhook Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingConfig ? 'Edit Teams Configuration' : 'Add Teams Configuration'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Facility Management Team"
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Teams Webhook URL *</Label>
                <Textarea
                  id="webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                  placeholder="https://outlook.office.com/webhook/..."
                  className="min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>Notification Types (leave empty for all)</Label>
                  {NOTIFICATION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.notification_types.includes(type.value)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('notification_types', type.value, checked as boolean)
                        }
                      />
                      <Label className="text-sm font-normal">{type.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label>Severity Levels</Label>
                  {SEVERITY_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.severity_levels.includes(level.value)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('severity_levels', level.value, checked as boolean)
                        }
                      />
                      <Label className="text-sm font-normal">{level.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label>Target User Roles</Label>
                  {USER_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.user_roles.includes(role.value)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('user_roles', role.value, checked as boolean)
                        }
                      />
                      <Label className="text-sm font-normal">{role.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingConfig ? 'Update Configuration' : 'Create Configuration'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configurations List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Configurations</CardTitle>
          <CardDescription>
            {configs.length} Teams configuration{configs.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Loading configurations...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No Teams configurations yet. Add one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{config.name}</h3>
                      <Badge variant={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => testNotification(config)}
                      >
                        Test
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Notification Types</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {config.notification_types.length === 0 ? (
                          <Badge variant="outline" className="text-xs">All Types</Badge>
                        ) : (
                          config.notification_types.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {NOTIFICATION_TYPES.find(t => t.value === type)?.label || type}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Severity Levels</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {config.severity_levels.map(level => (
                          <Badge key={level} variant="outline" className="text-xs">
                            {SEVERITY_LEVELS.find(l => l.value === level)?.label || level}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Target Roles</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {config.user_roles.length === 0 ? (
                          <Badge variant="outline" className="text-xs">All Roles</Badge>
                        ) : (
                          config.user_roles.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {USER_ROLES.find(r => r.value === role)?.label || role}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(config.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}