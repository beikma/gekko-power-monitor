import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WidgetConfig } from "@/types/widget";
import { AVAILABLE_WIDGETS, WIDGET_CATEGORIES, shouldShowWidget } from "@/lib/widgets";

interface WidgetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidgets: WidgetConfig[];
  availableData: Record<string, any>;
  onSave: (widgets: WidgetConfig[]) => void;
}

export function WidgetSelector({ 
  open, 
  onOpenChange, 
  currentWidgets, 
  availableData, 
  onSave 
}: WidgetSelectorProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetConfig[]>(currentWidgets);

  // Sync with currentWidgets when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedWidgets(currentWidgets);
    }
  }, [open, currentWidgets]);

  const handleToggleWidget = (widgetId: string, enabled: boolean) => {
    setSelectedWidgets(prev => {
      const existing = prev.find(w => w.id === widgetId);
      if (existing) {
        return prev.map(w => w.id === widgetId ? { ...w, enabled } : w);
      } else {
        const template = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
        if (template) {
          const newWidget: WidgetConfig = {
            ...template,
            enabled,
            position: { x: 0, y: 0 },
            order: prev.length + 1
          };
          return [...prev, newWidget];
        }
      }
      return prev;
    });
  };

  const handleSave = () => {
    onSave(selectedWidgets);
    onOpenChange(false);
  };

  const getWidgetStatus = (widget: typeof AVAILABLE_WIDGETS[0]) => {
    const current = selectedWidgets.find(w => w.id === widget.id);
    const isEnabled = current?.enabled || false;
    const isAvailable = shouldShowWidget({ ...widget, enabled: true, position: { x: 0, y: 0 }, order: 0 }, availableData);
    
    return { isEnabled, isAvailable };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Customize Your Dashboard</DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your smart home dashboard
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={WIDGET_CATEGORIES[0].id} className="h-full">
          <TabsList className="grid grid-cols-6 w-full mb-4">
            {WIDGET_CATEGORIES.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs px-2">
                <category.icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{category.title.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-[400px] pr-4">
            {WIDGET_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0 space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-semibold text-lg">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                
                <div className="grid gap-3">
                  {AVAILABLE_WIDGETS
                    .filter(widget => widget.category === category.id)
                    .map((widget) => {
                      const { isEnabled, isAvailable } = getWidgetStatus(widget);
                      
                      return (
                        <Card key={widget.id} className={`transition-all duration-200 hover:shadow-md ${isEnabled ? 'border-primary bg-primary/5' : ''} ${!isAvailable ? 'opacity-60' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{widget.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                {!isAvailable && (
                                  <Badge variant="outline" className="text-xs">
                                    Limited Data
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {widget.size}
                                </Badge>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(enabled) => handleToggleWidget(widget.id, enabled)}
                                />
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-2">
                              {widget.description}
                            </p>
                            {widget.requiredData && widget.requiredData.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  Data: {widget.requiredData.join(', ')}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
        
        <div className="flex justify-between items-center pt-4 border-t bg-background">
          <p className="text-sm text-muted-foreground">
            {selectedWidgets.filter(w => w.enabled).length} widgets enabled
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}