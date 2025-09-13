import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, LayoutGrid } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { DEFAULT_DASHBOARD_LAYOUT, shouldShowWidget, getWidgetGridClass } from "@/lib/widgets";
import { useGekkoApi } from "@/hooks/useGekkoApi";
import { WidgetSelector } from "./WidgetSelector";

interface WidgetDashboardProps {
  onOpenSettings?: () => void;
}

export function WidgetDashboard({ onOpenSettings }: WidgetDashboardProps) {
  const { data, status, isLoading, connectionStatus } = useGekkoApi({ refreshInterval: 30000 });
  const [userWidgets, setUserWidgets] = useState<WidgetConfig[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  // Load user's widget configuration from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setUserWidgets(parsed);
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
      }
    }
  }, []);

  // Save widget configuration to localStorage
  const saveLayout = (widgets: WidgetConfig[]) => {
    localStorage.setItem('dashboard-layout', JSON.stringify(widgets));
    setUserWidgets(widgets);
  };

  // Filter widgets based on available data and enabled status
  const visibleWidgets = userWidgets.filter(widget => 
    widget.enabled && shouldShowWidget(widget, { ...data, ...status })
  );

  // Extract meaningful data for widgets
  const widgetData = {
    power: {
      consumption: status?.power?.consumption || 0,
      solar: status?.power?.solar || 0,
      battery: status?.power?.battery || 0
    },
    climate: {
      temperature: status?.temperature || data?.temperature || 21,
      humidity: status?.humidity || data?.humidity || 45,
      airQuality: 'Good'
    },
    security: {
      status: status?.security?.status || 'armed',
      doors: { locked: 3, total: 3 }
    },
    lighting: {
      active: status?.lighting?.active || 3,
      total: status?.lighting?.total || 12,
      autoMode: false
    },
    building: {
      name: 'Smart Home',
      address: '123 Smart Street, Tech City',
      type: 'Residential',
      yearBuilt: 2020,
      area: 180,
      rooms: 6,
      floors: 2,
      energyClass: 'A+',
      gekkoId: 'K999-7UOZ-8ZYZ-6TH3',
      connectionStatus: connectionStatus
    },
    weather: {
      temperature: 22,
      condition: 'partly-cloudy',
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      pressure: 1013,
      uvIndex: 5,
      location: 'Current Location'
    },
    alarms: status?.alarms || []
  };

  if (isLoading && visibleWidgets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Home Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {visibleWidgets.length} active widget{visibleWidgets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowWidgetSelector(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
          {onOpenSettings && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenSettings}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure
            </Button>
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      {visibleWidgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          {visibleWidgets
            .sort((a, b) => a.order - b.order)
            .map((widget) => {
              const WidgetComponent = widget.component;
              return (
                <div key={widget.id} className={getWidgetGridClass(widget.size)}>
                  <WidgetComponent
                    data={widgetData}
                    status={status}
                    isLoading={isLoading}
                    size={widget.size}
                    settings={widget.settings}
                  />
                </div>
              );
            })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Widgets Active</h3>
              <p className="text-muted-foreground">
                Add widgets to personalize your dashboard
              </p>
            </div>
            <Button onClick={() => setShowWidgetSelector(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Widget
            </Button>
          </div>
        </Card>
      )}

      {/* Widget Selector Modal */}
      <WidgetSelector
        open={showWidgetSelector}
        onOpenChange={setShowWidgetSelector}
        currentWidgets={userWidgets}
        availableData={widgetData}
        onSave={saveLayout}
      />
    </div>
  );
}