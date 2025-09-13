import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Zap, DollarSign, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";

interface ServiceInstallDialogProps {
  service: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceInstallDialog({ service, open, onOpenChange }: ServiceInstallDialogProps) {
  const [step, setStep] = useState(1); // 1: overview, 2: configuration, 3: installation
  const [config, setConfig] = useState({});
  const [selectedSections, setSelectedSections] = useState([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();
  const { installService } = useMarketplaceServices();

  const dashboardSections = [
    { id: 'dashboard', label: 'Main Dashboard', description: 'Add widgets to the main dashboard' },
    { id: 'energy', label: 'Energy Management', description: 'Integrate with energy monitoring' },
    { id: 'security', label: 'Security System', description: 'Add to security monitoring' },
    { id: 'ai', label: 'AI & Analytics', description: 'Include in AI analysis' },
    { id: 'control', label: 'Device Control', description: 'Add to device control panels' },
  ];

  if (!service) return null;

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleInstall = async () => {
    if (selectedSections.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one section to integrate the service into.",
        variant: "destructive",
      });
      return;
    }

    setIsInstalling(true);

    try {
      await installService({
        service_id: service.service_id,
        config,
        installed_sections: selectedSections,
      });

      setStep(3);
      toast({
        title: "Service Installed Successfully",
        description: `${service.name} has been installed and is ready to use.`,
      });
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to install the service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const renderConfigField = (key: string, field: any) => {
    switch (field.type) {
      case 'string':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Input
              id={key}
              value={config[key] || field.default || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );
      case 'number':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Input
              id={key}
              type="number"
              value={config[key] || field.default || ''}
              onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
              required={field.required}
            />
          </div>
        );
      case 'select':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Select value={config[key] || field.default} onValueChange={(value) => handleConfigChange(key, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'multiselect':
        return (
          <div key={key} className="space-y-2">
            <Label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${option}`}
                    checked={(config[key] || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const current = config[key] || [];
                      const updated = checked 
                        ? [...current, option]
                        : current.filter(item => item !== option);
                      handleConfigChange(key, updated);
                    }}
                  />
                  <Label htmlFor={`${key}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <img src={service.icon_url} alt="" className="w-6 h-6 rounded" />
                {service.name}
                {service.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </DialogTitle>
              <DialogDescription>
                by {service.provider}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Service Overview */}
              <div className="space-y-4">
                <p className="text-sm">{service.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {service.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <Zap className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-sm font-medium capitalize">{service.installation_type}</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                  <div className="space-y-1">
                    <DollarSign className="h-6 w-6 mx-auto text-green-600" />
                    <p className="text-sm font-medium capitalize">{service.pricing_model}</p>
                    <p className="text-xs text-muted-foreground">Pricing</p>
                  </div>
                  <div className="space-y-1">
                    <Settings className="h-6 w-6 mx-auto text-blue-600" />
                    <p className="text-sm font-medium">{service.category}</p>
                    <p className="text-xs text-muted-foreground">Category</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)}>
                  Configure & Install
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Configure {service.name}</DialogTitle>
              <DialogDescription>
                Set up the service configuration and choose where to integrate it
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Configuration Fields */}
              {service.config_schema && Object.keys(service.config_schema).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Service Configuration</h3>
                  {Object.entries(service.config_schema).map(([key, field]) => 
                    renderConfigField(key, field)
                  )}
                </div>
              )}

              <Separator />

              {/* Integration Sections */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Integration Sections</h3>
                <p className="text-xs text-muted-foreground">
                  Choose which parts of your dashboard to integrate this service into
                </p>
                <div className="space-y-3">
                  {dashboardSections.map((section) => (
                    <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => handleSectionToggle(section.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={section.id} className="text-sm font-medium">
                          {section.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleInstall} disabled={isInstalling}>
                  {isInstalling ? 'Installing...' : 'Install Service'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Installation Complete!
              </DialogTitle>
              <DialogDescription>
                {service.name} has been successfully installed and integrated
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">Service Active</h3>
                <p className="text-sm text-green-700">
                  {service.name} is now active and integrated into your selected dashboard sections.
                  You can manage this service from the Configuration page.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Integrated into:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSections.map((sectionId) => {
                    const section = dashboardSections.find(s => s.id === sectionId);
                    return (
                      <Badge key={sectionId} variant="secondary">
                        {section?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}